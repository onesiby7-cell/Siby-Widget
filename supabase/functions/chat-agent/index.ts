// supabase/functions/chat-agent/index.ts
// Edge Function Agentique v2.0 : Support du Tool Calling (Function Calling)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agent-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface ChatRequest {
  agentId: string;
  message: string;
  sessionId?: string;
  visitorId: string;
  history?: Array<{ role: string; content: string; tool_calls?: any; tool_call_id?: string }>;
  metadata?: {
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
  };
}

// ── Définition des Outils (Tools) ───────────────────────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "submit_lead",
      description: "Appeler cette fonction dès que le visiteur fournit des informations de contact (nom, email ou téléphone) pour le recontacter.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nom complet du visiteur" },
          email: { type: "string", description: "Adresse email valide" },
          phone: { type: "string", description: "Numéro de téléphone" },
          company: { type: "string", description: "Nom de l'entreprise" },
          notes: { type: "string", description: "Toute information supplémentaire utile" }
        },
        required: ["email"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "notify_admin",
      description: "Envoyer une notification urgente à l'administrateur concernant cette session.",
      parameters: {
        type: "object",
        properties: {
          priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
          reason: { type: "string", description: "Raison de la notification" }
        },
        required: ["reason"]
      }
    }
  }
];

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

// ── Main handler ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const isConfigReq = url.searchParams.get("config") === "1";
  const agentId = isConfigReq ? url.searchParams.get("agentId") : null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing env secrets");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ── Mode : Config (GET) ────────────────────────
    if (isConfigReq && agentId) {
      // 🛡️ SÉCURITÉ & ROBUSTESSE : On sélectionne explicitement les champs pour éviter les erreurs de cache de schéma
      const { data: agent, error: configError } = await supabase
        .from("agents")
        .select("id, name, description, status, primary_color, secondary_color, accent_color, button_icon, chat_title, chat_subtitle, welcome_message, avatar_url, widget_theme, font_family, position, glass_blur, glass_opacity, entrance_animation, placeholder_text")
        .eq("id", agentId)
        .single();
      
      if (configError || !agent) {
        return new Response(JSON.stringify({ error: "Agent non configuré" }), { status: 404, headers: corsHeaders });
      }

      return new Response(JSON.stringify(agent), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    // ── Mode : Chat (POST) ────────────────────────────────────
    const body: ChatRequest = await req.json();
    const { agentId: postAgentId, message, sessionId, visitorId, history = [], metadata } = body;
    const startTime = Date.now();

    // Récupération de l'agent (tous statuts confondus pour pouvoir agir intelligemment)
    const { data: agent, error: agentError } = await supabase
      .from("agents").select("*").eq("id", postAgentId).single();

    if (agentError || !agent) return new Response(JSON.stringify({ error: "Agent non trouvé" }), { status: 404, headers: corsHeaders });

    // 🔒 SÉCURITÉ : Vérification du blocage client (Paiement/Status)
    if (agent.status !== 'active') {
      return new Response(JSON.stringify({ 
        reply: "🛡️ Ce service est temporairement suspendu ou en cours de configuration. Veuillez contacter l'administrateur si vous pensez qu'il s'agit d'une erreur.",
        error: "AGENT_INACTIVE" 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gestion de session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession } = await supabase.from("sessions").insert({
        agent_id: agent.id, visitor_id: visitorId, page_url: metadata?.pageUrl
      }).select("id").single();
      currentSessionId = newSession?.id;
      await supabase.rpc("increment_agent_sessions", { agent_id_param: agent.id });
    }

    // ── Appel Groq avec Tool Calling ────────────────────────
    const groqKey = agent.groq_api_key || Deno.env.get("GROQ_API_KEY");
    const systemContent = `Tu es "${agent.name}", un agent IA de haut niveau pour Siby Enterprise.
DESCRIPTION DE L'ENTREPRISE:
${agent.description || "Une entreprise innovante."}

📚 BASE DE CONNAISSANCES:
${agent.knowledge_base || "Informations générales sur le service."}

COMPORTEMENT AGENTIQ:
1. Sois CURIEUX : Si l'utilisateur pose une question vague, demande-lui des précisions sur son projet ou ses besoins.
2. Sois PROACTIF : Ton but est d'aider le visiteur à avancer. Si tu sens un intérêt, propose de prendre ses coordonnées.
3. Sois SOLIDE : Ne donne pas d'informations dont tu n'es pas sûr.
4. Ton style est professionnel, chaleureux et efficace.

Utilise l'outil 'submit_lead' dès que tu as des infos de contact précises.`;

    let messages = [
      { role: "system", content: systemContent },
      ...history.slice(-12),
      { role: "user", content: message }
    ];

    const groqCall = async (msgs: any[]) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: agent.model || "llama-3.1-70b-versatile",
          messages: msgs,
          tools: TOOLS,
          tool_choice: "auto",
          temperature: agent.temperature || 0.6,
        }),
      });
      return await res.json();
    };

    let groqData = await groqCall(messages);
    let toolExecResult = null;

    // ── Boucle d'exécution des outils (Tool Execution) ──────────
    if (groqData.choices?.[0]?.message?.tool_calls) {
      const toolCalls = groqData.choices[0].message.tool_calls;
      messages.push(groqData.choices[0].message);

      for (const call of toolCalls) {
        const name = call.function.name;
        const args = JSON.parse(call.function.arguments);
        let result = { status: "error", message: "Unknown tool" };

        if (name === "submit_lead" && currentSessionId) {
          const { error: leadErr } = await supabase.from("leads").upsert({
            agent_id: agent.id, session_id: currentSessionId, user_id: agent.user_id,
            name: args.name, email: args.email, phone: args.phone, source: "AgentIQ_Lead"
          });
          
          if (!leadErr) {
            await supabase.from("sessions").update({ is_lead: true, lead_email: args.email }).eq("id", currentSessionId);
            
            const notificationMsg = `🚀 Nouveau Lead pour ${agent.name} !\n\n👤 Nom: ${args.name || "N/A"}\n📧 Email: ${args.email}\n📱 Tel: ${args.phone || "N/A"}\n📝 Notes: ${args.notes || "Aucune"}`;

            // 1. Notification Telegram (AUTO-DISCOVERY PLATINUM)
            if (agent.telegram_bot_token) {
               try {
                 let chatId = agent.telegram_chat_id;
                 
                 // Si l'ID est manquant, on tente de le découvrir via /getUpdates
                 if (!chatId) {
                   const tgUpdates = await fetch(`https://api.telegram.org/bot${agent.telegram_bot_token}/getUpdates?limit=5&offset=-1`).then(r => r.json());
                   if (tgUpdates.ok && tgUpdates.result?.length > 0) {
                     // On prend le dernier message reçu ou le dernier ajout au groupe
                     const lastUpdate = tgUpdates.result[tgUpdates.result.length - 1];
                     chatId = (lastUpdate.message?.chat?.id || lastUpdate.my_chat_member?.chat?.id)?.toString();
                     
                     if (chatId) {
                       console.log(`[Siby] 📡 Auto-Discovery Telegram: New Chat ID found (${chatId}) for agent ${agent.id}`);
                       await supabase.from("agents").update({ telegram_chat_id: chatId }).eq("id", agent.id);
                     }
                   }
                 }

                 if (chatId) {
                   await fetch(`https://api.telegram.org/bot${agent.telegram_bot_token}/sendMessage`, {
                     method: "POST", headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ chat_id: chatId, text: notificationMsg })
                   });
                 }
               } catch (e) { console.error("Telegram Error:", e); }
            }

            // 2. Notification EmailJS
            if (agent.email_capture_enabled && agent.emailjs_service_id) {
               await sendEmailNotification(agent.emailjs_service_id, agent.emailjs_template_id, agent.emailjs_public_key, {
                 agent_name: agent.name, lead_name: args.name || "Client potentiel", lead_email: args.email
               });
            }
            result = { status: "success", message: "Lead enregistré et notifications envoyées." };
            toolExecResult = "lead_captured";
          }
        }

        if (name === "notify_admin") {
          // Logique notification (par exemple via une table notifications ou Telegram plus tard)
          result = { status: "success", message: "Administrateur notifié." };
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result)
        });
      }

      // Deuxième appel Groq pour générer la réponse finale après exécution d'outils
      groqData = await groqCall(messages);
    }

    const reply = groqData.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse.";
    const latency = Date.now() - startTime;

    // Sauvegarde des messages final
    if (currentSessionId) {
      await supabase.from("messages").insert([
        { session_id: currentSessionId, agent_id: agent.id, role: "user", content: message },
        { session_id: currentSessionId, agent_id: agent.id, role: "assistant", content: reply, latency_ms: latency }
      ]);
    }

    return new Response(JSON.stringify({
      reply,
      sessionId: currentSessionId,
      isLead: toolExecResult === "lead_captured",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
