// src/styles/desktop.js
// Desktop layout: single full-width fixed topbar at top holding branding,
// nav (dock-style, same look/animation as the mobile bottom nav, just
// relocated here with its sliding indicator on the bottom edge of the
// bar), and theme/logout — no separate bottom bar, no rounded corners.
// main-area fills the rest of the viewport below it.
// Semua di sini disembunyikan di mobile lewat media query src/styles/mobile.js.
export function getDesktopStyles(C, SANS) {
  return `
    .app-shell { display: flex; flex-direction: column; height: 100vh; }

    .desktop-topbar {
      position: fixed; top: 0; left: 0; right: 0; height: 64px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px; border-bottom: 1px solid ${C.line};
      background: ${C.bg}; z-index: 20;
    }

    .desktop-top-nav {
      position: relative; height: 100%;
      display: flex; align-items: center; gap: 4px;
    }

    .main-area {
      flex: 1; min-width: 0; width: 100%;
      height: 100vh; overflow-y: auto; box-sizing: border-box;
      padding: 96px 0 60px;
    }

    .main-area-inner {
      max-width: 880px; margin: 0 auto;
      padding: 0 24px; box-sizing: border-box;
    }
  `;
}
