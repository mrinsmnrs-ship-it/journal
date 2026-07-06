import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import {
  Trash2, Plus, PencilLine, BookOpen, LayoutDashboard,
  Sun, Moon, ChevronLeft, ChevronRight, LogOut, Sparkles,
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
    { key: "chat", label: "AI Chat", icon: Sparkles },
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
            .chat-mode .main-area { padding: 74px 16px 16px; }
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
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 17, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>
              Apocalypse Archives
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
            <div style={{ marginBottom: isChatTab ? 14 : 26, flexShrink: 0 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 26, letterSpacing: "-0.01em", color: C.ink }}>
                {NAV.find((n) => n.key === tab)?.label}
              </div>
            </div>
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
            {!isChatTab && (
              <div className="app-footer-mobile">
                &copy; {new Date().getFullYear()} Apocalypse Archives. All rights reserved.
              </div>
            )}
          </div>
        </div>

        {/* Bottom nav (mobile) */}
        <div className="bottom-nav">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setTab(n.key)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              color: tab === n.key ? C.ink : C.muted,
            }}>
              <n.icon size={19} strokeWidth={2.2} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>{n.label}</span>
            </button>
          ))}
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
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 20, padding: 26, maxWidth: 560 }}>
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
                border: `1px solid ${active ? C.clay : C.line}`,
                background: active ? C.clayWash : C.paperSoft,
                color: active ? C.clayOnWhite : C.inkSoft, fontWeight: 700, fontSize: 15, cursor: "pointer",
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
            <Chip key={e} label={e} active={form.emotions.includes(e)} onClick={() => toggleEmotion(e)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
          ))}
        </div>
      </Field>
      <Field label="Notes">
        <textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
      </Field>
      <button onClick={handleSave} disabled={!canSave} style={{
        width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
        background: canSave ? C.clay : C.lineSoft, color: canSave ? C.paper : C.faint,
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
        const win = t.rActual > 0, flat = t.rActual === 0;
        const borderColor = flat ? C.faint : win ? C.sage : C.rustRed;
        return (
          <div key={t.id} style={{
            background: C.paper, border: `1px solid ${C.line}`, borderLeft: `4px solid ${borderColor}`,
            borderRadius: 16, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{t.symbol}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.muted, marginTop: 2 }}>{t.date}</div>
              </div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 19, color: flat ? C.muted : win ? C.sage : C.rustRed }}>
                {fmtR(t.rActual)}
              </div>
            </div>
            {t.reason && <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 10 }}>{t.reason}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {t.direction && <Tag text={t.direction} color={C.clayOnWhite} bg={C.clayWash} />}
              {t.rules && <Tag text={t.rules} color={t.rules === "Yes" ? C.sageOnWhite : t.rules === "No" ? C.rustOnWhite : C.amberOnWhite}
                bg={t.rules === "Yes" ? C.sageWash : t.rules === "No" ? C.rustWash : C.amberWash} />}
              {(t.emotions || []).map((e) => <Tag key={e} text={e} color={C.inkSoft} bg={C.paperSoft} />)}
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
    <text x={nx} y={ny} textAnchor={textAnchor} fontFamily={SANS} fontSize={11} fill={C.inkSoft}>
      {words.map((w, i) => (
        <tspan key={i} x={nx} dy={i === 0 ? (words.length > 1 ? -5 : 3.5) : 12}>{w}</tspan>
      ))}
    </text>
  );
}
function StatCard({ label, value, color }) {
  const C = useTheme();
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 23, fontWeight: 700, color: color || C.ink }}>{value}</div>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 26 }}>
            <StatCard label="Total Trades" value={stats.total} />
            <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={C.clayDeep} />
            <StatCard label="Total R" value={fmtR(stats.totalR)} color={stats.totalR >= 0 ? C.sage : C.rustRed} />
            <StatCard label="Expectancy" value={stats.expectancy.toFixed(2)} color={C.clayDeep} />
            <StatCard label="Avg Win" value={`+${stats.avgWin.toFixed(2)}`} color={C.sage} />
            <StatCard label="Avg Loss" value={stats.avgLoss.toFixed(2)} color={C.rustRed} />
          </div>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, padding: "22px 10px 6px", marginBottom: 26 }}>
            <div style={{ padding: "0 16px" }}>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em", color: C.ink }}>Trader Scorecard</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 4 }}>Score 0–100 per dimension</div>
            </div>
            <div style={{ width: "100%", height: 300, overflow: "visible" }}>
              <ResponsiveContainer>
                <RadarChart data={stats.scorecard} outerRadius="52%" margin={{ top: 18, right: 42, bottom: 12, left: 58 }}>
                  <PolarGrid stroke={C.line} />
                  <PolarAngleAxis dataKey="metric" tick={<ScorecardTick />} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke={C.clay} fill={C.clay} fillOpacity={0.22} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <SectionLabel text="By Rules Compliance" />
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, padding: "6px 20px" }}>
            {["Yes", "Partial", "No"].map((r, i) => {
              const d = stats.byRules[r];
              const avg = d.count ? d.total / d.count : 0;
              const color = r === "Yes" ? C.sage : r === "No" ? C.rustRed : C.amber;
              return (
                <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: i > 0 ? `1px solid ${C.lineSoft}` : "none" }}>
                  <div style={{ fontWeight: 700, color, minWidth: 70 }}>{r}</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: C.muted, textAlign: "right" }}>
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
