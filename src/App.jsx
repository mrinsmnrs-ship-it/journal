import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import {
  Trash2, Plus, PencilLine, BookOpen, LayoutDashboard,
  Sun, Moon, ChevronLeft, ChevronRight, LogOut, MessageCircle,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from "recharts";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { loadUserData, saveUserData } from "./store";
import AuthScreen from "./AuthScreen.jsx";
import JournalChat from "./JournalChat.jsx";

// ---- Design tokens : Claude-matched palette (clay / sage / amber) ----
const LIGHT = {
  bg: "#FAF9F5", paper: "#FFFFFF", paperSoft: "#F0EEE6",
  ink: "#141413", inkSoft: "#3D3D3A", muted: "#767470", faint: "#AFAEA9",
  line: "#E3E2DD", lineSoft: "#EDECE8",
  clay: "#D97757", clayDeep: "#B85C3E", clayWash: "#F5E4DB", clayOnWhite: "#B85C3E",
  sage: "#788C5D", sageWash: "#E8ECE1", sageOnWhite: "#5F7048",
  rustRed: "#B85C50", rustWash: "#F1E2DE", rustOnWhite: "#B85C50", dangerBg: "#B85C50",
  amber: "#6A9BCC", amberWash: "#E4ECF3", amberOnWhite: "#3D6C9C",
  inputBg: "#F0EEE6", inputText: "#141413", inputPlaceholder: "#AFAEA9", inputBorder: "#E3E2DD",
  btnAccent: "#B98A72", btnAccentBorder: "#B98A72", btnAccentWash: "#EFE4DA",
  btnAccentText: "#9C6F58", btnAccentTextActive: "#FFFFFF",
};
const DARK = {
  bg: "#282725", paper: "#322F2C", paperSoft: "#3B3733",
  ink: "#FAF9F5", inkSoft: "#D8D6CF", muted: "#9C9A93", faint: "#6E6C64",
  line: "#4E4A44", lineSoft: "#3E3A35",
  clay: "#D97757", clayDeep: "#E8926F", clayWash: "#3A2A21", clayOnWhite: "#E8926F",
  sage: "#788C5D", sageWash: "#232A1D", sageOnWhite: "#9CB27E",
  rustRed: "#D28A7E", rustWash: "#3B2822", rustOnWhite: "#D28A7E", dangerBg: "#D28A7E",
  amber: "#6A9BCC", amberWash: "#1E2A35", amberOnWhite: "#8FB8DE",
  inputBg: "#3B3733", inputText: "#FAF9F5", inputPlaceholder: "#6E6C64", inputBorder: "#4E4A44",
  btnAccent: "#FAF9F5", btnAccentBorder: "#4E4A44", btnAccentWash: "#3B3733",
  btnAccentText: "#D8D6CF", btnAccentTextActive: "#322F2C",
};

const CHAT_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SERIF = CHAT_FONT; // font disatukan dengan halaman lain
const SANS = CHAT_FONT;  // font disatukan dengan halaman lain
const MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace";
const NAV = [
  { key: "log", label: "Log Trade", icon: PencilLine },
  { key: "journal", label: "Journal", icon: BookOpen },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "chat", label: "AI Chat", icon: MessageCircle },
];

function getPageBackground(themeMode, C) {
  return { backgroundColor: C.paper };
}

const EMOTIONS = ["Calm", "Confident", "Hesitant", "Bored", "FOMO", "Revenge", "Anxious"];
const POSITIVE_EMOTIONS = new Set(["Calm", "Confident"]);
const NEGATIVE_EMOTIONS = new Set(["Hesitant", "Bored", "FOMO", "Revenge", "Anxious"]);

const ThemeContext = createContext(LIGHT);
function useTheme() { return useContext(ThemeContext); }

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
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

const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

// ---- Small atoms ----
function Chip({ label, active, onClick }) {
  const C = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: SANS, fontSize: 13, fontWeight: 600,
        padding: "8px 15px", borderRadius: 999,
        border: `1px solid ${C.btnAccentBorder}`,
        background: active ? C.btnAccent : C.btnAccentWash,
        color: active ? C.btnAccentTextActive : C.btnAccentText,
        cursor: "pointer", transition: "all .15s ease",
      }}
    >
      {label}
    </button>
  );
}
function Field({ label, children }) {
  const C = useTheme();
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
        color: C.muted, marginBottom: 8, textTransform: "uppercase",
      }}>{label}</div>
      {children}
    </div>
  );
}
function useInputStyle() {
  const C = useTheme();
  return {
    width: "100%", boxSizing: "border-box", background: C.inputBg,
    border: `1px solid ${C.inputBorder}`, borderRadius: 12, padding: "12px 14px",
    color: C.inputText, fontFamily: SANS, fontSize: 15, outline: "none",
  };
}
function Tag({ text }) {
  // Monokrom: satu warna netral saja, tidak lagi per-kategori (clay/sage/rust/amber)
  const C = useTheme();
  return (
    <span style={{
      fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.inkSoft,
      background: C.paperSoft, border: `1px solid ${C.line}`,
      borderRadius: 999, padding: "4px 11px",
    }}>
      {text}
    </span>
  );
}
function SectionLabel({ text }) {
  const C = useTheme();
  return (
    <div style={{
      fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
      color: C.muted, marginBottom: 14, textTransform: "uppercase",
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
        background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 999,
        padding: compact ? "8px" : "9px 14px", cursor: "pointer", color: C.inkSoft,
        fontFamily: SANS, fontSize: 13, fontWeight: 600,
      }}
    >
      <Icon size={15} style={{ color: C.ink }} />
      {!compact && label}
    </button>
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, color: "#767470" }}>
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
  const [blinkFrame, setBlinkFrame] = useState("open"); // "open" | "open2" | "half" | "closed" — untuk ikon mata di header
  const [trades, setTrades] = useState([]);
  const [themeMode, setThemeMode] = useState("light");
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(), symbol: "", direction: "", reason: "",
    riskPct: "", rPlanned: "", rActual: "", rules: "", emotion: "", notes: "",
  });

  useEffect(() => {
    (async () => {
      const data = await loadUserData(user.uid);
      setTrades(data.trades);
      setThemeMode(THEME_ORDER.includes(data.theme) ? data.theme : "light");
      setLoaded(true);
    })();
  }, [user.uid]);

  // Animasi kedip untuk ikon mata di header — sama seperti di halaman login.
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
    };
    const next = [trade, ...trades];
    setTrades(next);
    await saveUserData(user.uid, { trades: next });
    setForm({ date: todayISO(), symbol: "", direction: "", reason: "", riskPct: "", rPlanned: "", rActual: "", rules: "", emotion: "", notes: "" });
    setTab("journal");
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

  const NAV = [
    { key: "log", label: "Log Trade", icon: PencilLine },
    { key: "journal", label: "Journal", icon: BookOpen },
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "chat", label: "AI Chat", icon: MessageCircle },
  ];

  const C = themeMode === "dark" ? DARK : LIGHT;
  const isChatTab = tab === "chat";

  return (
    <ThemeContext.Provider value={C}>
      <div className={isChatTab ? "chat-mode" : ""} style={{ ...getPageBackground(themeMode, C), minHeight: "100vh", color: C.ink, fontFamily: SANS, transition: "background .2s ease, color .2s ease" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          html, body { margin:0; }
          button { -webkit-tap-highlight-color: transparent; transition: transform .1s ease; }
          button:active:not(:disabled) { transform: scale(0.96); }
          .no-press, .no-press:active { transform: none !important; }
          input::placeholder, textarea::placeholder { color: ${C.inputPlaceholder}; }
          input, textarea { font-family: ${SANS}; }
          input:focus, textarea:focus { border-color: ${C.clay} !important; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }
          .recharts-wrapper, .recharts-wrapper svg, .recharts-surface { overflow: visible !important; }
          .app-shell { display: flex; min-height: 100vh; }
          .sidebar {
            width: 232px; flex-shrink: 0; padding: 26px 18px;
            border-right: 1px solid ${C.line}; display: flex; flex-direction: column;
            }
          .main-area { flex: 1; min-width: 0; padding: 34px 40px 60px; max-width: 900px; }
          .bottom-nav { display: none; }
          .mobile-topbar { display: none; }
          .app-footer-mobile { display: none; }
          .nav-item {
            display:flex; align-items:center; gap:11px; padding:11px 14px; border-radius:12px;
            font-size:14.5px; font-weight:600; cursor:pointer; border:none; background:transparent;
            color: ${C.inkSoft}; width:100%; text-align:left; margin-bottom:4px; transition: all .12s ease;
          }
          .nav-item.active { background: ${C.clayWash}; color: ${C.clayOnWhite}; }
          .nav-item:hover:not(.active) { background: ${C.paperSoft}; }

          /* --- AI Chat tab: page itself never scrolls, only the chat's message list does --- */
          .chat-mode { height: 100dvh; overflow: hidden; }
          .chat-mode .app-shell { height: 100%; }
          .chat-mode .sidebar { overflow-y: auto; }
          .chat-mode .main-area {
            display: flex; flex-direction: column; overflow: hidden;
            height: 100%;
          }

          @media (max-width: 820px) {
            .sidebar { display: none; }
            .main-area { padding: 74px 16px 100px; max-width: 100%; }
                        .bottom-nav {
              display: flex; position: fixed; bottom: 0; left: 0; right: 0;
              background: ${C.bg}; border-top: 1px solid ${C.line};
justify-content: space-around; padding: 10px 0 14px; z-index: 20;
            }
            .mobile-topbar {
              display: flex; position: fixed; top: 0; left: 0; right: 0; z-index: 20;
              justify-content: space-between; align-items: center;
              background: ${C.bg}; padding: 14px 16px; border-bottom: 1px solid ${C.line};
            }
            .app-footer-mobile {
              display: block; text-align: center; font-size: 11px; color: ${C.faint};
              opacity: 0.7; margin-top: 32px; padding-bottom: 8px;
            }
            .chat-mode .main-area { padding: 74px 16px 96px; }
          }
        `}</style>
        <div className="app-shell">
          {/* Sidebar (desktop) */}
          <div className="sidebar">
            <div style={{ padding: "6px 10px 26px" }}>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 21, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>
                Apocalypse Archives
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: C.muted, marginTop: 4 }}>
                {trades.length} trade{trades.length === 1 ? "" : "s"} logged
              </div>
            </div>
            {NAV.map((n) => (
              <button key={n.key} className={`nav-item ${tab === n.key ? "active" : ""}`} onClick={() => setTab(n.key)}>
                <n.icon size={17} strokeWidth={2.1} />
                {n.label}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ padding: "0 2px", marginBottom: 10, display: "flex", gap: 8 }}>
              <ThemeToggle mode={themeMode} onToggle={toggleTheme} />
              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 999,
                  padding: "9px 12px", cursor: "pointer", color: C.inkSoft,
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.faint, padding: "0 10px", lineHeight: 1.5 }}>
              Signed in as {user.email}. Synced across your devices.
            </div>
            
          </div>

          {/* Mobile top bar */}
          <div className="mobile-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 1, fontSize: 17, flexWrap: "nowrap" }}>
              <svg viewBox="0 0 494 497" style={{ color: C.ink, flexShrink: 0, width: "1.05em", height: "1.05em" }}>
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
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "1em", textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink, whiteSpace: "nowrap" }}>
                Apocalypse Archives
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <ThemeToggle mode={themeMode} onToggle={toggleTheme} compact />
              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 999,
                  padding: 8, cursor: "pointer", color: C.inkSoft,
                }}
              >
                <LogOut size={15} />
              </button>
                          </div>
          </div>

          {/* Main content */}
          <div className="main-area">
            {!loaded ? (
              <div style={{ color: C.faint, fontSize: 14 }}>Loading…</div>
            ) : isChatTab ? (
              <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                <JournalChat user={user} trades={trades} theme={C} />
              </div>
            ) : tab === "log" ? (
              <LogTradeForm form={form} updateForm={updateForm} toggleEmotion={toggleEmotion} handleSave={handleSave} canSave={canSave} />
            ) : tab === "journal" ? (
              <JournalList trades={trades} onDelete={handleDelete} onGoLog={() => setTab("log")} />
            ) : (
              <Dashboard trades={trades} />
            )}
            
          </div>
        </div>

        {/* Bottom nav (mobile) */}
        <div className="bottom-nav" style={{ position: "fixed", alignItems: "center" }}>
          {NAV.map((n) => (
            <button
              key={n.key}
              ref={(el) => { navRefs.current[n.key] = el; }}
              onClick={() => setTab(n.key)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "6px 6px 4px",
                color: tab === n.key ? C.ink : C.muted,
                transition: "color .15s ease",
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{n.label}</span>
            </button>
          ))}
          <div style={{
            position: "absolute", top: 0, height: 3, borderRadius: 999,
            background: C.ink,
            left: navIndicator.left, width: navIndicator.width,
            transition: "left .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

// ---- Log Trade ----
function DateField({ value, onChange }) {
  const C = useTheme();
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
  const pad = (n) => String(n).padStart(2, "0");
  const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysCount }, (_, i) => i + 1)];

  function selectDay(d) {
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
    setOpen(false);
  }
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="no-press"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", boxSizing: "border-box", background: C.inputBg, border: `1px solid ${C.inputBorder}`,
          borderRadius: 12, padding: "12px 14px", color: C.inputText, fontFamily: SANS, fontSize: 15,
          textAlign: "left", cursor: "pointer",
        }}
      >
        {value ? fmtDateDisplay(value) : "Select date"}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 29 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30, width: 272,
            background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14,
            boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <button type="button" onClick={prevMonth} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4, display: "flex" }}>
                <ChevronLeft size={16} />
              </button>
              <div style={{ fontWeight: 700, fontSize: 13.5, fontFamily: SANS }}>{MONTHS[viewMonth]} {viewYear}</div>
              <button type="button" onClick={nextMonth} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4, display: "flex" }}>
                <ChevronRight size={16} />
                </button>
            </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
                          {WEEKDAYS.map((w, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 11, color: C.muted, fontWeight: 600, padding: "3px 0" }}>{w}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
                const isSelected = iso === value;
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => selectDay(d)}
                    style={{
                      aspectRatio: "1", border: "none", borderRadius: 8, cursor: "pointer",
                      background: isSelected ? C.clay : "transparent",
                      color: isSelected ? C.paper : C.ink,
                      fontSize: 13, fontFamily: SANS,
                    }}
                  >{d}</button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LogTradeForm({ form, updateForm, toggleEmotion, handleSave, canSave }) {
  const C = useTheme();
  const inputStyle = useInputStyle();
  return (
    <div style={{ background: C.paper, borderRadius: 20, padding: 26, maxWidth: 560 }}>
      <Field label="Date">
        <DateField value={form.date} onChange={(d) => updateForm("date", d)} />
      </Field>
      <Field label="Symbol">
        <input type="text" placeholder="EURUSD, XAUUSD, ..." value={form.symbol} onChange={(e) => updateForm("symbol", e.target.value.toUpperCase())} style={{ ...inputStyle, textTransform: "uppercase" }} />
      </Field>
      <Field label="Direction">
        <div style={{ display: "flex", gap: 10 }}>
          {["Long", "Short"].map((d) => {
            const active = form.direction === d;
            return (
              <button key={d} onClick={() => updateForm("direction", d)} style={{
                flex: 1, padding: "12px 0", borderRadius: 12,
                border: `1px solid ${C.btnAccentBorder}`,
                background: active ? C.btnAccent : C.btnAccentWash,
                color: active ? C.btnAccentTextActive : C.btnAccentText, fontWeight: 700, fontSize: 15, cursor: "pointer",
              }}>{d}</button>
            );
          })}
        </div>
      </Field>
      <Field label="Reason / Setup">
        <input type="text" placeholder="Breakout retest, reversal, ..." value={form.reason} onChange={(e) => updateForm("reason", e.target.value)} style={inputStyle} />
      </Field>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <Field label="Risk %">
            <input type="number" inputMode="decimal" placeholder="1" value={form.riskPct} onChange={(e) => updateForm("riskPct", e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="R Planned">
            <input type="number" inputMode="decimal" placeholder="2" value={form.rPlanned} onChange={(e) => updateForm("rPlanned", e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </div>
      <Field label="R Actual">
        <input type="number" inputMode="decimal" placeholder="2.3 or -1" value={form.rActual} onChange={(e) => updateForm("rActual", e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Rules Compliance">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["Yes", "Partial", "No"].map((r) => (
            <Chip key={r} label={r} active={form.rules === r} onClick={() => updateForm("rules", r)}
              activeColor={r === "Yes" ? C.sageOnWhite : r === "No" ? C.rustOnWhite : C.amberOnWhite}
              activeBg={r === "Yes" ? C.sageWash : r === "No" ? C.rustWash : C.amberWash} />
          ))}
        </div>
      </Field>
      <Field label="Emotions">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {EMOTIONS.map((e) => (
            <Chip key={e} label={e} active={form.emotion === e} onClick={() => toggleEmotion(e)} />
          ))}
        </div>
      </Field>
      <Field label="Notes">
        <textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
      </Field>
      <button onClick={handleSave} disabled={!canSave} style={{
        width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
        background: canSave ? C.ink : C.lineSoft, color: canSave ? C.paper : C.faint,
        fontWeight: 700, fontSize: 15.5, cursor: canSave ? "pointer" : "not-allowed",
      }}>Save Trade</button>
          </div>
  );
}

// ---- Journal ----
function JournalList({ trades, onDelete, onGoLog }) {
  const C = useTheme();
  const [confirmId, setConfirmId] = useState(null);
  const confirmTrade = trades.find((t) => t.id === confirmId) || null;

  if (trades.length === 0) {
    return (
      <div style={{ marginTop: 30, textAlign: "center", color: C.muted }}>
        <div style={{ fontSize: 15, marginBottom: 14 }}>No trades logged yet.</div>
        <button onClick={onGoLog} style={{
          display: "inline-flex", alignItems: "center", gap: 8, background: C.clayWash,
          border: `1px solid ${C.clay}`, color: C.clayOnWhite, borderRadius: 999, padding: "10px 18px",
          fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}><Plus size={16} /> Log your first trade</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
      {trades.map((t) => {
        const win = t.rActual > 0;
        return (
          <div key={t.id} style={{
            background: C.paper, border: `1px solid ${C.line}`,
            borderRadius: 16, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
    <div style={{ fontWeight: 700, fontSize: 17 }}>{t.symbol}</div>
    <div style={{ fontFamily: SANS, fontSize: 13, color: C.faint }}>{t.date}</div>
  </div>
  <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: win ? C.ink : C.faint }}>
    {fmtR(t.rActual)}
  </div>
</div>
{t.reason && <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 10 }}>{t.reason}</div>}
<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
  {t.direction && <Tag text={`Direction: ${t.direction}`} />}
  {t.rules && <Tag text={`Rules: ${t.rules}`} />}
  {(t.emotions || []).map((e) => <Tag key={e} text={`Emotion: ${e}`} />)}
</div>
            {t.notes && <div style={{ fontSize: 13, color: C.muted, marginTop: 10, fontStyle: "italic" }}>{t.notes}</div>}
            <button onClick={() => setConfirmId(t.id)} style={{
              marginTop: 14, background: "transparent", border: "none", color: C.faint, fontSize: 13,
  display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0,
            }}><Trash2 size={13} /> Delete</button>
          </div>
        );
      })}
      {confirmTrade && (
        <>
          <div onClick={() => setConfirmId(null)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 39,
          }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            zIndex: 40, width: "min(340px, calc(100vw - 48px))",
            background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, padding: 22,
            boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
          }}>
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, marginBottom: 8, letterSpacing: "-0.01em", color: C.ink }}>Delete this trade?</div>
            <div style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.5, marginBottom: 20 }}>
              {confirmTrade.symbol} &middot; {confirmTrade.date} &middot; {fmtR(confirmTrade.rActual)} will be permanently removed.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmId(null)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${C.line}`,
                  background: C.paperSoft, color: C.ink, fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                }}
              >No</button>
              <button
                onClick={() => { onDelete(confirmTrade.id); setConfirmId(null); }}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                  background: C.dangerBg, color: "#FFFFFF", fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                }}
              >Yes, Delete</button>
            </div>
          </div>
        </>
      )}
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
    <text x={nx} y={ny} textAnchor={textAnchor} fontFamily={SANS} fontSize={11} fontWeight={700} fill={C.inkSoft}>
      {words.map((w, i) => (
        <tspan key={i} x={nx} dy={i === 0 ? (words.length > 1 ? -5 : 3.5) : 12}>{w}</tspan>
      ))}
    </text>
  );
}
function StatCard({ label, value, color }) {
  const C = useTheme();
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: C.ink }}>{value}</div>
    </div>
  );
}
function Dashboard({ trades }) {
  const C = useTheme();
  const [period, setPeriod] = useState("all");
  const filteredTrades = useMemo(() => {
    if (period === "all") return trades;
    const now = new Date();
    let start;
    if (period === "week") start = startOfWeek(now);
    else if (period === "month") start = startOfMonth(now);
    else start = startOfYear(now);
    return trades.filter((t) => parseISO(t.date) >= start);
  }, [trades, period]);
  const stats = useMemo(() => computeStats(filteredTrades), [filteredTrades]);

  if (trades.length === 0) {
    return <div style={{ marginTop: 30, color: C.muted, fontSize: 15 }}>Log a trade to see your performance dashboard.</div>;
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {PERIODS.map((p) => (
          <Chip key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
        ))}
      </div>
      {filteredTrades.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 15, marginBottom: 26 }}>No trades logged in this period.</div>
      ) : (
        <>
          <SectionLabel text={`Summary \u00b7 ${filteredTrades.length} trade${filteredTrades.length === 1 ? "" : "s"}`} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            <StatCard label="Total Trades" value={stats.total} />
            <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={C.clayDeep} />
            <StatCard label="Total R" value={fmtR(stats.totalR)} color={stats.totalR >= 0 ? C.sage : C.rustRed} />
            <StatCard label="Expectancy" value={stats.expectancy.toFixed(2)} color={C.clayDeep} />
            <StatCard label="Avg Win" value={`+${stats.avgWin.toFixed(2)}`} color={C.sage} />
            <StatCard label="Avg Loss" value={stats.avgLoss.toFixed(2)} color={C.rustRed} />
          </div>
          <div style={{ marginBottom: 16, marginTop: -6 }}>
  <div style={{ padding: "0 4px" }}>
    <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em", color: C.ink }}>Trader Scorecard</div>
    <div style={{ fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 0 }}>Score 0–100 per dimension</div>
  </div>
  <div style={{ width: "100%", height: 280, overflow: "visible" }}>
    <ResponsiveContainer>
      <RadarChart data={stats.scorecard} outerRadius="72%" margin={{ top: 4, right: 32, bottom: 4, left: 46 }}>
                  <PolarGrid stroke={C.line} />
                  <PolarAngleAxis dataKey="metric" tick={<ScorecardTick />} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke={C.ink} fill={C.ink} fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: C.ink, fillOpacity: 1, stroke: "none" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <SectionLabel text="By Rules Compliance" />
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: "2px 16px" }}>
  {["Yes", "Partial", "No"].map((r, i) => {
    const d = stats.byRules[r];
    const avg = d.count ? d.total / d.count : 0;
    return (
      <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: i > 0 ? `1px solid ${C.lineSoft}` : "none" }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, minWidth: 60 }}>{r}</div>
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, textAlign: "right" }}>
          {d.count} trade &middot; total {fmtR(d.total)} &middot; avg {avg.toFixed(2)}R
        </div>
      </div>
    );
  })}
          </div>
        </>
      )}
    </div>
  );
                }
