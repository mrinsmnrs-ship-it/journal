// src/styles/index.js
// Composes the app's <style> tag content from three pieces so that
// mobile and desktop layout rules live in their own files:
//   - base.js:    resets + rules shared by both
//   - desktop.js: sidebar / main-area / chat-panel layout
//   - mobile.js:  topbar / bottom-nav layout, scoped in one media query
import { getBaseStyles } from "./base.js";
import { getDesktopStyles } from "./desktop.js";
import { getMobileStyles } from "./mobile.js";

export function getAppStyles(C, SANS) {
  return `
    ${getBaseStyles(C, SANS)}
    ${getDesktopStyles(C, SANS)}
    ${getMobileStyles(C)}
  `;
}
