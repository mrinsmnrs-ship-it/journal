// src/styles/desktop.js
// Desktop layout: fixed sidebar + main area (satu halaman per waktu,
// termasuk AI Chat yang sekarang jadi salah satu nav item, bukan panel
// permanen), semuanya di .app-shell sebagai flex row. Semua di sini
// disembunyikan di mobile lewat media query src/styles/mobile.js.
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
      margin-left: 252px;
      height: 100vh; overflow-y: auto; box-sizing: border-box;
    }

    .nav-item-desktop {
      display:flex; align-items:center; padding: 11px 12px; border-radius: 0;
      font-family: ${SANS}; font-size:16px; font-weight:600; letter-spacing: -0.015em;
      cursor:pointer; border:none; background:transparent;
      width: calc(100% - 16px); text-align:left; margin-bottom:2px; transition: color .12s ease, background .12s ease;
    }
    .nav-item-desktop:hover { color: ${C.ink}; }
  `;
}
