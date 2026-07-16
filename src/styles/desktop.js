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

      /* All 3 pages shown side by side on desktop (Log Trade / History /
         Dashboard) instead of one at a time — same components as mobile,
         just laid out in a row. Needs a lot more width than the single-page
         880px container, so it overrides main-area-inner's max-width. */
      .main-area-inner.desktop-columns-mode {
        max-width: 1560px;
      }
      .desktop-columns {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 28px;
        align-items: start;
      }
      .desktop-column {
        min-width: 0;
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

      .circular-text-dock {
        display: block;
        position: fixed; bottom: 24px; left: 24px; z-index: 15;
      }
      .circular-text-dock .circular-text {
        margin: 0; border-radius: 50%;
        width: 110px; height: 110px;
        position: relative;
        font-weight: 900; color: ${C.faint};
        text-align: center; cursor: pointer;
        transform-origin: 50% 50%;
      }
      .circular-text-dock .circular-text span {
        position: absolute; display: inline-block;
        left: 0; right: 0; top: 0; bottom: 0;
        font-size: 10px; letter-spacing: 0.02em;
        transition: all 0.5s cubic-bezier(0, 0, 0, 1);
      }
    }
  `;
}
