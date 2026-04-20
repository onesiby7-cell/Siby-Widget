// supabase/functions/crawler/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL manquante" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Crawling: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "SibyCrawler/1.0 (+https://siby-widget.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const html = await response.text();

    // ── Extraction basique du texte ──
    // On retire les scripts, styles et tags pour ne garder que le contenu "utile"
    let cleanText = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // On limite à 10 000 caractères pour ne pas exploser le prompt système
    if (cleanText.length > 10000) {
      cleanText = cleanText.substring(0, 10000) + "... (tronqué)";
    }

    return new Response(JSON.stringify({ 
      success: true, 
      url, 
      content: cleanText 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Crawler error:", error);
    return new Response(JSON.stringify({ error: "Impossible de lire le site. Vérifiez l'URL ou les permissions." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
