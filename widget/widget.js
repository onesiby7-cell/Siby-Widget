/**
 * SIBY-WIDGET — Robust Shadow DOM Integration v3.0
 * Pure isolation for styles and zero conflicts with host websites.
 */
(function (window, document) {
  "use strict";

  // ── Configuration & Constants ─────────────────────────────────
  const SIBY_API = "https://vhchlbmzihnkoyrofsfs.supabase.co/functions/v1/chat-agent";
  const STORAGE_PREFIX = "siby_";
  const VISITOR_KEY = "siby_vid";
  const MAX_HISTORY = 20;

  // ── Find Script & Agent ID ──────────────────────────────────
  const scriptTag = document.currentScript || document.querySelector('script[data-agent-id]');
  if (!scriptTag) {
    console.error("[SibyWidget] Script tag not found. Please use <script src='...' data-agent-id='...' async></script>");
    return;
  }
  const AGENT_ID = scriptTag.getAttribute("data-agent-id");
  if (!AGENT_ID) {
    console.warn("[SibyWidget] Missing data-agent-id attribute.");
    return;
  }

  // ── Storage Helpers ──────────────────────────────────────────
  function getVisitorId() {
    let vid = localStorage.getItem(VISITOR_KEY);
    if (!vid) {
      vid = "v_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(VISITOR_KEY, vid);
    }
    return vid;
  }

  const SESSION_KEY = STORAGE_PREFIX + AGENT_ID;
  function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}"); } catch { return {}; }
  }
  function saveSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  // ── Fetch Agent Config ───────────────────────────────────────
  async function fetchConfig() {
    try {
      const res = await fetch(`${SIBY_API}?config=1&agentId=${AGENT_ID}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("[SibyWidget] Failed to load config:", e);
    }
    return null;
  }

  // ── Main Controller ──────────────────────────────────────────
  async function init() {
    const cfg = await fetchConfig();
    if (!cfg) return;

    // Create Host Element
    const host = document.createElement("div");
    host.id = "siby-widget-root";
    document.body.appendChild(host);

    // Attach Shadow Root
    const shadow = host.attachShadow({ mode: "open" });

    // Build Style & HTML
    const styleEl = document.createElement("style");
    styleEl.textContent = getStyles(cfg);
    shadow.appendChild(styleEl);

    const container = document.createElement("div");
    container.id = "siby-container";
    container.innerHTML = getTemplate(cfg);
    shadow.appendChild(container);

    // Font injection (Google Fonts needs to be in head, cannot be in shadow DOM)
    injectFont(cfg.font_family || "DM Sans");

    // Logic Binding
    setupLogic(shadow, cfg);
  }

  function injectFont(fontName) {
    const sanitized = fontName.replace(/\s+/g, "+");
    if (!document.querySelector(`link[href*="${sanitized}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${sanitized}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }

  function getTemplate(cfg) {
    return `
      <div id="siby-window" style="display:none;">
        <div id="siby-header">
          <div id="siby-avatar">
            ${cfg.button_icon || "🤖"}
            <div id="siby-status"></div>
          </div>
          <div class="siby-header-info">
            <div class="siby-title">${cfg.chat_title || "Assistant"}</div>
            <div class="siby-status-text">${cfg.chat_subtitle || "En ligne"}</div>
          </div>
          <div class="siby-actions">
            <button id="siby-clear" title="Effacer">🗑</button>
            <button id="siby-close" title="Fermer">✕</button>
          </div>
        </div>
        <div id="siby-messages"></div>
        <div id="siby-quick-replies"></div>
        <div id="siby-footer">
          <div id="siby-input-area">
            <textarea id="siby-input" placeholder="${cfg.placeholder_text || 'Écrivez ici...'}" rows="1"></textarea>
            <button id="siby-send">➤</button>
          </div>
          <div class="siby-branding">Propulsé par <a href="https://siby-widget.com" target="_blank">Siby</a></div>
        </div>
      </div>
      <div id="siby-launcher" role="button" aria-label="Ouvrir le chat" tabindex="0">
        <span id="siby-launcher-icon">${cfg.button_icon || "🤖"}</span>
        <div id="siby-badge"></div>
      </div>
    `;
  }

  function getStyles(cfg) {
    const primary = cfg.primary_color || "#0A0A0A";
    const accent = cfg.accent_color || "#C0C0C0";
    const radius = cfg.border_radius || "16px";
    const isDark = cfg.widget_theme === "dark" || (cfg.widget_theme === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    
    return `
      :host { --siby-primary: ${primary}; --siby-accent: ${accent}; --siby-radius: ${radius}; }
      #siby-container * { box-sizing: border-box; font-family: '${cfg.font_family || 'DM Sans'}', sans-serif; }
      
      #siby-container { 
        position: fixed; z-index: 2147483647; 
        ${cfg.position?.includes("left") ? "left:20px" : "right:20px"}; 
        ${cfg.position?.includes("top") ? "top:20px" : "bottom:20px"};
        display:flex; flex-direction:column; align-items:flex-end;
      }

      #siby-launcher {
        width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(135deg, var(--siby-primary) 0%, #333 100%);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 26px; transition: transform 0.3s cubic-bezier(.34,1.56,.64,1);
        animation: siby-pulse 3s infinite;
      }
      #siby-launcher:hover { transform: scale(1.1); }
      #siby-launcher.open { transform: rotate(90deg); }

      #siby-window {
        width: 380px; max-width: calc(100vw - 40px); height: 600px; max-height: calc(100vh - 100px);
        background: ${isDark ? '#0F0F0F' : '#FFFFFF'}; border-radius: var(--siby-radius);
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
        box-shadow: 0 20px 60px rgba(0,0,0,0.4); display: flex; flex-direction: column;
        overflow: hidden; margin-bottom: 12px; transform-origin: right bottom;
        animation: siby-in 0.3s ease forwards;
      }

      #siby-header {
        padding: 16px; background: var(--siby-primary); color: #fff;
        display: flex; align-items: center; gap: 12px; flex-shrink: 0;
      }
      #siby-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; position: relative; font-size: 20px; }
      #siby-status { width: 10px; height: 10px; background: #22C55E; border-radius: 50%; position: absolute; bottom: 0; right: 0; border: 2px solid var(--siby-primary); }
      .siby-header-info { flex: 1; }
      .siby-title { font-weight: 700; font-size: 15px; }
      .siby-status-text { font-size: 11px; opacity: 0.7; }
      .siby-actions button { background: none; border: none; color: #fff; cursor: pointer; opacity: 0.6; padding: 4px; }
      .siby-actions button:hover { opacity: 1; }

      #siby-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
      .siby-msg { max-width: 85%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
      .siby-msg.bot { align-self: flex-start; background: ${isDark ? '#252525' : '#F0F2F5'}; color: ${isDark ? '#E8E8E8' : '#111'}; border-bottom-left-radius: 4px; }
      .siby-msg.user { align-self: flex-end; background: var(--siby-primary); color: #fff; border-bottom-right-radius: 4px; }

      #siby-footer { padding: 12px 16px; border-top: 1px solid ${isDark ? '#222' : '#EEE'}; }
      #siby-input-area { display: flex; gap: 8px; align-items: flex-end; }
      #siby-input { flex: 1; border: 1px solid ${isDark ? '#333' : '#DDD'}; border-radius: 10px; padding: 10px; font-size: 14px; outline: none; background: transparent; color: inherit; resize: none; max-height: 100px; }
      #siby-input:focus { border-color: var(--siby-accent); }
      #siby-send { width: 40px; height: 40px; border-radius: 10px; background: var(--siby-primary); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      
      .siby-branding { text-align: center; font-size: 10px; opacity: 0.5; margin-top: 8px; }
      .siby-branding a { color: inherit; text-decoration: none; font-weight: 700; }

      @keyframes siby-pulse { 0%,100%{box-shadow: 0 4px 20px rgba(0,0,0,0.3)} 50%{box-shadow: 0 4px 20px rgba(0,0,0,0.1), 0 0 0 10px var(--siby-primary)20} }
      @keyframes siby-in { from{opacity:0; transform:scale(0.9) translateY(20px)} to{opacity:1; transform:scale(1) translateY(0)} }
    `;
  }

  function setupLogic(shadow, cfg) {
    const launcher = shadow.getElementById("siby-launcher");
    const win = shadow.getElementById("siby-window");
    const messages = shadow.getElementById("siby-messages");
    const input = shadow.getElementById("siby-input");
    const sendBtn = shadow.getElementById("siby-send");
    const closeBtn = shadow.getElementById("siby-close");
    const clearBtn = shadow.getElementById("siby-clear");

    let session = loadSession();
    if (!session.history) session.history = [];
    const visitorId = getVisitorId();

    // Init display
    session.history.forEach(m => appendUI(m.role, m.content));
    if (!session.history.length) appendUI("assistant", cfg.welcome_message);

    launcher.onclick = () => {
      const open = win.style.display === "none";
      win.style.display = open ? "flex" : "none";
      launcher.classList.toggle("open", open);
      if (open) { 
        input.focus();
        messages.scrollTop = messages.scrollHeight;
      }
    };

    closeBtn.onclick = () => launcher.click();
    clearBtn.onclick = () => { if(confirm("Effacer l'historique ?")) { session.history = []; saveSession(session); messages.innerHTML = ""; appendUI("assistant", cfg.welcome_message); } };

    async function submit() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      appendUI("user", text);
      session.history.push({ role: "user", content: text });
      saveSession(session);
      
      messages.scrollTop = messages.scrollHeight;

      try {
        const res = await fetch(SIBY_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: AGENT_ID,
            message: text,
            visitorId,
            sessionId: session.sessionId,
            history: session.history.slice(-10)
          })
        });
        const data = await res.json();
        if (data.reply) {
          appendUI("assistant", data.reply);
          session.history.push({ role: "assistant", content: data.reply });
          if (data.sessionId) session.sessionId = data.sessionId;
          saveSession(session);
          messages.scrollTop = messages.scrollHeight;
        }
      } catch (e) {
        appendUI("assistant", "Erreur de connexion. Vérifiez votre réseau.");
      }
    }

    sendBtn.onclick = submit;
    input.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } };

    function appendUI(role, content) {
      if(!content) return;
      const el = document.createElement("div");
      el.className = `siby-msg ${role === "user" ? "user" : "bot"}`;
      el.textContent = content;
      messages.appendChild(el);
    }
  }

  // Auto-boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(window, document);
