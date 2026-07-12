// src/styles/desktop.js
// Desktop layout: full-width fixed topbar (branding + theme/logout) at
// top, a floating centered pill nav at the bottom (not full-width), and
// main-area filling the space between them. Satu halaman per waktu,
// termasuk AI Chat yang sekarang jadi salah satu nav item di bottom nav.
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

    .main-area {
      flex: 1; min-width: 0; width: 100%;
      padding: 96px 48px 128px;
      height: 100vh; overflow-y: auto; box-sizing: border-box;
    }

    .desktop-bottom-nav {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 2px;
      background: ${C.paperSoft}; border: 1px solid ${C.line}; border-radius: 999px;
      padding: 6px; box-shadow: ${C.shadowPopover}; z-index: 20;
    }
  `;
}
