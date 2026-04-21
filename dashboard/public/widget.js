/**
 * SIBY-WIDGET — Enterprise v4.0 (Premium Glassmorphism)
 * Robust Shadow DOM Integration with Tool Calling Support.
 */
(function (window, document) {
  "use strict";

  const SIBY_API = "https://vhchlbmzihnkoyrofsfs.supabase.co/functions/v1/chat-agent";
  const STORAGE_PREFIX = "siby_";
  const VISITOR_KEY = "siby_vid";

  const scriptTag = document.currentScript || document.querySelector('script[data-agent-id]');
  if (!scriptTag) return;
  const AGENT_ID = scriptTag.getAttribute("data-agent-id");
  if (!AGENT_ID) return;

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

  async function fetchConfig() {
    try {
      const res = await fetch(`${SIBY_API}?config=1&agentId=${AGENT_ID}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.error("[Siby] Config error:", e);
    }
    return null;
  }

  async function init() {
    const cfg = await fetchConfig();
    if (!cfg) return;

    const host = document.createElement("div");
    host.id = "siby-widget-root";
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = getStyles(cfg);
    shadow.appendChild(styleEl);

    const container = document.createElement("div");
    container.id = "siby-container";
    container.innerHTML = getTemplate(cfg);
    shadow.appendChild(container);

    injectFont(cfg.font_family || "DM Sans");
    setupLogic(shadow, cfg);
  }

  function injectFont(fontName) {
    const sanitized = fontName.replace(/\s+/g, "+");
    if (!document.querySelector(`link[href*="${sanitized}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.split(',')[0].replace(/'/g, '').trim().replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
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
        <div id="siby-footer">
          <div id="siby-input-area">
            <textarea id="siby-input" placeholder="${cfg.placeholder_text || 'Écrivez ici...'}" rows="1"></textarea>
            <button id="siby-send">➤</button>
          </div>
          <div class="siby-branding">Propulsé par <a href="https://siby-widget.com" target="_blank">Siby AI</a></div>
        </div>
      </div>
      <div id="siby-launcher" role="button" aria-label="Chat" tabindex="0">
        <span id="siby-launcher-icon">${cfg.button_icon || "🤖"}</span>
      </div>
    `;
  }

  function getStyles(cfg) {
    const primary = cfg.primary_color || "#0A0A0A";
    const accent = cfg.accent_color || "#C0C0C0";
    const isDark = cfg.widget_theme === "dark" || (cfg.widget_theme === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    const font = cfg.font_family || 'DM Sans';
    const blur = cfg.glass_blur || "12px";
    const opacity = cfg.glass_opacity || "0.1";
    const anim = cfg.entrance_animation || "fade-up";

    const bgBase = isDark ? `rgba(10, 10, 10, ${1 - opacity})` : `rgba(255, 255, 255, ${1 - opacity})`;
    
    return `
      :host { --siby-primary: ${primary}; --siby-accent: ${accent}; }
      #siby-container * { box-sizing: border-box; font-family: '${font}', sans-serif; -webkit-font-smoothing: antialiased; }
      
      #siby-container { 
        position: fixed; z-index: 2147483647; 
        ${cfg.position?.includes("left") ? "left:24px" : "right:24px"}; 
        ${cfg.position?.includes("top") ? "top:24px" : "bottom:24px"};
        display:flex; flex-direction:column; align-items: ${cfg.position?.includes("left") ? "flex-start" : "flex-end"};
      }

      #siby-launcher {
        width: 64px; height: 64px; border-radius: 20px;
        background: linear-gradient(135deg, var(--siby-primary) 0%, #1a1a1a 100%);
        box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 30px; transition: all 0.4s cubic-bezier(.16,1,.3,1);
      }
      #siby-launcher:hover { transform: scale(1.08) translateY(-4px); box-shadow: 0 15px 40px rgba(0,0,0,0.5); }
      #siby-launcher.open { transform: rotate(90deg) scale(0.9); opacity: 0.8; }

      #siby-window {
        width: 400px; max-width: calc(100vw - 48px); height: 650px; max-height: calc(100vh - 120px);
        background: ${bgBase}; backdrop-filter: blur(${blur}); -webkit-backdrop-filter: blur(${blur});
        border-radius: ${cfg.border_radius || '24px'};
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
        box-shadow: 0 24px 80px rgba(0,0,0,0.4); display: flex; flex-direction: column;
        overflow: hidden; margin-bottom: 16px; transform-origin: center bottom;
        animation: siby-${anim} 0.5s cubic-bezier(.16,1,.3,1) forwards;
        color: ${isDark ? '#F0F0F0' : '#111'};
      }

      #siby-header {
        padding: 20px; background: linear-gradient(to right, var(--siby-primary), rgba(0,0,0,0.2)); color: #fff;
        display: flex; align-items: center; gap: 14px;
      }
      #siby-avatar { width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; position: relative; font-size: 24px; border: 1px solid rgba(255,255,255,0.1); }
      #siby-status { width: 12px; height: 12px; background: #22C55E; border-radius: 50%; position: absolute; bottom: -2px; right: -2px; border: 2px solid #000; }
      .siby-header-info { flex: 1; }
      .siby-title { font-weight: 800; font-size: 16px; letter-spacing: -0.3px; }
      .siby-status-text { font-size: 11px; opacity: 0.6; font-weight: 500; }
      .siby-actions button { background: rgba(255,255,255,0.1); border: none; color: #fff; cursor: pointer; width: 30px; height: 30px; border-radius: 50%; font-size: 12px; transition: all 0.2s; }
      .siby-actions button:hover { background: rgba(255,255,255,0.2); }

      #siby-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth; }
      #siby-messages::-webkit-scrollbar { width: 4px; }
      #siby-messages::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 10px; }

      .siby-msg { max-width: 85%; padding: 12px 16px; border-radius: 18px; font-size: 14.5px; line-height: 1.6; animation: siby-msg-in 0.3s ease-out forwards; }
      .siby-msg.bot { align-self: flex-start; background: ${isDark ? 'rgba(255,255,255,0.06)' : '#F2F4F7'}; color: inherit; border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
      .siby-msg.user { align-self: flex-end; background: var(--siby-primary); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

      #siby-footer { padding: 16px 20px 20px; background: rgba(0,0,0,0.03); border-top: 1px solid rgba(128,128,128,0.1); }
      #siby-input-area { display: flex; gap: 10px; align-items: flex-end; background: ${isDark ? 'rgba(255,255,255,0.04)' : '#fff'}; border: 1px solid rgba(128,128,128,0.2); border-radius: 16px; padding: 6px 10px; transition: border-color 0.3s; }
      #siby-input-area:focus-within { border-color: var(--siby-accent); }
      #siby-input { flex: 1; border: none; background: transparent; padding: 8px 4px; font-size: 14.5px; outline: none; color: inherit; resize: none; max-height: 120px; }
      #siby-send { width: 36px; height: 36px; border-radius: 12px; background: var(--siby-primary); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: transform 0.2s; }
      #siby-send:hover { transform: scale(1.1); }
      
      .siby-branding { text-align: center; font-size: 10px; opacity: 0.4; margin-top: 10px; }
      .siby-branding a { color: inherit; text-decoration: none; font-weight: 700; }

      @keyframes siby-fade-up { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes siby-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes siby-scale-up { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
      @keyframes siby-bounce-in { 0%{opacity:0; transform:scale(0.3)} 50%{transform:scale(1.05)} 70%{transform:scale(0.9)} 100%{opacity:1; transform:scale(1)} }
      @keyframes siby-msg-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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

    session.history.forEach(m => appendUI(m.role, m.content));
    if (!session.history.length) appendUI("assistant", cfg.welcome_message);

    launcher.onclick = () => {
      const open = win.style.display === "none";
      win.style.display = open ? "flex" : "none";
      launcher.classList.toggle("open", open);
      if (open) { input.focus(); messages.scrollTop = messages.scrollHeight; }
    };

    closeBtn.onclick = (e) => { e.stopPropagation(); launcher.click(); };
    clearBtn.onclick = (e) => { 
      e.stopPropagation();
      if(confirm("Effacer l'historique ?")) { 
        session.history = []; saveSession(session); 
        messages.innerHTML = ""; appendUI("assistant", cfg.welcome_message); 
      } 
    };

    async function submit() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      appendUI("user", text);
      session.history.push({ role: "user", content: text });
      
      const typing = showTyping();
      messages.scrollTop = messages.scrollHeight;

      try {
        const res = await fetch(SIBY_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: AGENT_ID, message: text, visitorId,
            sessionId: session.sessionId, history: session.history.slice(-10)
          })
        });
        const data = await res.json();
        typing.remove();
        if (data.reply) {
          appendUI("assistant", data.reply);
          session.history.push({ role: "assistant", content: data.reply });
          if (data.sessionId) session.sessionId = data.sessionId;
          saveSession(session);
          messages.scrollTop = messages.scrollHeight;
        }
      } catch (e) {
        typing.remove();
        appendUI("assistant", "⚠️ Problème de connexion.");
      }
    }

    sendBtn.onclick = submit;
    input.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } };

    function appendUI(role, content) {
      if(!content) return;
      const el = document.createElement("div");
      el.className = `siby-msg ${role === "user" ? "user" : "bot"}`;
      el.innerHTML = content.replace(/\n/g, '<br>');
      messages.appendChild(el);
    }

    function showTyping() {
      const el = document.createElement("div");
      el.className = "siby-msg bot";
      el.style.opacity = "0.6";
      el.innerHTML = "•••";
      messages.appendChild(el);
      return el;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(window, document);
