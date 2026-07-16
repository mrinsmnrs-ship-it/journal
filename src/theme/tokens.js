// ============================================================================
// theme/tokens.js
// -----------------------------------------------------------------------------
// Semua "design token" aplikasi: warna (LIGHT/DARK), shadow, font, breakpoint,
// daftar menu nav, daftar emosi, dan periode filter dashboard.
// Juga menyediakan ThemeContext + hook useTheme() supaya semua komponen bisa
// baca warna tema aktif tanpa harus lewat props satu-satu (prop drilling).
// ============================================================================
import { createContext, useContext } from "react";
import { Sun, Moon, PencilLine, BookOpen, LayoutDashboard, LineChart } from "lucide-react";

export const SHADOW_LIGHT = {
  shadowCard: "none",
  shadowRaised: "0 1px 0 rgba(31,35,40,0.04)",
  shadowPopover: "0 8px 24px rgba(140,149,159,0.2)",
  shadowModal: "0 8px 24px rgba(140,149,159,0.18)",
};
export const SHADOW_DARK = {
  shadowCard: "none",
  shadowRaised: "none",
  shadowPopover: "0 8px 24px rgba(1,4,9,0.85)",
  shadowModal: "0 8px 24px rgba(1,4,9,0.55)",
};

export const LIGHT = {
  bg: "#ffffff", paper: "#ffffff", paperSoft: "#f6f8fa",
  paperSoftLight: "#f6f8fa", paperSoftStat: "#f6f8fa",
  ink: "#1f2328", inkSoft: "#57606a", muted: "#57606a", faint: "#6e7781",
  line: "#d0d7de", lineSoft: "#d8dee4",
  clay: "#044df5", clayDeep: "#0339b8", clayWash: "#e1eafe", clayOnWhite: "#044df5",
  sage: "#1a7f37", sageWash: "#dafbe1", sageOnWhite: "#1a7f37",
  rustRed: "#d1242f", rustWash: "#ffebe9", rustOnWhite: "#d1242f", dangerBg: "#d1242f",
  popupDangerRed: "#ef4444",
  amber: "#9a6700", amberWash: "#fff8c5", amberOnWhite: "#9a6700",
  inputBg: "#ffffff", inputText: "#1f2328", inputPlaceholder: "#6e7781", inputBorder: "#d0d7de",
  btnAccent: "#044df5", btnAccentBorder: "#044df5", btnAccentWash: "#e1eafe",
  btnAccentText: "#044df5", btnAccentTextActive: "#ffffff",
  navActiveBg: "rgba(4, 77, 245, 0.1)",
  ...SHADOW_LIGHT,
};
export const DARK = {
  bg: "#0d1117", paper: "#0d1117", paperSoft: "#161b22",
  paperSoftLight: "#161b22", paperSoftStat: "#161b22",
  ink: "#e6edf3", inkSoft: "#848d97", muted: "#848d97", faint: "#6e7681",
  line: "#30363d", lineSoft: "#21262d",
  clay: "#044df5", clayDeep: "#0339b8", clayWash: "rgba(4,77,245,0.15)", clayOnWhite: "#044df5",
  sage: "#3fb950", sageWash: "rgba(46,160,67,0.15)", sageOnWhite: "#3fb950",
  rustRed: "#f85149", rustWash: "rgba(248,81,73,0.15)", rustOnWhite: "#f85149", dangerBg: "#f85149",
  popupDangerRed: "#ef4444",
  amber: "#d29922", amberWash: "rgba(187,128,9,0.15)", amberOnWhite: "#d29922",
  inputBg: "#0d1117", inputText: "#e6edf3", inputPlaceholder: "#6e7681", inputBorder: "#30363d",
  btnAccent: "#044df5", btnAccentBorder: "#044df5", btnAccentWash: "rgba(4,77,245,0.15)",
  btnAccentText: "#044df5", btnAccentTextActive: "#ffffff",
  navActiveBg: "rgba(4, 77, 245, 0.15)",
  ...SHADOW_DARK,
};

export const GITHUB_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
export const GITHUB_MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
export const CHAT_FONT = GITHUB_SANS;
export const LOGO_FONT = "'Inter', sans-serif"; // reserved for the "Aftermath" wordmark only — logo tetap beda dari UI
export const LABEL_FONT = GITHUB_SANS; // label field ikut sistem font GitHub juga
export const SERIF = CHAT_FONT; // font disatukan dengan halaman lain
export const SANS = CHAT_FONT;  // font disatukan dengan halaman lain
export const MONO = GITHUB_MONO; // dipakai untuk angka/data ala GitHub (diff, code)
export const NAV = [
  { key: "log", label: "Log Trade", icon: PencilLine },
  { key: "journal", label: "History", icon: BookOpen },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

// Desktop top nav gets an extra "Chart" tab (live TradingView chart) —
// charting needs real screen space, so it's kept off the mobile dock nav
// and only offered here.
export const NAV_DESKTOP = [
  ...NAV,
  { key: "chart", label: "Chart", icon: LineChart },
];

export const DESKTOP_BREAKPOINT = 820;

export function getPageBackground(themeMode, C) {
  return { backgroundColor: C.bg };
}

export const EMOTIONS = ["Calm", "Confident", "Hesitant", "Bored", "FOMO", "Revenge", "Anxious"];
export const POSITIVE_EMOTIONS = new Set(["Calm", "Confident"]);
export const NEGATIVE_EMOTIONS = new Set(["Hesitant", "Bored", "FOMO", "Revenge", "Anxious"]);

// Context tema: dipasang sekali di App.jsx lewat <ThemeContext.Provider>,
// lalu dibaca di mana saja lewat useTheme().
export const ThemeContext = createContext(LIGHT);
export function useTheme() { return useContext(ThemeContext); }

export const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

// Urutan & metadata tombol ganti tema (dipakai ThemeToggle).
export const THEME_ORDER = ["light", "dark"];
export const THEME_META = {
  light: { label: "Light", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
};
