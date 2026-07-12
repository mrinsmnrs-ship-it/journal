// src/styles/base.js
// Global resets and rules shared by both mobile and desktop layouts.
// Mobile-only elements (bottom nav, mobile topbar, perf marquee, mobile
// footer) default to hidden here; src/styles/mobile.js turns them on
// inside its own media query.
export function getBaseStyles(C, SANS) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,500&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap');
    * { box-sizing: border-box; }
    html, body { margin:0; height: 100%; background: ${C.bg}; }
    button { -webkit-tap-highlight-color: transparent; transition: transform .1s ease; }
    button:active:not(:disabled) { transform: scale(0.96); }
    .no-press, .no-press:active { transform: none !important; }
    input::placeholder, textarea::placeholder { color: ${C.inputPlaceholder}; }
    input, textarea { font-family: ${SANS}; }
    input:focus, textarea:focus { border-color: ${C.clay} !important; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 0; }
    .recharts-wrapper, .recharts-wrapper svg, .recharts-surface { overflow: visible !important; }

    .bottom-nav { display: none; }
    .mobile-topbar { display: none; }
    .perf-marquee { display: none; }
    .app-footer-mobile { display: none; }
    .circular-text-dock { display: none; }

    .chat-mode { height: var(--app-vh, 100dvh); overflow: hidden; }
    .chat-mode .main-area {
      display: flex; flex-direction: column; overflow: hidden;
    }
    .chat-mode .main-area-inner {
      display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;
    }
  `;
}
