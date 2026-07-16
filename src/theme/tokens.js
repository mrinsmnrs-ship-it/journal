// ============================================================================
// theme/tokens.js
// -----------------------------------------------------------------------------
// Semua "design token" aplikasi: warna (dark-only), shadow, font, breakpoint,
// daftar menu nav, daftar emosi, dan periode filter dashboard.
// Juga menyediakan ThemeContext + hook useTheme() supaya semua komponen bisa
// baca warna tema aktif tanpa harus lewat props satu-satu (prop drilling).
// ============================================================================
import { createContext, useContext } from "react";
import { PencilLine, BookOpen, LayoutDashboard } from "lucide-react";

export const SHADOW_DARK = {
  shadowCard: "none",
  shadowRaised: "none",
  shadowPopover: "0 8px 24px rgba(0,0,0,0.85)",
  shadowModal: "0 8px 24px rgba(0,0,0,0.55)",
};

// Single theme now — neutral dark (#131313 base, true grays with no
// warm/cool tint) instead of the old GitHub-style blue-tinted dark theme.
// Only the blue accent keeps its color; win/loss/warning colors (sage /
// rustRed / amber) are kept as-is since they carry meaning, not just style.
export const DARK = {
  bg: "#131313", paper: "#131313", paperSoft: "#131313",
  paperSoftLight: "#131313", paperSoftStat: "#131313",
  ink: "#eaeaea", inkSoft: "#9a9a9a", muted: "#9a9a9a", faint: "#707070",
  line: "#333333", lineSoft: "#242424",
  clay: "#044df5", clayDeep: "#0339b8", clayWash: "rgba(4,77,245,0.15)", clayOnWhite: "#044df5",
  sage: "#3fb950", sageWash: "rgba(46,160,67,0.15)", sageOnWhite: "#3fb950",
  rustRed: "#f85149", rustWash: "rgba(248,81,73,0.15)", rustOnWhite: "#f85149", dangerBg: "#f85149",
  popupDangerRed: "#ef4444",
  amber: "#d29922", amberWash: "rgba(187,128,9,0.15)", amberOnWhite: "#d29922",
  inputBg: "#131313", inputText: "#eaeaea", inputPlaceholder: "#707070", inputBorder: "#333333",
  btnAccent: "#044df5", btnAccentBorder: "#044df5", btnAccentWash: "rgba(4,77,245,0.15)",
  btnAccentText: "#044df5", btnAccentTextActive: "#ffffff",
  navActiveBg: "rgba(4, 77, 245, 0.15)",
  ...SHADOW_DARK,
};

export const GITHUB_SANS = "'Source Code Pro', ui-monospace, monospace";
export const GITHUB_MONO = "'Source Code Pro', ui-monospace, monospace";
export const CHAT_FONT = GITHUB_SANS;
export const LOGO_FONT = "'Press Start 2P', cursive"; // reserved for the "Aftermath Journey" wordmark only — logo tetap beda dari UI
export const LABEL_FONT = GITHUB_SANS; // label field ikut sistem font GitHub juga
export const SERIF = CHAT_FONT; // font disatukan dengan halaman lain
export const SANS = CHAT_FONT;  // font disatukan dengan halaman lain
export const MONO = GITHUB_MONO; // dipakai untuk angka/data ala GitHub (diff, code)
export const NAV = [
  { key: "log", label: "Log Trade", icon: PencilLine },
  { key: "journal", label: "History", icon: BookOpen },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export const DESKTOP_BREAKPOINT = 820;

export function getPageBackground(C) {
  return { backgroundColor: C.bg };
}

export const EMOTIONS = ["Calm", "Confident", "Hesitant", "Bored", "FOMO", "Revenge", "Anxious"];
export const POSITIVE_EMOTIONS = new Set(["Calm", "Confident"]);
export const NEGATIVE_EMOTIONS = new Set(["Hesitant", "Bored", "FOMO", "Revenge", "Anxious"]);

// Context tema: dipasang sekali di App.jsx lewat <ThemeContext.Provider>,
// lalu dibaca di mana saja lewat useTheme().
export const ThemeContext = createContext(DARK);
export function useTheme() { return useContext(ThemeContext); }

export const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];
