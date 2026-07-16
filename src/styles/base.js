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
    button { -webkit-tap-highlight-color: transparent; transition: transform .1s ease; outline: none; font-family: inherit; }
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

    /* Period filter chips (All Time / This Week / ... / Custom Range):
       default is the original 2-row layout (3 chips, then 2). Desktop
       overrides this into a single row — see desktop.js. */
    .period-chip-row-1 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin-bottom: 9px; }
    .period-chip-row-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; }

    .chat-mode { height: var(--app-vh, 100dvh); overflow: hidden; }
    .chat-mode .main-area {
      display: flex; flex-direction: column; overflow: hidden;
    }
    .chat-mode .main-area-inner {
      display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;
    }

    /* Orientation guard: normalnya tersembunyi. Cuma dimunculkan lewat
       media query orientation:landscape di bawah, dan dibatasi max-width
       supaya layar desktop/laptop yang natural-nya landscape TIDAK ikut
       ketutup — cuma menyasar layar sempit ala HP yang lagi dimiringkan. */
    .orientation-lock-overlay {
      display: none;
      position: fixed; inset: 0; z-index: 9999;
      flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: 8px; padding: 24px;
    }
    @media (orientation: landscape) and (max-width: 926px) {
      .orientation-lock-overlay { display: flex; }
    }
  `;
}
