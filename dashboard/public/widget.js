/**
 * SIBY-WIDGET — Platinum Enterprise v5.0
 * Total Iframe Isolation & Dynamic Resizing.
 */
(function (window, document) {
  "use strict";

  const scriptTag = document.currentScript || document.querySelector('script[data-agent-id]');
  if (!scriptTag) return;
  const AGENT_ID = scriptTag.getAttribute("data-agent-id");
  if (!AGENT_ID) return;

  const BASE_URL = scriptTag.src.split('/widget.js')[0];
  const EMBED_URL = `${BASE_URL}/embed/${AGENT_ID}`;

  function init() {
    // 1. Create the Host Container (The "Anchor")
    const container = document.createElement("div");
    container.id = "siby-widget-container";
    
    // Platinum Layout Security
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '80px',
      height: '80px',
      zIndex: '2147483647',
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      pointerEvents: 'none' // Allow clicks to pass through background
    });

    // 2. Create the Iframe (The "Portal")
    const iframe = document.createElement("iframe");
    iframe.id = "siby-widget-iframe";
    iframe.src = EMBED_URL;
    iframe.title = "Siby AI Assistant";
    iframe.scrolling = "no";
    iframe.frameBorder = "0";
    
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      background: 'transparent',
      colorScheme: 'light dark',
      pointerEvents: 'auto' // Re-enable clicks for the iframe itself
    });

    container.appendChild(iframe);
    document.body.appendChild(container);

    // 3. Dynamic Resizing Listener
    window.addEventListener("message", (event) => {
      // Security Check (Optional but recommended: verify event.origin)
      if (event.data && event.data.type === 'siby-resize') {
        const { width, height, state } = event.data;
        
        container.style.width = width;
        container.style.height = height;
        
        // Handle Mobile Fullscreen or specific logic if needed
        if (window.innerWidth < 480 && state === 'open') {
          container.style.bottom = '0';
          container.style.right = '0';
          container.style.width = '100vw';
          container.style.height = '100vh';
        } else {
          container.style.bottom = '20px';
          container.style.right = '20px';
        }
      }
    });

    console.log("[Siby] 🛡️ Platinum Isolation Active.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(window, document);