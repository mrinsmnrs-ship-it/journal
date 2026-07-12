// src/appStyles.js
// Global CSS untuk layout responsif (sidebar+chat panel desktop vs
// topbar+bottom-nav mobile). Dipisah dari App.jsx supaya file komponen
// tidak lagi bercampur dengan ratusan baris string CSS.
export function getAppStyles(C) {
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

          .app-shell { display: flex; height: 100vh; }

          .sidebar {
            width: 252px; flex-shrink: 0; padding: 28px 20px;
            border-right: 1px solid ${C.line}; display: flex; flex-direction: column;
            position: fixed; top: 0; left: 0; height: 100vh; overflow: hidden;
            background: ${C.bg}; z-index: 15;
          }
          .main-area {
            flex: 1; min-width: 0; padding: 40px 48px 60px;
            margin-left: 252px; margin-right: calc((100vw - 252px) / 2);
            height: 100vh; overflow-y: auto; box-sizing: border-box;
          }

          .desktop-chat-panel {
            width: calc((100vw - 252px) / 2);
            border-left: 1px solid ${C.line};
            position: fixed; top: 0; right: 0; height: 100vh;
            background: ${C.bg}; z-index: 15;
            display: flex; flex-direction: column; align-items: stretch;
          }
          .desktop-chat-panel > * { width: 100%; flex: 1; min-width: 0; }

          .bottom-nav { display: none; }
          .mobile-topbar { display: none; }
          .perf-marquee { display: none; }
          .app-footer-mobile { display: none; }

          .nav-item-desktop {
            display:flex; align-items:center; padding: 11px 12px; border-radius: 0;
            font-family: ${SANS}; font-size:16px; font-weight:600; letter-spacing: -0.015em;
            cursor:pointer; border:none; background:transparent;
            width: calc(100% - 16px); text-align:left; margin-bottom:2px; transition: color .12s ease, background .12s ease;
          }
          .nav-item-desktop:hover { color: ${C.ink}; }

          .chat-mode { height: var(--app-vh, 100dvh); overflow: hidden; }
          .chat-mode .main-area {
            display: flex; flex-direction: column; overflow: hidden;
          }

          /* Mobile: everything sized by real flex layout instead of guessed
             pixel offsets, so the topbar can never clip the top of the
             content and the bottom nav can never leave a leftover gap
             (this was the root cause of both issues — fixed-position bars
             paired with padding values that didn't exactly match their
             real rendered height). */
          @media (max-width: 820px) {
            .app-root {
              display: flex; flex-direction: column;
              height: var(--app-vh, 100dvh); overflow: hidden;
            }
            .app-shell {
              flex: 1; min-height: 0; height: auto;
              flex-direction: column;
            }
            .sidebar { display: none; }
            .desktop-chat-panel { display: none; }
            .mobile-topbar {
              display: flex; position: static; flex-shrink: 0;
              justify-content: space-between; align-items: center;
              background: ${C.bg}; padding: 14px 16px; border-bottom: 1px solid ${C.line};
            }
            .perf-marquee {
              display: block; position: static; flex-shrink: 0;
              overflow: hidden; white-space: nowrap;
              background: ${C.bg}; border-bottom: 1px solid ${C.line};
              padding: 6px 0;
            }
            .perf-marquee-track {
              display: inline-flex; width: max-content;
              animation: perf-marquee-scroll 32s linear infinite;
            }
            @keyframes perf-marquee-scroll {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            .main-area {
              flex: 1; min-height: 0; height: auto; overflow-y: auto;
              padding: 16px; max-width: 100%; margin-left: 0; margin-right: 0;
            }
            .bottom-nav {
              display: flex; position: relative; flex-shrink: 0;
              background: ${C.bg}; border-top: 1px solid ${C.line};
              justify-content: space-around; padding: 10px 0 14px;
            }
            .app-footer-mobile {
              display: block; text-align: center; font-size: 11px; color: ${C.faint};
              opacity: 0.7; margin-top: 32px; padding-bottom: 8px;
            }
            .chat-mode .main-area { padding: 0 16px 0; }
          }
  `;
}
