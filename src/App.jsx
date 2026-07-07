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
};
const DARK = {
  bg: "#141413", paper: "#1F1E1B", paperSoft: "#262521",
  ink: "#FAF9F5", inkSoft: "#D8D6CF", muted: "#9C9A93", faint: "#65635C",
  line: "#3A3935", lineSoft: "#2E2D29",
  clay: "#D97757", clayDeep: "#E8926F", clayWash: "#3A2A21", clayOnWhite: "#E8926F",
  sage: "#788C5D", sageWash: "#232A1D", sageOnWhite: "#9CB27E",
  rustRed: "#D28A7E", rustWash: "#3B2822", rustOnWhite: "#D28A7E", dangerBg: "#D28A7E",
  amber: "#6A9BCC", amberWash: "#1E2A35", amberOnWhite: "#8FB8DE",
  inputBg: "#262521", inputText: "#FAF9F5", inputPlaceholder: "#65635C", inputBorder: "#3A3935",
};

const SERIF = "'Poppins', 'Arial', sans-serif";
const SANS = "'Lora', 'Georgia', serif";
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
function Chip({ label, active, onClick, activeColor, activeBg }) {
  const C = useTheme();
  const borderColor = active ? activeColor : C.line;
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: SANS, fontSize: 13, fontWeight: 600,
        padding: "8px 15px", borderRadius: 999,
        border: `1px solid ${borderColor}`,
        background: active ? activeBg : C.paper,
        color: active ? activeColor : C.inkSoft,
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
function Tag({ text, color, bg }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color, background: bg, borderRadius: 999, padding: "4px 11px" }}>
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
  const withEmotions = trades.filter((t) => (t.emotions || []).length > 0);
  const emotionalScore = withEmotions.length
    ? withEmotions.reduce((s, t) => {
        const hasPos = t.emotions.some((e) => POSITIVE_EMOTIONS.has(e));
        const hasNeg = t.emotions.some((e) => NEGATIVE_EMOTIONS.has(e));
        if (hasPos && !hasNeg) return s + 100;
        if (hasNeg && !hasPos) return s + 0;
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
  const [blinkFrame, setBlinkFrame] = useState("open"); // "open" | "open2" | "half" | "closed" — untuk ikon mata di header
  const [trades, setTrades] = useState([]);
  const [themeMode, setThemeMode] = useState("light");
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(), symbol: "", direction: "", reason: "",
    riskPct: "", rPlanned: "", rActual: "", rules: "", emotions: [], notes: "",
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
    setForm((f) => ({ ...f, emotions: f.emotions.includes(e) ? f.emotions.filter((x) => x !== e) : [...f.emotions, e] }));
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
      emotions: form.emotions, notes: form.notes.trim(), createdAt: Date.now(),
    };
    const next = [trade, ...trades];
    setTrades(next);
    await saveUserData(user.uid, { trades: next });
    setForm({ date: todayISO(), symbol: "", direction: "", reason: "", riskPct: "", rPlanned: "", rActual: "", rules: "", emotions: [], notes: "" });
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
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Lora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
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
              background: ${C.paper}; border-top: 1px solid ${C.line};
              justify-content: space-around; padding: 10px 0 16px; z-index: 20;
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
            <div style={{ fontSize: 11, color: C.faint, padding: "10px 10px 0", opacity: 0.7 }}>
              &copy; {new Date().getFullYear()} Apocalypse Archives. All rights reserved.
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
                  155 -157 204 -195 377 -289 60 -33 112 -66 117 -74 10 -14
