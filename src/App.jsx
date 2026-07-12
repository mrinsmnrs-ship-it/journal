import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import {
  Trash2, Plus, PencilLine, BookOpen, LayoutDashboard,
  Sun, Moon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, LogOut, MessageCircle, X,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { loadUserData, saveUserData } from "./store";
import AuthScreen from "./AuthScreen.jsx";
import JournalChat from "./JournalChat.jsx";
import BrandMark from "./BrandMark.jsx";
import EmotionSlider from "./EmotionSlider.jsx";
import Counter from "./Counter.jsx";
import "./PillToggle.css";
import "./DateField.css";

// ---- Design tokens : Claude-matched palette (blue / sage / amber) ----
// Shadow tokens: Claude.ai leans on hairline borders more than shadows —
// shadows only show up on things that float above the page (dropdowns,
// modals, the send button). They're soft, low-opacity, and layered
// (a tight "contact" shadow + a looser "ambient" shadow), never a single
// hard blur.
// ---- Design tokens : gaya GitHub (Primer design system) ----
// GitHub bersandar pada border tipis, bukan shadow, untuk kartu/panel biasa.
// Shadow cuma muncul di elemen yang "melayang" di atas halaman (dropdown, modal).
const SHADOW_LIGHT = {
  shadowCard: "none",
  shadowRaised: "0 1px 0 rgba(31,35,40,0.04)",
  shadowPopover: "0 8px 24px rgba(140,149,159,0.2)",
  shadowModal: "0 8px 24px rgba(140,149,159,0.18)",
};
const SHADOW_DARK = {
  shadowCard: "none",
  shadowRaised: "none",
  shadowPopover: "0 8px 24px rgba(1,4,9,0.85)",
  shadowModal: "0 8px 24px rgba(1,4,9,0.55)",
};

const LIGHT = {
  bg: "#ffffff", paper: "#ffffff", paperSoft: "#f6f8fa",
  paperSoftLight: "#f6f8fa", paperSoftStat: "#f6f8fa",
  ink: "#1f2328", inkSoft: "#57606a", muted: "#57606a", faint: "#6e7781",
  line: "#d0d7de", lineSoft: "#d8dee4",
  clay: "#044df5", clayDeep: "#0339b8", clayWash: "#e1eafe", clayOnWhite: "#044df5",
  sage: "#1a7f37", sageWash: "#dafbe1", sageOnWhite: "#1a7f37",
  rustRed: "#d1242f", rustWash: "#ffebe9", rustOnWhite: "#d1242f", dangerBg: "#d1242f",
  amber: "#9a6700", amberWash: "#fff8c5", amberOnWhite: "#9a6700",
  inputBg: "#ffffff", inputText: "#1f2328", inputPlaceholder: "#6e7781", inputBorder: "#d0d7de",
  btnAccent: "#044df5", btnAccentBorder: "#044df5", btnAccentWash: "#e1eafe",
  btnAccentText: "#044df5", btnAccentTextActive: "#ffffff",
  navActiveBg: "rgba(4, 77, 245, 0.1)",
  ...SHADOW_LIGHT,
};
const DARK = {
  bg: "#0d1117", paper: "#0d1117", paperSoft: "#161b22",
  paperSoftLight: "#161b22", paperSoftStat: "#161b22",
  ink: "#e6edf3", inkSoft: "#848d97", muted: "#848d97", faint: "#6e7681",
  line: "#30363d", lineSoft: "#21262d",
  clay: "#044df5", clayDeep: "#0339b8", clayWash: "rgba(4,77,245,0.15)", clayOnWhite: "#044df5",
  sage: "#3fb950", sageWash: "rgba(46,160,67,0.15)", sageOnWhite: "#3fb950",
  rustRed: "#f85149", rustWash: "rgba(248,81,73,0.15)", rustOnWhite: "#f85149", dangerBg: "#f85149",
  amber: "#d29922", amberWash: "rgba(187,128,9,0.15)", amberOnWhite: "#d29922",
  inputBg: "#0d1117", inputText: "#e6edf3", inputPlaceholder: "#6e7681", inputBorder: "#30363d",
  btnAccent: "#044df5", btnAccentBorder: "#044df5", btnAccentWash: "rgba(4,77,245,0.15)",
  btnAccentText: "#044df5", btnAccentTextActive: "#ffffff",
  navActiveBg: "rgba(4, 77, 245, 0.15)",
  ...SHADOW_DARK,
};

const GITHUB_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
const GITHUB_MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const CHAT_FONT = GITHUB_SANS;
const LOGO_FONT = "'Inter', sans-serif"; // reserved for the "Aftermath" wordmark only — logo tetap beda dari UI
const LABEL_FONT = GITHUB_SANS; // label field ikut sistem font GitHub juga
const SERIF = CHAT_FONT; // font disatukan dengan halaman lain
const SANS = CHAT_FONT;  // font disatukan dengan halaman lain
const MONO = GITHUB_MONO; // dipakai untuk angka/data ala GitHub (diff, code)
const NAV = [
  { key: "log", label: "Log Trade", icon: PencilLine },
  { key: "journal", label: "Journal", icon: BookOpen },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "chat", label: "AI Chat", icon: MessageCircle },
];

const DESKTOP_BREAKPOINT = 820;

function getPageBackground(themeMode, C) {
  return { backgroundColor: C.bg };
}

const EMOTIONS = ["Calm", "Confident", "Hesitant", "Bored", "FOMO", "Revenge", "Anxious"];
const POSITIVE_EMOTIONS = new Set(["Calm", "Confident"]);
const NEGATIVE_EMOTIONS = new Set(["Hesitant", "Bored", "FOMO", "Revenge", "Anxious"]);

const ThemeContext = createContext(LIGHT);
function useTheme() { return useContext(ThemeContext); }

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
// Trade images are stored inline as base64 data URLs inside the same
// Firestore document as everything else (no Storage bucket wired up),
// so every image gets downscaled + re-encoded as JPEG here first —
// otherwise a couple of full-res phone photos would blow past
// Firestore's 1MB-per-document limit almost immediately.
function fileToCompressedDataURL(file, maxDim = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtR(n) {
  const v = Number(n) || 0;
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}R`;
}
function fmtDateDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function parseISO(iso) {
  return new Date(iso + "T00:00:00");
}
function startOfWeek(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfYear(d) { return new Date(d.getFullYear(), 0, 1); }
function tradeYears(trades) {
  const years = new Set(trades.map((t) => parseISO(t.date).getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}
function computeEquityCurve(trades) {
  const sorted = [...trades].sort((a, b) => parseISO(a.date) - parseISO(b.date));
  let cum = 0;
  return sorted.map((t, i) => {
    cum += t.rActual;
    return { index: i + 1, date: t.date, symbol: t.symbol, cum: Math.round(cum * 100) / 100 };
  });
}
function computeDailyR(trades) {
  const map = new Map();
  trades.forEach((t) => {
    const cur = map.get(t.date) || { total: 0, count: 0 };
    cur.total += t.rActual;
    cur.count += 1;
    map.set(t.date, cur);
  });
  return map;
}
function computeSymbolStats(trades) {
  const map = new Map();
  trades.forEach((t) => {
    const sym = t.symbol || "\u2014";
    const cur = map.get(sym) || { symbol: sym, totalR: 0, count: 0, wins: 0 };
    cur.totalR += t.rActual;
    cur.count += 1;
    if (t.rActual > 0) cur.wins += 1;
    map.set(sym, cur);
  });
  return Array.from(map.values())
    .map((s) => ({ ...s, totalR: Math.round(s.totalR * 100) / 100, winRate: s.count ? (s.wins / s.count) * 100 : 0 }))
    .sort((a, b) => b.totalR - a.totalR);
}

const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

// ---- Small atoms ----
function PillToggle({ label, active, onClick }) {
  const C = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className="pill-toggle"
      style={{
        flex: 1, height: 40, padding: 0, borderRadius: 0,
        border: `1px solid ${active ? C.btnAccentBorder : C.line}`,
        background: C.paperSoft, fontFamily: SANS, fontWeight: 700, fontSize: 16,
        "--pill-fill": C.btnAccent,
        "--pill-base-text": C.inkSoft,
        "--pill-active-text": C.btnAccentTextActive,
      }}
    >
      <span className="pill-toggle-fill" />
      <span className="pill-toggle-label-stack">
        <span className="pill-toggle-label-base">{label}</span>
        <span className="pill-toggle-label-active">{label}</span>
      </span>
    </button>
  );
}

function Chip({ label, active, onClick }) {
  const C = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className="pill-toggle"
      style={{
        fontFamily: SANS, fontSize: 14, fontWeight: 600,
        padding: "9px 12px", borderRadius: 0, textAlign: "center",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        border: `1px solid ${active ? C.btnAccentBorder : C.line}`,
        background: C.paperSoft,
        cursor: "pointer",
        "--pill-fill": C.btnAccent,
        "--pill-base-text": C.inkSoft,
        "--pill-active-text": C.btnAccentTextActive,
      }}
    >
      <span className="pill-toggle-fill" />
      <span className="pill-toggle-label-stack">
        <span className="pill-toggle-label-base">{label}</span>
        <span className="pill-toggle-label-active">{label}</span>
      </span>
    </button>
  );
}
function Field({ label, children }) {
  const C = useTheme();
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
        color: C.muted, marginBottom: 9, textTransform: "capitalize",
      }}>{label}</div>
      {children}
    </div>
  );
}
function useInputStyle() {
  const C = useTheme();
  return {
    width: "100%", boxSizing: "border-box", background: C.inputBg,
    border: `1px solid ${C.inputBorder}`, borderRadius: 0, padding: "14px 16px",
    color: C.inputText, fontFamily: SANS, fontSize: 16, outline: "none",
    boxShadow: "none",
  };
}
// Shared Risk % / R Planned / R Actual panel.
// Tap a box to select it, then use the single set of -0.1 / - / + / +0.1
// buttons to adjust whichever field is currently selected — no need for
// three separate +/- controls.
const R_FIELDS = [
  { key: "riskPct", label: "Risk" },
  { key: "rPlanned", label: "R Planned" },
  { key: "rActual", label: "R Actual" },
];

function RiskRPanel({ form, updateForm }) {
  const C = useTheme();
  const [activeField, setActiveField] = useState("rActual");

  const adjust = (delta) => {
    const current = Number(form[activeField]) || 0;
    const next = Math.round((current + delta) * 100) / 100;
    updateForm(activeField, String(next));
  };

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {R_FIELDS.map(({ key, label }) => {
          const active = activeField === key;
          const raw = form[key];
          const numeric = raw === "" || raw === undefined || raw === null || isNaN(Number(raw)) ? 0 : Number(raw);
          const isNegative = numeric < 0;
          return (
            <div key={key} style={{ flex: 1 }}>
              <div style={{
                fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                color: C.muted, marginBottom: 9, textTransform: "capitalize",
              }}>{label}</div>
              <button
                type="button"
                onClick={() => setActiveField(key)}
                style={{
                  width: "100%", boxSizing: "border-box", background: C.inputBg,
                  border: `1px solid ${active ? C.btnAccentBorder : C.inputBorder}`,
                  borderRadius: 0, height: 40, padding: "0 6px", cursor: "pointer",
                  display: "flex", justifyContent: "center", alignItems: "center", gap: 1,
                }}
              >
                {isNegative && (
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.inputText, lineHeight: 1 }}>&minus;</span>
                )}
                <Counter
                  value={Math.abs(numeric)}
                  places={[10, 1, ".", 0.1]}
                  fontSize={14}
                  padding={1}
                  gap={1}
                  horizontalPadding={0}
                  textColor={C.inputText}
                  fontWeight={600}
                  topGradientStyle={{ display: "none" }}
                  bottomGradientStyle={{ display: "none" }}
                />
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {[
          { label: "-0.1", delta: -0.1 },
          { label: "-", delta: -1 },
          { label: "+", delta: 1 },
          { label: "+0.1", delta: 0.1 },
        ].map(({ label, delta }) => (
          <button
            key={label}
            type="button"
            onClick={() => adjust(delta)}
            style={{
              width: 30, height: 26, padding: 0, borderRadius: 0,
              border: `1px solid ${C.line}`, background: C.paperSoft,
              color: C.inkSoft, fontWeight: 600, fontSize: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: SANS, lineHeight: 1,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tag({ text }) {
  // Monokrom: satu warna netral saja, tidak lagi per-kategori (blue/sage/rust/amber)
  // Warna & style disamakan persis dengan pill persona "Nox Valerica" di chat.
  const C = useTheme();
  return (
    <span style={{
      fontFamily: SANS, fontSize: 12, fontWeight: 400, color: C.muted,
      background: C.paperSoft, border: `1px solid ${C.line}`,
      borderRadius: 0, padding: "6px 13px",
    }}>
      {text}
    </span>
  );
}
function SectionLabel({ text }) {
  const C = useTheme();
  return (
    <div style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      color: C.muted, marginBottom: 15, textTransform: "capitalize",
    }}>{text}</div>
  );
}
const THEME_ORDER = ["light", "dark"];
const THEME_META = {
  light: { label: "Light", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
};
function ThemeToggle({ mode, onToggle, compact }) {
  const C = useTheme();
  const { label, Icon } = THEME_META[mode] || THEME_META.light;
  const nextMode = THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length];
  const nextLabel = THEME_META[nextMode]?.label || "Light";
  return (
    <button
      onClick={onToggle}
      title={`Switch to ${nextLabel} theme`}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 0,
        padding: compact ? "9px" : "10px 16px", cursor: "pointer", color: C.inkSoft,
        fontFamily: SANS, fontSize: 14, fontWeight: 600,
      }}
    >
      <Icon size={16} style={{ color: C.ink }} />
      {!compact && label}
    </button>
  );
}

// ---- Reusable animated eye logo mark (same across mobile topbar, sidebar, login) ----
function EyeLogo({ blinkFrame, size = 22 }) {
  return (
    <svg viewBox="0 0 494 497" width={size} height={size} style={{ color: "inherit", flexShrink: 0, display: "block" }}>
      {blinkFrame === "open" && (
        <g transform="translate(0.000000,497.000000) scale(0.100000,-0.100000)"
        fill="currentColor" stroke="none">
        <path d="M2490 4419 c-33 -13 -68 -47 -88 -84 -17 -33 -18 -153 -6 -571 4
        -143 3 -223 -3 -227 -6 -4 -70 -14 -144 -22 -164 -19 -260 -39 -353 -72 -108
        -38 -284 -128 -361 -183 -38 -28 -73 -50 -76 -50 -4 0 -29 39 -55 88 -26 48
        -86 152 -134 232 -48 80 -97 164 -109 188 -12 24 -60 101 -107 172 -96 146
        -127 172 -203 172 -59 0 -86 -13 -111 -55 -24 -39 -27 -141 -6 -192 14 -33
        171 -300 242 -411 51 -80 204 -364 204 -379 0 -7 -26 -35 -57 -62 -102 -89
        -336 -325 -409 -413 -126 -150 -333 -480 -342 -542 -9 -68 33 -132 197 -297
        155 -157 204 -195 377 -289 60 -33 112 -66 117 -74 10 -14 -75 -219 -133 -323
        -80 -145 -119 -275 -101 -342 20 -73 105 -117 182 -94 63 19 108 73 163 196
        157 347 197 431 210 439 15 10 125 -19 216 -57 93 -39 409 -129 515 -147 61
        -10 156 -22 213 -25 l102 -8 2 -31 c1 -17 2 -130 2 -251 1 -202 3 -224 22
        -265 32 -68 64 -93 126 -98 65 -5 110 22 142 83 20 37 21 58 23 299 2 196 6
        262 15 268 7 4 33 8 58 8 71 0 215 35 423 100 265 83 364 123 452 181 42 27
        81 49 88 49 7 0 30 -26 52 -57 22 -31 75 -100 119 -152 43 -53 100 -128 127
        -167 59 -88 96 -120 148 -129 58 -10 101 2 139 38 82 79 58 196 -72 351 -28
        33 -67 81 -86 106 -19 25 -65 78 -102 118 -38 40 -68 79 -68 87 0 18 60 66
        185 148 197 130 361 257 384 298 77 136 8 286 -274 599 -48 54 -235 235 -383
        372 -39 37 -72 73 -72 81 0 8 59 76 130 150 174 180 316 350 346 412 49 103
        22 205 -62 234 -86 30 -156 -11 -280 -165 -85 -105 -390 -424 -406 -424 -6 0
        -37 16 -71 37 -57 34 -190 94 -379 168 -112 45 -261 83 -352 92 -39 3 -74 11
        -78 17 -4 6 -8 43 -8 83 0 40 -4 127 -10 195 -5 68 -11 204 -12 304 -3 177 -3
        181 -30 221 -16 24 -44 49 -70 62 -48 23 -70 25 -108 10z m658 -1355 c157 -52
        255 -99 337 -162 33 -25 89 -68 125 -95 79 -59 555 -529 617 -610 64 -85 61
        -90 -82 -162 -98 -49 -456 -275 -565 -356 -42 -32 -98 -59 -275 -134 -171 -73
        -260 -100 -302 -94 -21 4 -16 11 45 78 90 99 134 164 197 296 149 307 149 595
        0 900 -65 133 -132 223 -231 312 -41 36 -74 70 -74 75 0 14 66 -1 208 -48z
        m-958 32 c0 -2 -41 -34 -90 -71 -128 -95 -250 -235 -314 -361 -138 -272 -161
        -512 -74 -784 40 -124 83 -208 156 -305 33 -44 58 -83 56 -87 -11 -17 -519
        188 -759 307 -187 92 -337 187 -343 216 -1 8 18 51 44 95 26 43 62 106 82 139
        83 142 258 343 375 431 97 72 398 243 547 309 169 76 320 128 320 111z"/>
        </g>
      )}
      {blinkFrame === "open2" && (
        <g transform="translate(0.000000,497.000000) scale(0.100000,-0.100000)"
        fill="currentColor" stroke="none">
        <path d="M2413 4173 c-29 -6 -70 -54 -83 -101 -20 -70 -30 -346 -21 -575 6
                            -122 8 -224 5 -228 -2 -4 -37 -10 -76 -14 -190 -17 -487 -96 -681 -180 -84
        -36 -157 -65 -162 -65 -19 0 -207 321 -340 578 -26 51 -66 113 -89 138 -35 39
        -48 47 -88 51 -44 5 -50 3 -83 -30 -32 -32 -35 -40 -35 -92 0 -40 9 -79 31
        -133 38 -98 162 -336 268 -516 44 -76 81 -142 81 -146 0 -4 -40 -34 -89 -67
        -130 -86 -286 -218 -454 -386 -132 -132 -152 -157 -183 -224 -39 -86 -42 -119
        -15 -171 49 -94 360 -337 586 -457 68 -36 126 -69 129 -74 3 -4 -23 -53 -57
        -108 -34 -56 -83 -141 -110 -190 -26 -48 -67 -123 -91 -167 -97 -174 -78 -296
        47 -296 89 0 108 23 316 382 73 125 139 232 147 238 17 15 33 12 159 -35 223
        -83 529 -145 712 -145 78 0 94 -3 101 -17 5 -10 12 -88 16 -173 18 -424 41
        -500 148 -500 55 0 77 15 101 68 21 45 22 58 19 339 l-2 292 37 6 c337 55 528
        110 786 229 43 20 83 36 90 36 7 0 82 -104 167 -232 161 -240 223 -319 271
        -343 95 -49 186 27 165 138 -10 52 -143 276 -283 478 -35 49 -63 93 -63 98 0
        5 42 35 93 67 196 124 426 294 488 360 85 92 102 167 53 240 -14 21 -108 120
        -207 219 -179 178 -327 305 -439 380 -32 21 -58 40 -58 42 0 2 19 32 42 66 39
        58 88 123 290 382 112 143 133 221 73 280 -47 48 -117 45 -183 -8 -75 -59
        -209 -221 -425 -511 -21 -28 -42 -52 -47 -54 -4 -2 -55 17 -114 42 -231 99
        -501 166 -716 178 l-45 3 -7 115 c-4 63 -11 241 -16 395 -8 252 -11 285 -30
        328 -16 36 -30 51 -56 62 -20 8 -39 14 -43 14 -4 -1 -18 -4 -30 -6z m-489
        -1375 c-216 -227 -307 -527 -244 -810 33 -149 98 -263 244 -427 l21 -23 -55 7
        c-269 35 -805 247 -1058 419 -155 105 -172 118 -172 130 0 22 199 199 343 304
        85 62 338 201 477 262 52 23 135 60 183 82 119 54 235 95 272 97 l29 1 -40
        -42z m1289 -33 c332 -133 603 -291 788 -462 52 -48 108 -99 124 -112 l28 -24
        -34 -28 c-97 -82 -407 -278 -559 -354 -136 -68 -307 -141 -410 -175 -118 -39
        -273 -81 -278 -76 -2 2 26 34 61 70 70 71 141 171 189 267 69 139 105 382 79
        534 -23 129 -90 285 -162 376 -57 72 -45 71 174 -16z"/>
        </g>
      )}
      {blinkFrame === "half" && (
        <g transform="translate(0.000000,497.000000) scale(0.100000,-0.100000)"
        fill="currentColor" stroke="none">
        <path d="M2510 3992 c-75 -37 -90 -130 -90 -569 0 -278 -1 -293 -18 -293 -111
        0 -594 -61 -798 -101 -99 -19 -168 -29 -174 -23 -18 19 -169 275 -215 364
        -133 263 -184 330 -250 330 -97 0 -138 -80 -104 -205 16 -58 94 -215 199 -404
        50 -89 89 -168 87 -175 -3 -6 -31 -20 -63 -30 -188 -58 -571 -283 -610 -358
        -20 -39 -18 -117 5 -155 11 -17 46 -49 78 -71 85 -58 343 -184 457 -223 54
        -19 100 -40 103 -47 3 -7 -6 -27 -19 -45 -13 -17 -42 -63 -65 -102 -22 -38
        -66 -114 -98 -168 -91 -154 -105 -238 -50 -293 20 -20 34 -24 81 -24 56 0 59
        2 103 48 26 26 102 141 171 255 69 115 136 222 150 238 l25 30 144 -26 c218
        -39 464 -65 683 -72 169 -5 198 -8 202 -22 3 -9 7 -97 11 -196 11 -283 20
        -368 45 -413 56 -100 158 -95 212 11 20 41 21 50 15 330 -5 220 -3 289 6 292
        7 2 77 11 157 19 187 19 397 65 734 162 47 13 50 13 65 -8 60 -83 134 -190
        206 -298 103 -154 160 -216 209 -226 56 -10 102 3 131 38 24 28 27 39 23 83
        -6 57 -39 117 -199 356 -55 83 -97 154 -92 158 4 4 62 27 128 51 215 78 384
        159 437 210 45 44 48 49 48 98 0 47 -4 57 -39 95 -24 25 -74 59 -123 84 -159
        80 -313 150 -397 179 -46 15 -85 34 -88 41 -6 15 149 258 252 393 82 110 110
        172 102 226 -7 44 -31 72 -75 91 -41 17 -95 3 -145 -38 -46 -38 -216 -266
        -322 -432 -48 -76 -94 -141 -102 -144 -9 -3 -38 0 -67 6 -289 71 -468 98 -713
        110 -84 4 -155 10 -159 13 -3 3 -9 174 -14 380 -7 346 -9 378 -28 414 -21 40
        -66 74 -99 74 -10 0 -34 -8 -53 -18z m967 -1317 c233 -38 625 -133 638 -155 7
        -11 -92 -42 -223 -70 -56 -11 -139 -32 -184 -45 -44 -14 -127 -34 -182 -45
        -56 -10 -155 -31 -221 -45 -176 -37 -177 -36 -121 42 72 102 81 128 81 240 l0
        103 27 0 c15 0 98 -11 185 -25z m-1679 -67 c-17 -105 10 -199 82 -293 22 -29
        40 -55 40 -60 0 -15 -294 18 -490 56 -257 48 -550 128 -550 149 0 8 107 39
        205 60 28 6 95 21 150 35 55 13 163 35 240 50 77 14 169 32 205 40 36 7 79 13
        96 14 l31 1 -9 -52z"/>
        </g>
      )}
      {blinkFrame === "closed" && (
        <g transform="translate(0.000000,497.000000) scale(0.100000,-0.100000)"
        fill="currentColor" stroke="none">
        <path d="M2376 3739 c-39 -31 -54 -66 -67 -165 -12 -94 -9 -374 11 -867 6
        -142 8 -263 5 -268 -14 -21 -360 -2 -725 41 -91 11 -172 20 -181 20 -9 0 -35
        35 -64 88 -27 48 -67 119 -91 158 -66 111 -161 304 -236 484 -74 176 -93 205
        -144 219 -44 12 -79 3 -114 -29 -27 -26 -30 -34 -30 -93 0 -39 10 -98 24 -148
        34 -115 129 -349 170 -418 36 -60 106 -196 106 -207 0 -18 -197 13 -359 56
        -103 27 -198 25 -232 -5 -30 -27 -48 -74 -42 -108 7 -34 52 -81 104 -107 77
        -40 262 -89 463 -124 49 -8 91 -17 93 -20 5 -5 -87 -173 -127 -231 -15 -22
        -65 -116 -111 -210 -72 -146 -84 -179 -87 -232 -4 -58 -2 -64 26 -93 25 -25
        38 -30 78 -30 44 0 51 4 93 48 25 26 78 101 117 167 39 66 127 213 194 328
        l123 207 41 0 c23 0 122 -9 221 -19 159 -17 316 -30 593 -47 74 -5 82 -8 86
        -27 3 -12 10 -192 16 -400 8 -268 15 -391 25 -425 29 -97 120 -140 183 -87 58
        49 62 80 62 532 l0 403 23 4 c12 3 92 7 177 11 194 7 470 46 639 90 69 18 70
        17 103 -40 6 -11 52 -83 103 -160 96 -147 119 -184 209 -331 62 -102 98 -138
        155 -155 86 -26 148 31 139 127 -7 75 -107 267 -260 497 -43 65 -78 122 -78
        127 0 5 17 12 38 15 199 34 433 96 512 135 70 36 110 87 110 140 -1 93 -118
        137 -243 90 -116 -43 -397 -95 -397 -73 0 3 45 91 100 194 128 241 209 411
        221 471 19 89 -18 148 -94 148 -91 0 -157 -73 -272 -300 -31 -63 -90 -176
        -129 -250 -39 -74 -87 -175 -107 -225 -25 -64 -43 -94 -60 -102 -59 -30 -486
        -91 -755 -109 l-102 -6 -6 28 c-3 16 -10 124 -16 239 -5 116 -13 230 -16 254
        -3 25 -9 189 -13 365 -8 352 -11 369 -70 419 -41 34 -96 36 -135 6z"/>
        </g>
      )}
    </svg>
  );
}

// ---- Stats ----
function computeStats(trades) {
  const total = trades.length;
  if (total === 0) {
    return {
      total: 0, winRate: 0, totalR: 0, expectancy: 0, avgWin: 0, avgLoss: 0,
      scorecard: ["Profitability", "Discipline", "Emotional Control", "Risk Consistency", "Win Rate"].map((m) => ({ metric: m, value: 0 })),
      byRules: { Yes: { count: 0, total: 0 }, Partial: { count: 0, total: 0 }, No: { count: 0, total: 0 } },
    };
  }
  const wins = trades.filter((t) => t.rActual > 0);
  const losses = trades.filter((t) => t.rActual < 0);
  const totalR = trades.reduce((s, t) => s + t.rActual, 0);
  const winRate = (wins.length / total) * 100;
  const expectancy = totalR / total;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.rActual, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.rActual, 0) / losses.length : 0;
  const disciplined = trades.filter((t) => t.rules);
  const disciplineScore = disciplined.length
      ? disciplined.reduce((s, t) => s + (t.rules === "Yes" ? 100 : t.rules === "Partial" ? 50 : 0), 0) / disciplined.length
    : 0;
  const withEmotions = trades.filter((t) => !!t.emotion);
const emotionalScore = withEmotions.length
  ? withEmotions.reduce((s, t) => {
      if (POSITIVE_EMOTIONS.has(t.emotion)) return s + 100;
      if (NEGATIVE_EMOTIONS.has(t.emotion)) return s + 0;
      return s + 50;
    }, 0) / withEmotions.length
  : 0;
  const risks = trades.map((t) => t.riskPct).filter((r) => r !== null && r !== undefined && !isNaN(r));
  let riskConsistency = 100;
  if (risks.length >= 2) {
    const mean = risks.reduce((s, r) => s + r, 0) / risks.length;
    const variance = risks.reduce((s, r) => s + (r - mean) ** 2, 0) / risks.length;
    const cv = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 0;
    riskConsistency = clamp(100 - cv * 100, 0, 100);
  }
  const profitability = clamp(((expectancy + 2) / 4) * 100, 0, 100);
  const byRules = { Yes: { count: 0, total: 0 }, Partial: { count: 0, total: 0 }, No: { count: 0, total: 0 } };
  trades.forEach((t) => {
    if (t.rules && byRules[t.rules]) {
      byRules[t.rules].count += 1;
      byRules[t.rules].total += t.rActual;
    }
  });
  return {
    total, winRate, totalR, expectancy, avgWin, avgLoss,
    scorecard: [
      { metric: "Profitability", value: Math.round(profitability) },
      { metric: "Discipline", value: Math.round(disciplineScore) },
      { metric: "Emotional Control", value: Math.round(emotionalScore) },
      { metric: "Risk Consistency", value: Math.round(riskConsistency) },
      { metric: "Win Rate", value: Math.round(winRate) },
    ],
    byRules,
    disciplineScore, emotionalScore, riskConsistency,
  };
}

// ---- Auth gate: shows AuthScreen until a user is signed in ----
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);
  if (user === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, color: "#000000" }}>
        Loading…
      </div>
    );
  }
  if (!user) return <AuthScreen />;
  return <RJournal user={user} />;
}

// ---- App ----
function RJournal({ user }) {
  const [tab, setTab] = useState("log");
  const navRefs = useRef({});
  const [navIndicator, setNavIndicator] = useState({ left: 0, width: 0 });
  const desktopNavRefs = useRef({});
  const [desktopNavIndicator, setDesktopNavIndicator] = useState({ top: 0, height: 0 });
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth > DESKTOP_BREAKPOINT : true
  );
  const [blinkFrame, setBlinkFrame] = useState("open"); // "open" | "open2" | "half" | "closed" — untuk ikon mata di header
  const [trades, setTrades] = useState([]);
  const [themeMode, setThemeMode] = useState("light");
  const [loaded, setLoaded] = useState(false);
  const [symbolOptions, setSymbolOptions] = useState([]);
  const [entryModelOptions, setEntryModelOptions] = useState([]);
  const [form, setForm] = useState({
    date: todayISO(), symbol: "", direction: "", reason: "",
    riskPct: "", rPlanned: "", rActual: "", rules: "", emotion: "", notes: "",
    entryModel: "", entryModelTracked: false, images: [],
  });
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await loadUserData(user.uid);
      setTrades(data.trades);
      setThemeMode(THEME_ORDER.includes(data.theme) ? data.theme : "light");
      setSymbolOptions(data.symbolOptions);
      setEntryModelOptions(data.entryModelOptions);
      setLoaded(true);
    })();
  }, [user.uid]);

  useEffect(() => {
    function updateIsDesktop() {
      setIsDesktop(window.innerWidth > DESKTOP_BREAKPOINT);
    }
    updateIsDesktop();
    window.addEventListener("resize", updateIsDesktop);
    return () => window.removeEventListener("resize", updateIsDesktop);
  }, []);

  // Fix: tinggi viewport mobile dihitung ulang lewat JS (bukan hanya
  // mengandalkan 100dvh), karena sejumlah browser/WebView Android masih
  // salah menghitung dvh saat address bar muncul/hilang — akibatnya
  // elemen di bagian paling bawah (bottom nav) bisa terdorong keluar
  // layar dan tak terjangkau karena overflow di-hidden.
  useEffect(() => {
    function setAppHeight() {
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-vh", `${h}px`);
    }
    setAppHeight();
    window.addEventListener("resize", setAppHeight);
    window.visualViewport?.addEventListener("resize", setAppHeight);
    return () => {
      window.removeEventListener("resize", setAppHeight);
      window.visualViewport?.removeEventListener("resize", setAppHeight);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeouts = [];

    function doBlink() {
      const frames = ["open2", "half", "closed", "half", "open2", "open"];
      frames.forEach((f, i) => {
        timeouts.push(setTimeout(() => {
          if (!cancelled) setBlinkFrame(f);
        }, i * 70));
      });
    }

    function loop() {
      doBlink();
      timeouts.push(setTimeout(loop, 4500));
      }
        loop();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  async function toggleTheme() {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(themeMode) + 1) % THEME_ORDER.length];
    setThemeMode(next);
    await saveUserData(user.uid, { theme: next });
  }
  function updateForm(key, val) { setForm((f) => ({ ...f, [key]: val })); }
  function toggleEmotion(e) {
  setForm((f) => ({ ...f, emotion: f.emotion === e ? "" : e }));
  }
  async function addSymbolOption(opt) {
    if (!opt || symbolOptions.includes(opt)) return;
    const next = [...symbolOptions, opt];
    setSymbolOptions(next);
    await saveUserData(user.uid, { symbolOptions: next });
  }
  async function addEntryModelOption(opt) {
    if (!opt || entryModelOptions.includes(opt)) return;
    const next = [...entryModelOptions, opt];
    setEntryModelOptions(next);
    await saveUserData(user.uid, { entryModelOptions: next });
  }
  async function deleteSymbolOption(opt) {
    const next = symbolOptions.filter((o) => o !== opt);
    setSymbolOptions(next);
    await saveUserData(user.uid, { symbolOptions: next });
  }
  async function deleteEntryModelOption(opt) {
    const next = entryModelOptions.filter((o) => o !== opt);
    setEntryModelOptions(next);
    await saveUserData(user.uid, { entryModelOptions: next });
  }
  const canSave = form.symbol.trim() && form.direction && form.rActual !== "";
  async function handleSave() {
    if (!canSave) return;
    const trade = {
      id: uid(), date: form.date || todayISO(), symbol: form.symbol.trim().toUpperCase(),
      direction: form.direction, reason: form.reason.trim(),
      riskPct: form.riskPct === "" ? null : Number(form.riskPct),
      rPlanned: form.rPlanned === "" ? null : Number(form.rPlanned),
      rActual: Number(form.rActual), rules: form.rules || null,
      emotion: form.emotion, notes: form.notes.trim(), createdAt: Date.now(),
      entryModel: form.entryModel.trim() || null,
      entryModelTracked: !!form.entryModelTracked && !!form.entryModel.trim(),
      images: form.images || [],
    };
    const next = [trade, ...trades];
    setTrades(next);
    await saveUserData(user.uid, { trades: next });
    setForm({ date: todayISO(), symbol: "", direction: "", reason: "", riskPct: "", rPlanned: "", rActual: "", rules: "", emotion: "", notes: "", entryModel: "", entryModelTracked: false, images: [] });
    setTab("journal");
  }
  async function addImages(files) {
    if (!files || files.length === 0) return;
    setImageUploading(true);
    try {
      const remaining = Math.max(0, 8 - (form.images || []).length);
      const toProcess = Array.from(files).slice(0, remaining);
      const encoded = await Promise.all(toProcess.map((f) => fileToCompressedDataURL(f)));
      setForm((f) => ({ ...f, images: [...(f.images || []), ...encoded].slice(0, 8) }));
    } catch (err) {
      console.error("Failed to read image:", err);
    } finally {
      setImageUploading(false);
    }
  }
  function removeImage(index) {
    setForm((f) => ({ ...f, images: (f.images || []).filter((_, i) => i !== index) }));
  }
  async function handleDelete(id) {
    const next = trades.filter((t) => t.id !== id);
    setTrades(next);
    await saveUserData(user.uid, { trades: next });
  }
  async function handleLogout() {
    await signOut(auth);
  }

  const stats = useMemo(() => computeStats(trades), [trades]);

  const NAV = [
    { key: "log", label: "Log Trade", icon: PencilLine },
    { key: "journal", label: "Journal", icon: BookOpen },
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "chat", label: "AI Chat", icon: MessageCircle },
  ];
  const NAV_DESKTOP = NAV.filter((n) => n.key !== "chat");

  useEffect(() => {
    function updateNavIndicator() {
      const el = navRefs.current[tab];
      if (el) {
        setNavIndicator({ left: el.offsetLeft, width: el.offsetWidth });
      }
    }
    updateNavIndicator();
    window.addEventListener("resize", updateNavIndicator);
    return () => window.removeEventListener("resize", updateNavIndicator);
  }, [tab]);

  useEffect(() => {
    function updateDesktopNavIndicator() {
      const activeKey = desktopNavRefs.current[tab] ? tab : "log";
      const el = desktopNavRefs.current[activeKey];
      if (el) {
        setDesktopNavIndicator({
          top: el.offsetTop,
          height: el.offsetHeight,
        });
      }
    }
    updateDesktopNavIndicator();
    window.addEventListener("resize", updateDesktopNavIndicator);
    return () => window.removeEventListener("resize", updateDesktopNavIndicator);
  }, [tab, isDesktop]);

  const C = themeMode === "dark" ? DARK : LIGHT;
  const isChatTab = !isDesktop && tab === "chat";

  return (
    <ThemeContext.Provider value={C}>
      <div className={`app-root${isChatTab ? " chat-mode" : ""}`} style={{ ...getPageBackground(themeMode, C), minHeight: isDesktop ? "100vh" : undefined, color: C.ink, fontFamily: SANS }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,500&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap');
          * { box-sizing: border-box; }
          html, body { margin:0; height: 100%; background: ${C.bg}; overscroll-behavior-y: none; }
          button { -webkit-tap-highlight-color: transparent; transition: transform .1s ease; }
          button:active:not(:disabled) { transform: scale(0.96); }
          .no-press, .no-press:active { transform: none !important; }
          input::placeholder, textarea::placeholder { color: ${C.inputPlaceholder}; }
          input, textarea { font-family: ${SANS}; }
          input:focus, textarea:focus { border-color: ${C.clay} !important; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 0; }
          .recharts-wrapper, .recharts-wrapper svg, .recharts-surface { overflow: visible !important; }

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

          .bottom-nav { display: none; }
          .mobile-topbar { display: none; }
          .perf-marquee { display: none; }
          .app-footer-mobile { display: none; }

          .nav-item-desktop {
            display:flex; align-items:center; padding: 11px 12px; border-radius: 0;
            font-family: ${SANS}; font-size:16px; font-weight:600; letter-spacing: -0.015em;
            cursor:pointer; border:none; background:transparent;
            width: calc(100% - 16px); text-align:left; margin-bottom:2px; transition: color .12s ease, background .12s ease;
          }
          .nav-item-desktop:hover { color: ${C.ink}; }

          .chat-mode { height: var(--app-vh, 100dvh); overflow: hidden; }
          .chat-mode .main-area {
            display: flex; flex-direction: column; overflow: hidden;
          }

          /* Mobile: everything sized by real flex layout instead of guessed
             pixel offsets, so the topbar can never clip the top of the
             content and the bottom nav can never leave a leftover gap
             (this was the root cause of both issues — fixed-position bars
             paired with padding values that didn't exactly match their
             real rendered height). */
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
            .chat-mode .main-area { padding: 16px 16px 0; }
          }
        `}</style>
        <div className="app-shell">
          {/* Sidebar (desktop) */}
          <div className="sidebar">
            <div style={{ padding: "6px 10px 26px", display: "flex", alignItems: "center", gap: 6, fontSize: 19 }}>
              <BrandMark style={{ height: "1.15em", width: "auto", color: C.ink, flexShrink: 0 }} />
              <span style={{ lineHeight: 1 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em", color: C.ink }}>Aftermath</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em", color: C.ink }}>Journey</span>
              </span>
            </div>
            <DesktopDockNav
              items={NAV_DESKTOP}
              activeKey={tab}
              onSelect={setTab}
              registerItemRef={(key, el) => { desktopNavRefs.current[key] = el; }}
              indicator={desktopNavIndicator}
              accentColor={C.btnAccent}
            />
            <div style={{ flex: 1 }} />
            <div style={{ padding: "0 2px", marginBottom: 12, display: "flex", gap: 8 }}>
              <ThemeToggle mode={themeMode} onToggle={toggleTheme} />
              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 0,
                  padding: "10px 13px", cursor: "pointer", color: C.inkSoft,
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: C.faint, padding: "0 10px", lineHeight: 1.5 }}>
              Signed in as {user.email}. Synced across your devices.
            </div>
            
          </div>

          {/* Mobile top bar */}
          <div className="mobile-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 17 }}>
              <BrandMark style={{ height: "1.15em", width: "auto", color: C.ink, flexShrink: 0 }} />
              <span style={{ lineHeight: 1 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em", color: C.ink }}>Aftermath</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em", color: C.ink }}>Journey</span>
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <ThemeToggle mode={themeMode} onToggle={toggleTheme} compact />
              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 0,
                  padding: 8, cursor: "pointer", color: C.inkSoft,
                }}
              >
                <LogOut size={15} />
              </button>
                          </div>
          </div>

          {/* Performance marquee — scrolling stats summary, mobile only */}
          <div className="perf-marquee">
            <div className="perf-marquee-track" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color: C.inkSoft, lineHeight: 1 }}>
              {[0, 1].map((rep) => (
                <span key={rep} style={{ display: "inline-flex", alignItems: "center" }}>
                  <span style={{ padding: "0 14px" }}>Total Trades {stats.total}</span>
                  <span style={{ color: C.line }}>&middot;</span>
                  <span style={{ padding: "0 14px" }}>Win Rate {Math.round(stats.winRate)}%</span>
                  <span style={{ color: C.line }}>&middot;</span>
                  <span style={{ padding: "0 14px" }}>Total R {fmtR(stats.totalR)}</span>
                  <span style={{ color: C.line }}>&middot;</span>
                  <span style={{ padding: "0 14px" }}>Expectancy {fmtR(stats.expectancy)}</span>
                  <span style={{ color: C.line }}>&middot;</span>
                  <span style={{ padding: "0 14px" }}>Avg Win {fmtR(stats.avgWin)}</span>
                  <span style={{ color: C.line }}>&middot;</span>
                  <span style={{ padding: "0 14px" }}>Avg Loss {fmtR(stats.avgLoss)}</span>
                  <span style={{ color: C.line }}>&middot;</span>
                  <span style={{ padding: "0 14px" }}>Discipline {Math.round(stats.disciplineScore)}%</span>
                  <span style={{ color: C.line }}>&middot;</span>
                  <span style={{ padding: "0 14px" }}>Risk Consistency {Math.round(stats.riskConsistency)}%</span>
                </span>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="main-area">
            {!loaded ? (
              <div style={{ color: C.faint, fontSize: 14 }}>Loading…</div>
            ) : !isDesktop && tab === "chat" ? (
              <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                <JournalChat user={user} trades={trades} theme={C} />
              </div>
            ) : tab === "log" ? (
              <LogTradeForm form={form} updateForm={updateForm} toggleEmotion={toggleEmotion} handleSave={handleSave} canSave={canSave} symbolOptions={symbolOptions} entryModelOptions={entryModelOptions} onAddSymbolOption={addSymbolOption} onAddEntryModelOption={addEntryModelOption} onDeleteSymbolOption={deleteSymbolOption} onDeleteEntryModelOption={deleteEntryModelOption} onAddImages={addImages} onRemoveImage={removeImage} imageUploading={imageUploading} />
            ) : tab === "journal" ? (
              <JournalList trades={trades} onDelete={handleDelete} onGoLog={() => setTab("log")} />
            ) : tab === "dashboard" ? (
              <Dashboard trades={trades} />
            ) : (
              <LogTradeForm form={form} updateForm={updateForm} toggleEmotion={toggleEmotion} handleSave={handleSave} canSave={canSave} symbolOptions={symbolOptions} entryModelOptions={entryModelOptions} onAddSymbolOption={addSymbolOption} onAddEntryModelOption={addEntryModelOption} onDeleteSymbolOption={deleteSymbolOption} onDeleteEntryModelOption={deleteEntryModelOption} onAddImages={addImages} onRemoveImage={removeImage} imageUploading={imageUploading} />
            )}
            
          </div>

          {/* AI Chat panel permanen (desktop only) — tampil di semua halaman */}
          {isDesktop && loaded && (
            <div className="desktop-chat-panel">
              <JournalChat user={user} trades={trades} theme={C} />
            </div>
          )}
        </div>

        {/* Bottom nav (mobile) */}
        <MobileDockNav
          items={NAV}
          activeKey={tab}
          onSelect={setTab}
          registerItemRef={(key, el) => { navRefs.current[key] = el; }}
          indicator={navIndicator}
          accentColor={C.btnAccent}
        />
      </div>
    </ThemeContext.Provider>
  );
}

// ---- Log Trade ----
const CALENDAR_ROWS = 6;
const CALENDAR_CELLS = CALENDAR_ROWS * 7;

const calendarSlideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

function DateField({ value, onChange, align = "left" }) {
  const C = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const initial = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [slideDir, setSlideDir] = useState(1);
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
  const pad = (n) => String(n).padStart(2, "0");

  // Popup ini di-portal ke document.body, jadi selama dia terbuka, layar di
  // belakangnya dikunci (nggak bisa discroll) — sama seperti popup delete
  // trade. Cara keluarnya cuma dua: pilih tanggal (selectDay) atau klik di
  // luar kartu kalender (onClick di overlay).
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);
  const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  // Pad to a fixed number of cells so the grid is always the same height,
  // no matter how many days/rows a given month actually needs.
  while (cells.length < CALENDAR_CELLS) cells.push(null);

  function selectDay(d) {
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
    setOpen(false);
  }
  function prevMonth() {
    setSlideDir(-1);
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    setSlideDir(1);
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1);
  }

  // Kalender selalu tampil sebagai popup "mobile style": overlay fixed
  // full-screen yang nge-center isinya pakai flexbox (bukan top/left 50%
  // + translate), supaya nggak meleset di browser/HP manapun. Selalu
  // di-portal ke <body> supaya tidak kepotong overflow/parent manapun —
  // makanya warna teks (C.ink) juga di-set eksplisit di sini, karena di
  // luar #root popup ini nggak lagi otomatis ikut warna tema app.
  const popupContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          onClick={() => setOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed", inset: 0, zIndex: 29,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, boxSizing: "border-box",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "min(85vw, 280px)", maxWidth: 280, color: C.ink,
              background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, padding: 16,
              boxShadow: C.shadowModal,
            }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" onClick={prevMonth} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4, display: "flex" }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: SANS }}>{MONTHS[viewMonth]} {viewYear}</div>
            <button type="button" onClick={nextMonth} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4, display: "flex" }}>
              <ChevronRight size={18} />
              </button>
          </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
                        {WEEKDAYS.map((w, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 12, color: C.muted, fontWeight: 600, padding: "4px 0", fontFamily: SANS }}>{w}</div>
            ))}
          </div>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <AnimatePresence initial={false} custom={slideDir} mode="popLayout">
              <motion.div
                key={`${viewYear}-${viewMonth}`}
                custom={slideDir}
                variants={calendarSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  width: "100%",
                  display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                  gridAutoRows: "1fr", gridTemplateRows: `repeat(${CALENDAR_ROWS}, 1fr)`,
                  gap: 2,
                }}
              >
                {cells.map((d, i) => {
                  if (!d) return <div key={i} style={{ aspectRatio: "1" }} />;
                  const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
                  const isSelected = iso === value;
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => selectDay(d)}
                      style={{
                        aspectRatio: "1", border: "none", borderRadius: 0, cursor: "pointer",
                        background: isSelected ? C.btnAccent : "transparent",
                        color: isSelected ? C.btnAccentTextActive : C.ink,
                        fontSize: 14, fontFamily: SANS,
                      }}
                    >{d}</button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="no-press"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", boxSizing: "border-box", background: C.inputBg, border: `1px solid ${C.inputBorder}`,
          borderRadius: 0, height: 40, padding: "0 16px", color: C.inputText, fontFamily: SANS, fontSize: 16,
          textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center",
          boxShadow: "none",
        }}
      >
        {value ? fmtDateDisplay(value) : "Select date"}
      </button>
      {createPortal(popupContent, document.body)}
    </div>
  );
}

// ---- Notion-style creatable select: pick an existing tag or type to
// create a new one, so you don't have to retype the same symbol/model
// every time. Opens as a centered popup (same "mobile style" modal as
// DateField) instead of an inline dropdown, and each option row has its
// own delete (×) button so old/typo'd tags can be cleaned up. ----
function TagSelect({ value, onChange, options, onAddOption, onDeleteOption, placeholder, uppercase, disabled }) {
  const C = useTheme();
  const inputStyle = useInputStyle();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const norm = (s) => (uppercase ? s.toUpperCase() : s);
  const trimmedQuery = query.trim();
  const filtered = options.filter((o) => o.toLowerCase().includes(trimmedQuery.toLowerCase()));
  const exactMatch = options.some((o) => o.toLowerCase() === trimmedQuery.toLowerCase());

  // Sama seperti popup kalender: selama terbuka, layar di belakang dikunci
  // supaya tidak ikut discroll.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  function openMenu() {
    if (disabled) return;
    setQuery("");
    setConfirmDelete(null);
    setOpen(true);
  }
  function closeMenu() {
    setOpen(false);
    setConfirmDelete(null);
  }
  function select(opt) {
    onChange(opt);
    closeMenu();
  }
  function createAndSelect() {
    const v = norm(trimmedQuery);
    if (!v) return;
    if (!options.some((o) => o.toLowerCase() === v.toLowerCase())) onAddOption(v);
    onChange(v);
    closeMenu();
  }
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (exactMatch) select(options.find((o) => o.toLowerCase() === trimmedQuery.toLowerCase()));
      else createAndSelect();
    } else if (e.key === "Escape") {
      closeMenu();
    }
  }
  function requestDelete(e, opt) {
    e.stopPropagation();
    setConfirmDelete(opt);
  }
  function confirmDeleteNow(e, opt) {
    e.stopPropagation();
    onDeleteOption?.(opt);
    if (opt === value) onChange("");
    setConfirmDelete(null);
  }

  const popupContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          onClick={closeMenu}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed", inset: 0, zIndex: 29,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, boxSizing: "border-box",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "min(88vw, 320px)", maxWidth: 320, maxHeight: "min(80vh, 440px)",
              display: "flex", flexDirection: "column", color: C.ink,
              background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, padding: 14,
              boxShadow: C.shadowModal,
            }}>
            <input
              type="text"
              autoFocus
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(norm(e.target.value))}
              onKeyDown={handleKeyDown}
              style={{
                ...inputStyle, height: 40, padding: "0 14px", marginBottom: 10, flexShrink: 0,
                textTransform: uppercase ? "uppercase" : "none",
              }}
            />
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {filtered.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => select(opt)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        border: `1px solid ${C.line}`, borderRadius: 0, padding: "8px 10px",
                        background: opt === value ? C.btnAccentWash : C.paperSoft,
                        color: opt === value ? C.btnAccentText : C.ink,
                        fontSize: 14, fontWeight: 600, fontFamily: SANS, cursor: "pointer",
                      }}
                    >
                      <span>{opt}</span>
                      {confirmDelete === opt ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={(e) => confirmDeleteNow(e, opt)}
                            style={{
                              border: "none", background: "transparent", color: C.rustRed,
                              fontSize: 12, fontWeight: 700, fontFamily: SANS, cursor: "pointer", padding: "2px 4px",
                            }}
                          >Delete</button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                            style={{
                              border: "none", background: "transparent", color: C.muted,
                              fontSize: 12, fontFamily: SANS, cursor: "pointer", padding: "2px 4px",
                            }}
                          >Cancel</button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => requestDelete(e, opt)}
                          style={{
                            border: "none", background: "transparent", color: C.muted,
                            cursor: "pointer", padding: 2, display: "flex", flexShrink: 0,
                          }}
                          aria-label={`Delete ${opt}`}
                        ><X size={15} /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {trimmedQuery && !exactMatch && (
                <button
                  type="button"
                  onClick={createAndSelect}
                  style={{
                    width: "100%", textAlign: "left", border: "none", background: "transparent",
                    color: C.muted, fontSize: 13, fontFamily: SANS, cursor: "pointer",
                    padding: "8px 4px", marginTop: filtered.length > 0 ? 6 : 0,
                  }}
                >
                  + Create "{norm(trimmedQuery)}"
                </button>
              )}
              {filtered.length === 0 && !trimmedQuery && (
                <div style={{ color: C.faint, fontSize: 13, fontFamily: SANS, padding: "6px 4px" }}>
                  Start typing to create an option.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="no-press"
        disabled={disabled}
        onClick={openMenu}
        style={{
          width: "100%", boxSizing: "border-box", background: C.inputBg, border: `1px solid ${C.inputBorder}`,
          borderRadius: 0, height: 40, padding: "0 16px", color: value ? C.inputText : C.faint,
          fontFamily: SANS, fontSize: 16, textTransform: uppercase ? "uppercase" : "none",
          textAlign: "left", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center",
          opacity: disabled ? 0.5 : 1, boxShadow: "none",
        }}
      >
        {value || placeholder}
      </button>
      {createPortal(popupContent, document.body)}
    </div>
  );
}

function LogTradeForm({ form, updateForm, toggleEmotion, handleSave, canSave, symbolOptions, entryModelOptions, onAddSymbolOption, onAddEntryModelOption, onDeleteSymbolOption, onDeleteEntryModelOption, onAddImages, onRemoveImage, imageUploading }) {
  const C = useTheme();
  const inputStyle = useInputStyle();
  const fileInputRef = useRef(null);
  return (
    <div style={{ background: C.paperSoftLight, borderRadius: 0, padding: 24, width: "100%", maxWidth: "100%", boxSizing: "border-box", fontSize: 16, border: `1px solid ${C.line}`, boxShadow: C.shadowCard }}>
      <Field label="Date">
        <DateField value={form.date} onChange={(d) => updateForm("date", d)} />
      </Field>
      <Field label="Symbol">
        <TagSelect
          value={form.symbol}
          onChange={(v) => updateForm("symbol", v)}
          options={symbolOptions}
          onAddOption={onAddSymbolOption}
          onDeleteOption={onDeleteSymbolOption}
          placeholder="EURUSD, XAUUSD, ..."
          uppercase
        />
      </Field>
      <Field label="Direction">
        <div style={{ display: "flex", gap: 12 }}>
          {["Long", "Short"].map((d) => (
            <PillToggle key={d} label={d} active={form.direction === d} onClick={() => updateForm("direction", d)} />
          ))}
        </div>
      </Field>
      <Field label="Reason / Setup">
        <input type="text" placeholder="Breakout retest, reversal, ..." value={form.reason} onChange={(e) => updateForm("reason", e.target.value)} style={{ ...inputStyle, height: 40, padding: "0 16px" }} />
      </Field>
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
          <div style={{
            fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
            color: C.muted, textTransform: "capitalize",
          }}>Entry Model</div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: SANS }}>Count in stats</span>
            <input
              type="checkbox"
              checked={form.entryModelTracked}
              onChange={(e) => updateForm("entryModelTracked", e.target.checked)}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: C.btnAccent }}
            />
          </label>
        </div>
        <TagSelect
          value={form.entryModel}
          onChange={(v) => updateForm("entryModel", v)}
          options={entryModelOptions}
          onAddOption={onAddEntryModelOption}
          onDeleteOption={onDeleteEntryModelOption}
          placeholder="Not everyone uses one — optional"
        />
      </div>
      <RiskRPanel form={form} updateForm={updateForm} />
      <Field label="Rules Compliance">
        <div style={{ display: "flex", gap: 12 }}>
          {["Yes", "No"].map((r) => (
            <PillToggle key={r} label={r} active={form.rules === r} onClick={() => updateForm("rules", r)} />
          ))}
        </div>
      </Field>
      <Field label="Emotions">
        <EmotionSlider value={form.emotion} onChange={(e) => updateForm("emotion", e)} theme={C} />
      </Field>
      <Field label="Notes">
        <textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
      </Field>
      <div style={{ marginTop: -10, marginBottom: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {(form.images || []).map((src, i) => (
            <div key={i} style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
              <img src={src} alt="" style={{
                width: "100%", height: "100%", objectFit: "cover", border: `1px solid ${C.line}`, borderRadius: 0,
              }} />
              <button
                type="button"
                onClick={() => onRemoveImage(i)}
                aria-label="Remove image"
                style={{
                  position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: "50%",
                  background: C.ink, color: C.paper, border: `1px solid ${C.paper}`,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
                }}
              ><X size={12} /></button>
            </div>
          ))}
          {(form.images || []).length < 8 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              aria-label="Add image"
              style={{
                width: "100%", aspectRatio: "1", border: `1px dashed ${C.line}`, borderRadius: 0,
                background: C.inputBg, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: imageUploading ? "wait" : "pointer",
              }}
            >
              <Plus size={22} />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => { onAddImages(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        style={{
          width: "100%", padding: "16px 0", borderRadius: 0, border: "none",
          background: canSave ? C.btnAccent : C.lineSoft,
          color: canSave ? C.btnAccentTextActive : C.faint,
          fontWeight: 700, fontSize: 17, cursor: canSave ? "pointer" : "not-allowed",
          boxShadow: canSave ? C.shadowCard : "none",
          transition: "background-color 0.15s ease, color 0.15s ease",
        }}
      >
        Save Trade
      </button>
          </div>
  );
}

// ---- Journal ----
function JournalList({ trades, onDelete, onGoLog }) {
  const C = useTheme();
  const [confirmId, setConfirmId] = useState(null);
  const confirmTrade = trades.find((t) => t.id === confirmId) || null;

  // Kunci scroll di belakang popup delete selama dia terbuka — sama seperti
  // popup kalender. Keluarnya cuma lewat "No" / "Yes, Delete" atau klik di
  // luar kartu (overlay).
  useEffect(() => {
    if (!confirmTrade) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [confirmTrade]);

  if (trades.length === 0) {
    return (
      <div style={{ marginTop: 30, textAlign: "center", color: C.muted }}>
        <div style={{ fontSize: 16, marginBottom: 16 }}>No trades logged yet.</div>
        <button onClick={onGoLog} style={{
          display: "inline-flex", alignItems: "center", gap: 8, background: C.clayWash,
          border: `1px solid ${C.clay}`, color: C.clayOnWhite, borderRadius: 0, padding: "12px 20px",
          fontWeight: 700, fontSize: 15, cursor: "pointer",
        }}><Plus size={18} /> Log your first trade</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: "100%" }}>
      {trades.map((t) => {
        const win = t.rActual > 0;
        return (
          <div key={t.id} style={{
            background: C.paperSoftLight, border: `1px solid ${C.line}`,
            borderRadius: 0, padding: "20px 22px", boxShadow: C.shadowCard,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
  <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
    <div style={{ fontWeight: 700, fontSize: 19 }}>{t.symbol}</div>
    <div style={{ fontFamily: SANS, fontSize: 10, color: C.faint }}>{t.date}</div>
  </div>
  <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: win ? C.ink : C.faint }}>
    {fmtR(t.rActual)}
  </div>
</div>
{t.reason && <div style={{ fontSize: 15, color: C.inkSoft, marginTop: 11 }}>{t.reason}</div>}
<div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 13 }}>
  {t.direction && <Tag text={`Direction: ${t.direction}`} />}
  {t.rules && <Tag text={`Rules: ${t.rules}`} />}
  {(t.emotions || []).map((e) => <Tag key={e} text={`Emotion: ${e}`} />)}
</div>
            {t.notes && <div style={{ fontSize: 14, color: C.muted, marginTop: 11, fontStyle: "italic" }}>{t.notes}</div>}
            {t.images && t.images.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
                {t.images.map((src, i) => (
                  <img key={i} src={src} alt="" style={{
                    width: 64, height: 64, objectFit: "cover", border: `1px solid ${C.line}`, borderRadius: 0,
                  }} />
                ))}
              </div>
            )}
            <button onClick={() => setConfirmId(t.id)} style={{
              marginTop: 15, background: "transparent", border: "none", color: C.faint, fontSize: 10,
  display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0,
            }}><Trash2 size={11} /> Delete</button>
          </div>
        );
      })}
      <AnimatePresence>
        {confirmTrade && (
          <motion.div
            key="delete-confirm-overlay"
            onClick={() => setConfirmId(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed", inset: 0, zIndex: 39,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16, boxSizing: "border-box",
              background: "rgba(0,0,0,0.35)",
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: "min(360px, calc(100vw - 48px))",
                background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, padding: 24,
                boxShadow: C.shadowModal,
              }}
            >
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, marginBottom: 9, letterSpacing: "-0.01em", color: C.ink }}>Delete this trade?</div>
              <div style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.5, marginBottom: 22 }}>
                {confirmTrade.symbol} &middot; {confirmTrade.date} &middot; {fmtR(confirmTrade.rActual)} will be permanently removed.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirmId(null)}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 0, border: `1px solid ${C.line}`,
                    background: C.paperSoft, color: C.ink, fontWeight: 700, fontSize: 15.5, cursor: "pointer",
                  }}
                >No</button>
                <button
                  onClick={() => { onDelete(confirmTrade.id); setConfirmId(null); }}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 0, border: "none",
                    background: C.dangerBg, color: "#FFFFFF", fontWeight: 700, fontSize: 15.5, cursor: "pointer",
                  }}
                >Yes, Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Dashboard ----
function ScorecardTick({ x, y, cx, cy, payload, textAnchor }) {
  const C = useTheme();
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const push = 12;
  const nx = x + (dx / dist) * push;
  const ny = y + (dy / dist) * push;
  const words = String(payload.value).split(" ");
  return (
    <text x={nx} y={ny} textAnchor={textAnchor} fontFamily={SANS} fontSize={13} fontWeight={700} fill={C.inkSoft}>
      {words.map((w, i) => (
        <tspan key={i} x={nx} dy={i === 0 ? (words.length > 1 ? -6 : 4) : 14}>{w}</tspan>
      ))}
    </text>
  );
}
function StatCard({ label, value, color }) {
  const C = useTheme();
  return (
    <div style={{ background: C.paperSoftStat, border: `1px solid ${C.line}`, borderRadius: 0, padding: "13px 15px", boxShadow: C.shadowCard }}>
      <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", color: C.muted, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: SANS, fontSize: 19, fontWeight: 700, color: C.ink }}>{value}</div>
    </div>
  );
}
function EquityCurve({ trades }) {
  const C = useTheme();
  const data = useMemo(() => computeEquityCurve(trades), [trades]);
  const final = data.length ? data[data.length - 1].cum : 0;
  const color = final >= 0 ? C.sage : C.rustRed;
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.lineSoft} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="index" tick={{ fontFamily: SANS, fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
          <YAxis tick={{ fontFamily: MONO, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, fontFamily: SANS, fontSize: 12 }}
            labelFormatter={(v, payload) => (payload && payload[0] ? `${payload[0].payload.symbol} \u00b7 ${fmtDateDisplay(payload[0].payload.date)}` : v)}
            formatter={(value) => [fmtR(value), "Cumulative R"]}
            cursor={{ stroke: C.faint, strokeWidth: 1 }}
          />
          <ReferenceLine y={0} stroke={C.line} />
          <Area type="monotone" dataKey="cum" stroke={color} strokeWidth={2} fill="url(#equityFill)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TradeRTooltip({ active, payload }) {
  const C = useTheme();
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const color = d.r >= 0 ? C.sage : C.rustRed;
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, padding: "9px 12px", fontFamily: SANS, fontSize: 12, boxShadow: C.shadowPopover }}>
      <div style={{ color: C.muted, marginBottom: 3 }}>{d.symbol} &middot; {fmtDateDisplay(d.date)}</div>
      <div style={{ color, fontWeight: 700, fontSize: 13 }}>{fmtR(d.r)}</div>
    </div>
  );
}
function TradeRBarChart({ trades }) {
  const C = useTheme();
  const data = useMemo(() => {
    const sorted = [...trades].sort((a, b) => parseISO(a.date) - parseISO(b.date));
    return sorted.map((t, i) => ({ index: i + 1, date: t.date, symbol: t.symbol, r: t.rActual }));
  }, [trades]);
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={C.lineSoft} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="index" tick={{ fontFamily: SANS, fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
          <YAxis tick={{ fontFamily: MONO, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<TradeRTooltip />} cursor={{ fill: C.line, opacity: 0.18 }} />
          <ReferenceLine y={0} stroke={C.line} />
          <Bar dataKey="r" radius={0}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.r >= 0 ? C.sage : C.rustRed} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CalendarHeatmap({ trades, year }) {
  const C = useTheme();
  const dailyMap = useMemo(
    () => computeDailyR(trades.filter((t) => parseISO(t.date).getFullYear() === year)),
    [trades, year]
  );

  const weeks = useMemo(() => {
    const start = new Date(year, 0, 1);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    const end = new Date(year, 11, 31);
    const gridEnd = new Date(end);
    gridEnd.setDate(end.getDate() + (6 - end.getDay()));

    const cols = [];
    let cur = new Date(gridStart);
    while (cur <= gridEnd) {
      const col = [];
      for (let i = 0; i < 7; i++) {
        const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        col.push({ date: new Date(cur), iso, inYear: cur.getFullYear() === year });
        cur.setDate(cur.getDate() + 1);
      }
      cols.push(col);
    }
    return cols;
  }, [year]);

  const maxAbs = useMemo(() => {
    let m = 0;
    dailyMap.forEach((v) => { m = Math.max(m, Math.abs(v.total)); });
    return m || 1;
  }, [dailyMap]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((col, i) => {
      const first = col.find((d) => d.inYear);
      if (first && first.date.getDate() <= 7 && first.date.getMonth() !== lastMonth) {
        labels.push({ index: i, label: first.date.toLocaleString("en-US", { month: "short" }) });
        lastMonth = first.date.getMonth();
      }
    });
    return labels;
  }, [weeks]);

  const cell = 11, gap = 3;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ position: "relative", height: 14, marginBottom: 4, marginLeft: 22 }}>
        {monthLabels.map((m) => (
          <div key={m.index} style={{ position: "absolute", left: m.index * (cell + gap), fontFamily: SANS, fontSize: 10, color: C.muted }}>{m.label}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap }}>
        <div style={{ display: "flex", flexDirection: "column", gap, marginRight: 4 }}>
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
            <div key={i} style={{ width: 18, height: cell, fontFamily: SANS, fontSize: 9, color: C.muted, lineHeight: `${cell}px` }}>{d}</div>
          ))}
        </div>
        {weeks.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap }}>
            {col.map((d, di) => {
              const data = dailyMap.get(d.iso);
              let bg = C.lineSoft;
              let opacity = d.inYear ? 0.45 : 0;
              if (d.inYear && data) {
                const intensity = clamp(Math.abs(data.total) / maxAbs, 0.3, 1);
                bg = data.total > 0 ? C.sage : data.total < 0 ? C.rustRed : C.lineSoft;
                opacity = data.total === 0 ? 0.5 : intensity;
              }
              const title = data
                ? `${fmtDateDisplay(d.iso)} \u00b7 ${fmtR(data.total)} \u00b7 ${data.count} trade${data.count === 1 ? "" : "s"}`
                : fmtDateDisplay(d.iso);
              return (
                <div
                  key={di}
                  title={title}
                  style={{ width: cell, height: cell, borderRadius: 0, background: bg, opacity, border: `1px solid ${C.line}` }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontFamily: SANS, fontSize: 10.5, color: C.muted }}>
        <span>Loss</span>
        {[1, 0.7, 0.4].map((o) => (
          <div key={`l${o}`} style={{ width: cell, height: cell, borderRadius: 0, background: C.rustRed, opacity: o, border: `1px solid ${C.line}` }} />
        ))}
        <div style={{ width: cell, height: cell, borderRadius: 0, background: C.lineSoft, opacity: 0.45, border: `1px solid ${C.line}` }} />
        {[0.4, 0.7, 1].map((o) => (
          <div key={`w${o}`} style={{ width: cell, height: cell, borderRadius: 0, background: C.sage, opacity: o, border: `1px solid ${C.line}` }} />
        ))}
        <span>Win</span>
      </div>
    </div>
  );
}

function SymbolTooltip({ active, payload }) {
  const C = useTheme();
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const color = d.totalR >= 0 ? C.sage : C.rustRed;
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, padding: "9px 12px", fontFamily: SANS, fontSize: 12, boxShadow: C.shadowPopover }}>
      <div style={{ color: C.ink, fontWeight: 700, marginBottom: 3 }}>{d.symbol}</div>
      <div style={{ color, fontWeight: 700, fontSize: 13 }}>{fmtR(d.totalR)}</div>
      <div style={{ color: C.muted, marginTop: 3 }}>{d.winRate.toFixed(0)}% win rate &middot; {d.count} trade{d.count === 1 ? "" : "s"}</div>
    </div>
  );
}
function SymbolPerformanceChart({ trades }) {
  const C = useTheme();
  const data = useMemo(() => computeSymbolStats(trades), [trades]);
  const barHeight = 34;
  const chartHeight = Math.max(120, data.length * barHeight + 20);
  return (
    <div style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={C.lineSoft} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontFamily: MONO, fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
          <YAxis
            type="category" dataKey="symbol" width={70}
            tick={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, fill: C.ink }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<SymbolTooltip />} cursor={{ fill: C.line, opacity: 0.18 }} />
          <ReferenceLine x={0} stroke={C.line} />
          <Bar dataKey="totalR" radius={0} barSize={18}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.totalR >= 0 ? C.sage : C.rustRed} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function YearStepper({ year, years, onChange }) {
  const C = useTheme();
  const idx = years.indexOf(year);
  const canUp = idx > 0; // years sorted descending, so index-1 = newer year
  const canDown = idx !== -1 && idx < years.length - 1;
  const stepHeight = 42;

  const goUp = () => { if (canUp) onChange(years[idx - 1]); };
  const goDown = () => { if (canDown) onChange(years[idx + 1]); };

  const btnStyle = (enabled) => ({
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    background: C.paperSoft, border: "none", padding: 0,
    color: enabled ? C.ink : C.faint, cursor: enabled ? "pointer" : "default",
  });

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: stepHeight, minWidth: 90, padding: "0 14px",
        background: C.inputBg, border: `1px solid ${C.btnAccentBorder}`, borderRadius: 0,
      }}>
        <Counter
          value={year}
          places={[1000, 100, 10, 1]}
          fontSize={16}
          padding={2}
          gap={1}
          horizontalPadding={0}
          textColor={C.inputText}
          fontWeight={700}
          topGradientStyle={{ display: "none" }}
          bottomGradientStyle={{ display: "none" }}
        />
      </div>
      <div style={{
        display: "flex", flexDirection: "column", height: stepHeight, width: 32,
        borderRadius: 0, overflow: "hidden", border: `1px solid ${C.line}`,
      }}>
        <button type="button" onClick={goUp} disabled={!canUp} style={{ ...btnStyle(canUp), borderBottom: `1px solid ${C.line}` }}>
          <ChevronUp size={14} strokeWidth={2.5} />
        </button>
        <button type="button" onClick={goDown} disabled={!canDown} style={btnStyle(canDown)}>
          <ChevronDown size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ---- Bottom nav (mobile) with a Dock-style magnify effect, but text labels ----
// Adapted from the reactbits.dev "Dock" pattern: items scale up the closer
// the pointer/finger gets to their center. On touch devices there's no
// hover, so we track the live touch position while the finger is dragging
// across the bar (onTouchMove) and relax back to normal size on release.
function DesktopDockItem({ label, active, onClick, mouseY, spring, distance, magnification, registerRef }) {
  const C = useTheme();
  const localRef = useRef(null);
  const setRef = (el) => {
    localRef.current = el;
    if (registerRef) registerRef(el);
  };
  const mouseDistance = useTransform(mouseY, (val) => {
    const rect = localRef.current?.getBoundingClientRect() ?? { y: 0, height: 40 };
    return val - rect.y - rect.height / 2;
  });
  const targetScale = useTransform(mouseDistance, [-distance, 0, distance], [1, magnification, 1]);
  const scale = useSpring(targetScale, spring);

  return (
    <motion.button
      ref={setRef}
      onClick={onClick}
      className="nav-item-desktop"
      style={{
        scale,
        transformOrigin: "center left",
        color: active ? C.ink : C.faint,
        background: active ? C.navActiveBg : "transparent",
      }}
    >
      {label}
    </motion.button>
  );
}

function DesktopDockNav({ items, activeKey, onSelect, registerItemRef, indicator, accentColor }) {
  const mouseY = useMotionValue(Infinity);
  const spring = { mass: 0.15, stiffness: 160, damping: 14 };

  return (
    <div
      style={{ position: "relative" }}
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
    >
      {items.map((n) => (
        <DesktopDockItem
          key={n.key}
          label={n.label}
          active={activeKey === n.key}
          onClick={() => onSelect(n.key)}
          mouseY={mouseY}
          spring={spring}
          distance={60}
          magnification={1.08}
          registerRef={(el) => registerItemRef(n.key, el)}
        />
      ))}
      <div style={{
        position: "absolute", top: indicator.top, right: 0,
        width: 3, height: indicator.height, borderRadius: 0,
        background: accentColor,
        transition: "top .28s cubic-bezier(.4,0,.2,1), height .28s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

function MobileDockItem({ label, active, onClick, mouseX, spring, distance, magnification, registerRef }) {
  const C = useTheme();
  const localRef = useRef(null);
  const setRef = (el) => {
    localRef.current = el;
    if (registerRef) registerRef(el);
  };
  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = localRef.current?.getBoundingClientRect() ?? { x: 0, width: 60 };
    return val - rect.x - rect.width / 2;
  });
  const targetScale = useTransform(mouseDistance, [-distance, 0, distance], [1, magnification, 1]);
  const scale = useSpring(targetScale, spring);

  return (
    <motion.button
      ref={setRef}
      onClick={onClick}
      style={{
        scale,
        transformOrigin: "bottom center",
        background: active ? C.navActiveBg : "transparent",
        border: "none", cursor: "pointer",
        padding: "6px 10px 4px", borderRadius: 0,
        color: active ? C.ink : C.faint,
      }}
    >
      <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </motion.button>
  );
}

function MobileDockNav({ items, activeKey, onSelect, registerItemRef, indicator, accentColor }) {
  const mouseX = useMotionValue(Infinity);
  const spring = { mass: 0.15, stiffness: 160, damping: 14 };

  return (
    <div
      className="bottom-nav"
      style={{ alignItems: "center" }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      onTouchMove={(e) => { if (e.touches && e.touches[0]) mouseX.set(e.touches[0].clientX); }}
      onTouchEnd={() => mouseX.set(Infinity)}
      onTouchCancel={() => mouseX.set(Infinity)}
    >
      {items.map((n) => (
        <MobileDockItem
          key={n.key}
          label={n.label}
          active={activeKey === n.key}
          onClick={() => onSelect(n.key)}
          mouseX={mouseX}
          spring={spring}
          distance={85}
          magnification={1.32}
          registerRef={(el) => registerItemRef(n.key, el)}
        />
      ))}
      <div style={{
        position: "absolute", top: 0, height: 3, borderRadius: 0,
        background: accentColor,
        left: indicator.left, width: indicator.width,
        transition: "left .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

function Dashboard({ trades }) {
  const C = useTheme();
  const [period, setPeriod] = useState("all");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const availableYears = useMemo(() => tradeYears(trades), [trades]);
  const [heatmapYear, setHeatmapYear] = useState(() => availableYears[0] || new Date().getFullYear());

  useEffect(() => {
    if (availableYears.length && !availableYears.includes(heatmapYear)) {
      setHeatmapYear(availableYears[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableYears]);

  const filteredTrades = useMemo(() => {
    if (period === "all") return trades;
    if (period === "week") return trades.filter((t) => parseISO(t.date) >= startOfWeek(new Date()));
    if (period === "month") return trades.filter((t) => parseISO(t.date) >= startOfMonth(new Date()));
    if (period === "year") return trades.filter((t) => parseISO(t.date) >= startOfYear(new Date()));
    if (period === "custom" && customRange.from && customRange.to) {
      const from = parseISO(customRange.from);
      const to = parseISO(customRange.to);
      to.setHours(23, 59, 59, 999);
      return trades.filter((t) => { const d = parseISO(t.date); return d >= from && d <= to; });
    }
    return trades;
  }, [trades, period, customRange]);
  const stats = useMemo(() => computeStats(filteredTrades), [filteredTrades]);

  if (trades.length === 0) {
    return <div style={{ marginTop: 30, color: C.muted, fontSize: 16 }}>Log a trade to see your performance dashboard.</div>;
  }

  // Only one chart's tooltip should be visible at a time. Recharts keeps its
  // hover/tap state internally per-chart, so tapping chart B doesn't close
  // chart A's tooltip on its own. We force-remount every OTHER chart whenever
  // a new one is tapped, which resets its internal tooltip state to closed.
  const [activeChart, setActiveChart] = useState(null);
  const [chartGen, setChartGen] = useState(0);
  const activateChart = (id) => {
    setActiveChart((prev) => {
      if (prev !== id) setChartGen((g) => g + 1);
      return id;
    });
  };
  const chartKey = (id) => (activeChart === id ? `${id}-active` : `${id}-idle-${chartGen}`);

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 9 }}>
        {PERIODS.slice(0, 3).map((p) => (
          <Chip key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 9, marginBottom: 10 }}>
        {PERIODS.slice(3).map((p) => (
          <Chip key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
        ))}
        <Chip label="Custom Range" active={period === "custom"} onClick={() => setPeriod("custom")} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
      </div>
      {period === "custom" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <DateField value={customRange.from} onChange={(d) => setCustomRange((r) => ({ ...r, from: d }))} />
          </div>
          <span style={{ color: C.muted, fontSize: 13, fontFamily: SANS }}>to</span>
          <div style={{ flex: 1, minWidth: 120 }}>
            <DateField value={customRange.to} onChange={(d) => setCustomRange((r) => ({ ...r, to: d }))} align="right" />
          </div>
        </div>
      )}
      {filteredTrades.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 16, marginBottom: 28 }}>No trades logged in this period.</div>
      ) : (
        <>
          <SectionLabel text={`Summary \u00b7 ${filteredTrades.length} trade${filteredTrades.length === 1 ? "" : "s"}`} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            <StatCard label="Total Trades" value={stats.total} />
            <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={C.clayDeep} />
            <StatCard label="Total R" value={fmtR(stats.totalR)} color={stats.totalR >= 0 ? C.sage : C.rustRed} />
            <StatCard label="Expectancy" value={stats.expectancy.toFixed(2)} color={C.clayDeep} />
            <StatCard label="Avg Win" value={`+${stats.avgWin.toFixed(2)}`} color={C.sage} />
            <StatCard label="Avg Loss" value={stats.avgLoss.toFixed(2)} color={C.rustRed} />
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Equity Curve</div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 3, marginBottom: 0 }}>Cumulative R, trade by trade</div>
            </div>
            <div onPointerDown={() => activateChart("equity")}>
              <EquityCurve key={chartKey("equity")} trades={filteredTrades} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>R per Trade</div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 3, marginBottom: 0 }}>Green = win, red = loss</div>
            </div>
            <div onPointerDown={() => activateChart("rbar")}>
              <TradeRBarChart key={chartKey("rbar")} trades={filteredTrades} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Performance by Symbol</div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 3, marginBottom: 0 }}>Total R per simbol, diurutkan dari yang paling profitable</div>
            </div>
            <div onPointerDown={() => activateChart("symbol")}>
              <SymbolPerformanceChart key={chartKey("symbol")} trades={filteredTrades} />
            </div>
          </div>

          <div style={{ marginBottom: 18, marginTop: -6 }}>
  <div style={{ padding: "0 4px", marginBottom: 16 }}>
    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Trader Scorecard</div>
    <div style={{ fontSize: 14, color: C.muted, marginTop: 3, marginBottom: 0 }}>Score 0–100 per dimension</div>
  </div>
  <div style={{ width: "100%", height: 320, overflow: "visible" }}>
    <ResponsiveContainer>
      <RadarChart data={stats.scorecard} outerRadius="72%" margin={{ top: 4, right: 32, bottom: 4, left: 46 }}>
                  <PolarGrid stroke={C.line} />
                  <PolarAngleAxis dataKey="metric" tick={<ScorecardTick />} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke={C.btnAccent} fill={C.btnAccent} fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: C.btnAccent, fillOpacity: 1, stroke: "none" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <SectionLabel text="By Rules Compliance" />
          <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 0, padding: "4px 18px", boxShadow: C.shadowCard }}>
  {["Yes", "Partial", "No"].map((r, i) => {
    const d = stats.byRules[r];
    const avg = d.count ? d.total / d.count : 0;
    return (
      <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderTop: i > 0 ? `1px solid ${C.lineSoft}` : "none" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, minWidth: 64 }}>{r}</div>
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, textAlign: "right" }}>
          {d.count} trade &middot; total {fmtR(d.total)} &middot; avg {avg.toFixed(2)}R
        </div>
      </div>
    );
  })}
          </div>

          {availableYears.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 4px", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Trade Calendar</div>
                  <div style={{ fontSize: 14, color: C.muted, marginTop: 3, marginBottom: 0 }}>Daily P&amp;L for {heatmapYear}</div>
                </div>
                <YearStepper year={heatmapYear} years={availableYears} onChange={setHeatmapYear} />
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 0, padding: "14px 18px", boxShadow: C.shadowCard }}>
                <CalendarHeatmap trades={trades} year={heatmapYear} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
