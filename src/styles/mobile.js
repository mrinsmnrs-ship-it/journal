// src/styles/mobile.js
// Mobile layout, entirely scoped inside one media query: stacks the app
// into topbar + scrolling content + bottom nav instead of desktop's
// sidebar + main area + chat panel.
//
// Sizing is driven by real flex layout instead of guessed pixel offsets,
// so the topbar can never clip the top of the content and the bottom nav
// can never leave a leftover gap (this was the root cause of both issues —
// fixed-position bars paired with padding values that didn't exactly match
// their real rendered height).
export function getMobileStyles(C) {
  return `
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
