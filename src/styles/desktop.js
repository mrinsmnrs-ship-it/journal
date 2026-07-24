// src/styles/desktop.js
// Desktop layout: full-width topbar at top holding branding, nav, and
// theme/logout, with the perf marquee right below it — no separate
// bottom bar, no rounded corners. main-area fills the rest of the
// viewport below it and scrolls internally.
//
// Sizing is driven by real flex layout instead of guessed pixel offsets
// (same approach as src/styles/mobile.js): topbar and marquee are normal
// (non-fixed) flex children stacked at the top of .app-shell, and
// .main-area is flex:1 with its own overflow-y:auto — so there's no
// pixel-matching between a fixed bar's height and a manually-set
// padding-top/bottom on the content below it.
// Semua di sini disembunyikan di mobile lewat media query src/styles/mobile.js.
export function getDesktopStyles(C, SANS) {
  return `
    .app-shell { display: flex; flex-direction: column; height: 100vh; }

    .desktop-topbar {
      flex-shrink: 0; height: 64px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 32px; border-bottom: 1px solid ${C.line};
      background: ${C.bg};
    }

    .desktop-top-nav {
      position: relative; height: 100%;
      display: flex; align-items: center; gap: 4px;
    }

    .main-area {
      flex: 1; min-width: 0; min-height: 0; width: 100%;
      overflow-y: auto; box-sizing: border-box;
      padding: 32px 0 60px;
    }

    /* Period filter header (Dashboard/Journal): a real flex sibling
       above .main-area, not part of the scrolling area — same idea as
       .perf-marquee — so it can never be scrolled over or peeked
       behind, no sticky-positioning edge cases involved. Background
       and border color come from inline styles set by the component
       itself (theme-driven), same pattern as .perf-marquee. */
    .period-filter-header {
      flex-shrink: 0;
      padding: 14px 16px 12px;
    }

    @media (min-width: 821px) {
      .main-area-inner {
        max-width: 880px; margin: 0 auto;
        padding: 0 24px; box-sizing: border-box;
      }

      .period-filter-header {
        padding: 16px 0 14px;
      }
      .period-filter-header-inner {
        max-width: 880px; margin: 0 auto;
        padding: 0 24px; box-sizing: border-box;
      }

      .perf-marquee {
        display: block; flex-shrink: 0;
        overflow: hidden; white-space: nowrap;
        background: ${C.bg}; border-bottom: 1px solid ${C.line};
        padding: 6px 0;
      }
      .perf-marquee-track {
        display: inline-flex; width: max-content;
        animation: perf-marquee-scroll-desktop 32s linear infinite;
      }
      @keyframes perf-marquee-scroll-desktop {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }

      .chat-mode .main-area {
        padding: 0;
      }

      /* Same bottom dock nav as mobile (now the only way to switch pages
         on desktop, since the topbar's text tabs were removed) — fixed to
         the bottom of the viewport so it behaves like a mobile dock even
         though .app-shell/.app-root aren't height-clamped on desktop. */
      .bottom-nav {
        display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
        background: ${C.bg}; border-top: 1px solid ${C.line};
        justify-content: center; gap: 28px;
        padding: 12px 0 16px;
      }
    }
  `;
}
