// supabase/functions/chat-agent/index.ts
// Edge Function principale : routeur sécurisé entre widget, Supabase et Groq

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agent-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatRequest {
  agentId: string;
  message: string;
  sessionId?: string;
  visitorId: string;
  history?: Array<{ role: string; content: string }>;
  metadata?: {
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
  };
}

interface LeadInfo {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

// ── Détection de lead dans le message ───────────────────────
function extractLeadInfo(text: string): LeadInfo | null {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  const namePatterns = [
    /(?:je m'appelle|mon nom est|je suis)\s+([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+)?)/i,
    /(?:I'm|my name is|I am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];

  let name: string | undefined;
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) { name = match[1]; break; }
  }

  if (emailMatch || phoneMatch || name) {
    return {
      name,
      email: emailMatch?.[0],
      phone: phoneMatch?.[1]?.trim(),
    };
  }
  return null;
}

// ── Envoi email via EmailJS ──────────────────────────────────
async function sendEmailNotification(
  serviceId: string,
  templateId: string,
  publicKey: string,
  templateParams: Record<string, string>
) {
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams,
      }),
    });
    return response.ok;
  } catch (e) {
    console.error("EmailJS error:", e);
    return false;
  }
}

// ── Appel webhook ────────────────────────────────────────────
async function fireWebhook(
  url: string,
  secret: string,
  event: string,
  payload: unknown
) {
  try {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Siby-Signature": signature,
        "X-Siby-Event": event,
      },
      body,
    });
    return { success: res.ok, status: res.status };
  } catch (_e) {
    return { success: false, status: 0 };
  }
}

// ── Main handler ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const isConfigReq = url.searchParams.get("config") === "1";
  const agentId = isConfigReq ? url.searchParams.get("agentId") : null;

  try {
    // Client Supabase avec clé service (accès admin interne)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables");
      return new Response(JSON.stringify({ error: "Configuration serveur incomplète (Secrets)" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ── Mode : Récupération Config (GET) ────────────────────────
    if (isConfigReq && agentId) {
      console.log(`Fetching config for agent: ${agentId}`);
      const { data: agent, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();

      if (error || !agent) {
        console.error("Agent fetch error:", error);
        return new Response(JSON.stringify({ error: "Agent introuvable ou erreur DB" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify(agent), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  // ── Mode : Chat (POST) ────────────────────────────────────
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const startTime = Date.now();
    const body: ChatRequest = await req.json();
    const { agentId: postAgentId, message, sessionId, visitorId, history = [], metadata } = body;

    if (!postAgentId || !message || !visitorId) {
      return new Response(JSON.stringify({ error: "Paramètres manquants" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── Récupération de l'agent ──────────────────────────────
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", postAgentId)
      .eq("status", "active")
      .single();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: "Agent introuvable ou inactif" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }


    // ── Vérification domaine autorisé ────────────────────────
    if (agent.allowed_domains?.length > 0) {
      const origin = req.headers.get("origin") || "";
      const isAllowed = agent.allowed_domains.some((d: string) => origin.includes(d));
      if (!isAllowed) {
        return new Response(JSON.stringify({ error: "Domaine non autorisé" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── Filtre mots bloqués ──────────────────────────────────
    if (agent.blocked_keywords?.length > 0) {
      const lowerMsg = message.toLowerCase();
      const blocked = agent.blocked_keywords.some((kw: string) => lowerMsg.includes(kw.toLowerCase()));
      if (blocked) {
        return new Response(JSON.stringify({
          reply: "Je ne peux pas répondre à ce sujet. Comment puis-je vous aider autrement ?",
          sessionId,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ── Rate limiting simple ─────────────────────────────────
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: msgCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .gte("created_at", oneHourAgo);

    if ((msgCount ?? 0) >= (agent.rate_limit_per_hour * 10)) {
      return new Response(JSON.stringify({ error: "Limite de taux dépassée" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── Gestion de session ───────────────────────────────────
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession } = await supabase
        .from("sessions")
        .insert({
          agent_id: agentId,
          visitor_id: visitorId,
          page_url: metadata?.pageUrl,
          referrer: metadata?.referrer,
          visitor_browser: metadata?.userAgent?.substring(0, 200),
        })
        .select("id")
        .single();
      currentSessionId = newSession?.id;

      // Incrément total_sessions
      await supabase.rpc("increment_agent_sessions", { agent_id_param: agentId });
    }

    // ── Détection lead ───────────────────────────────────────
    const leadInfo = extractLeadInfo(message);
    if (leadInfo && currentSessionId) {
      await supabase.from("sessions").update({
        lead_name: leadInfo.name,
        lead_email: leadInfo.email,
        lead_phone: leadInfo.phone,
        is_lead: true,
        lead_captured_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      }).eq("id", currentSessionId);

      // Sauvegarder dans leads
      await supabase.from("leads").upsert({
        agent_id: agentId,
        session_id: currentSessionId,
        user_id: agent.user_id,
        name: leadInfo.name,
        email: leadInfo.email,
        phone: leadInfo.phone,
        source: "widget",
      });

      // Email notification si trigger = on_lead
      if (
        agent.email_capture_enabled &&
        agent.emailjs_service_id &&
        agent.email_capture_trigger === "on_lead"
      ) {
        const conversation = history.map((m: { role: string; content: string }) =>
          `${m.role === "user" ? "👤 Visiteur" : "🤖 Agent"}: ${m.content}`
        ).join("\n\n");

        await sendEmailNotification(
          agent.emailjs_service_id,
          agent.emailjs_template_id,
          agent.emailjs_public_key,
          {
            agent_name: agent.name,
            lead_name: leadInfo.name || "Inconnu",
            lead_email: leadInfo.email || "Non fourni",
            lead_phone: leadInfo.phone || "Non fourni",
            conversation: conversation + `\n\n👤 Visiteur: ${message}`,
            date: new Date().toLocaleDateString("fr-FR"),
            notification_email: agent.notification_email || "",
          }
        );
        await supabase.from("sessions").update({ email_sent: true }).eq("id", currentSessionId);
      }

      // Webhook lead.captured
      if (agent.webhook_url) {
        const result = await fireWebhook(agent.webhook_url, agent.webhook_secret, "lead.captured", {
          agentId, sessionId: currentSessionId, lead: leadInfo
        });
        await supabase.from("webhook_logs").insert({
          agent_id: agentId,
          event: "lead.captured",
          payload: { lead: leadInfo },
          response_status: result.status,
          success: result.success,
        });
      }
    }

    // ── Appel Groq ───────────────────────────────────────────
    const groqKey = agent.groq_api_key || Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      return new Response(JSON.stringify({ error: "Clé Groq non configurée" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const systemContent = [
      agent.system_prompt,
      agent.knowledge_base ? `\n\n📚 BASE DE CONNAISSANCES:\n${agent.knowledge_base}` : "",
      `\n\nTu t'appelles "${agent.name}". Réponds toujours de manière utile et concise.`,
    ].join("");

    const messages = [
      { role: "system", content: systemContent },
      ...history.slice(-10), // Garder les 10 derniers messages
      { role: "user", content: message },
    ];

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "llama-3.1-8b-instant",
        messages,
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 1024,
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      const err = await groqResponse.text();
      console.error("Groq error:", err);
      return new Response(JSON.stringify({ error: "Erreur IA" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const groqData = await groqResponse.json();
    const reply = groqData.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse.";
    const tokensUsed = groqData.usage?.total_tokens || 0;
    const latency = Date.now() - startTime;

    // ── Sauvegarder messages ─────────────────────────────────
    if (currentSessionId) {
      await supabase.from("messages").insert([
        {
          session_id: currentSessionId,
          agent_id: agentId,
          role: "user",
          content: message,
          model_used: agent.model,
        },
        {
          session_id: currentSessionId,
          agent_id: agentId,
          role: "assistant",
          content: reply,
          tokens_used: tokensUsed,
          model_used: agent.model,
          latency_ms: latency,
        },
      ]);

      // Mise à jour du compteur de messages de la session
      const { count: sessionMsgCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("session_id", currentSessionId);

      await supabase.from("sessions").update({
        last_message_at: new Date().toISOString(),
        message_count: sessionMsgCount ?? 0,
      }).eq("id", currentSessionId);
    }

    // ── Update stats agent ───────────────────────────────────
    await supabase.from("agents")
      .update({
        total_messages: (agent.total_messages || 0) + 2,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId);

    // ── Update quota utilisateur ─────────────────────────────
    await supabase.rpc("increment_messages_used", { user_id_param: agent.user_id });

    return new Response(JSON.stringify({
      reply,
      sessionId: currentSessionId,
      isLead: !!leadInfo,
      tokensUsed,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur interne" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
