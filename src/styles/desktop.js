// src/styles/desktop.js
// Desktop layout: fixed sidebar + main area + permanent AI chat panel,
// all laid out with .app-shell as a flex row. Everything here is hidden
// on mobile by src/styles/mobile.js's media query.
export function getDesktopStyles(C, SANS) {
  return `
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

    .nav-item-desktop {
      display:flex; align-items:center; padding: 11px 12px; border-radius: 0;
      font-family: ${SANS}; font-size:16px; font-weight:600; letter-spacing: -0.015em;
      cursor:pointer; border:none; background:transparent;
      width: calc(100% - 16px); text-align:left; margin-bottom:2px; transition: color .12s ease, background .12s ease;
    }
    .nav-item-desktop:hover { color: ${C.ink}; }
  `;
}
