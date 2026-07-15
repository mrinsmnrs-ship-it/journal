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
    .recharts-surface { shape-rendering: geometricPrecision; }
    .recharts-surface text, .recharts-text { text-rendering: optimizeLegibility; }

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

    /* Hamburger menu (topbar): tombol 2 garis tanpa border yang berubah
       jadi silang saat aktif, membuka panel yang sembul dari kanan. */
    .hamburger-root { position: relative; display: inline-flex; }
    .hamburger-btn {
      position: relative;
      width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      background: transparent; border: none; padding: 0; cursor: pointer;
    }
    .hamburger-line {
      position: absolute; left: 8px;
      width: 18px; height: 2px; border-radius: 1px;
      transition: transform .28s cubic-bezier(.4,0,.2,1), top .28s cubic-bezier(.4,0,.2,1);
    }
    .hamburger-line:first-child { top: 13px; }
    .hamburger-line:last-child { top: 20px; }
    .hamburger-btn.open .hamburger-line:first-child {
      top: 16px; transform: rotate(45deg);
    }
    .hamburger-btn.open .hamburger-line:last-child {
      top: 16px; transform: rotate(-45deg);
    }

    .hamburger-panel {
      position: absolute; top: calc(100% + 10px); right: 0;
      min-width: 210px; display: flex; flex-direction: column;
      padding: 6px; border-radius: 0; z-index: 50;
      opacity: 0; visibility: hidden;
      transform: translateX(18px);
      transition: transform .25s cubic-bezier(.4,0,.2,1), opacity .2s ease, visibility .25s;
    }
    .hamburger-panel.open {
      opacity: 1; visibility: visible;
      transform: translateX(0);
    }
    .hamburger-panel-item {
      display: flex; align-items: center; gap: 10px; width: 100%;
      background: transparent; border: none; text-align: left;
      padding: 10px 12px; cursor: pointer; font-size: 14px; font-weight: 600;
    }
    .hamburger-panel-item:hover { background: rgba(128,136,144,0.12); }
    .hamburger-panel-divider { height: 1px; margin: 2px 4px; }
  `;
}
