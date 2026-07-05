import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import {
  Trash2, Plus, PencilLine, BookOpen, LayoutDashboard,
  Sun, Moon, Zap, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from "recharts";

// ---- Design tokens : monochrome, Claude-matched palettes ----
const LIGHT = {
  bg: "#FAFAF8", paper: "#FFFFFF", paperSoft: "#F3F3F1",
  ink: "#171717", inkSoft: "#3F3F3D", muted: "#767470", faint: "#AFAEA9",
  line: "#E3E2DD", lineSoft: "#EDECE8",
  clay: "#171717", clayDeep: "#000000", clayWash: "#ECECE9", clayOnWhite: "#000000",
  sage: "#5C8060", sageWash: "#E4EBE2", sageOnWhite: "#5C8060",
  rustRed: "#B85C50", rustWash: "#F1E2DE", rustOnWhite: "#B85C50", dangerBg: "#B85C50",
  amber: "#B08A3E", amberWash: "#F1E7D4", amberOnWhite: "#B08A3E",
  inputBg: "#F3F3F1", inputText: "#171717", inputPlaceholder: "#AFAEA9", inputBorder: "#E3E2DD",
};
const DARK = {
  bg: "#1B1B1A", paper: "#252524", paperSoft: "#2E2E2C",
  ink: "#F2F1EC", inkSoft: "#CFCEC8", muted: "#94928C", faint: "#5E5D58",
  line: "#3D3C39", lineSoft: "#333230",
  clay: "#F2F1EC", clayDeep: "#FFFFFF", clayWash: "#38372F", clayOnWhite: "#FFFFFF",
  sage: "#8CAE8E", sageWash: "#33402F", sageOnWhite: "#8CAE8E",
  rustRed: "#D28A7E", rustWash: "#453029", rustOnWhite: "#D28A7E", dangerBg: "#D28A7E",
  amber: "#D4AE6E", amberWash: "#443A24", amberOnWhite: "#D4AE6E",
  inputBg: "#2E2E2C", inputText: "#F2F1EC", inputPlaceholder: "#5E5D58", inputBorder: "#3D3C39",
};
const BLUE = {
  bg: "#2340FF", paper: "#2340FF", paperSoft: "#2A48FF",
  ink: "#FFFFFF", inkSoft: "#FFFFFF", muted: "#FFFFFF", faint: "#B9C4FF",
  line: "#FFFFFF", lineSoft: "#8DA0FF",
  clay: "#FFFFFF", clayDeep: "#CFE0FF", clayWash: "#FFFFFF", clayOnWhite: "#182463",
  sage: "#FFFFFF", sageWash: "#FFFFFF", sageOnWhite: "#182463",
  rustRed: "#7A93FF", rustWash: "#FFFFFF", rustOnWhite: "#182463", dangerBg: "#182463",
  amber: "#B9CCFF", amberWash: "#FFFFFF", amberOnWhite: "#182463",
  inputBg: "#FFFFFF", inputText: "#182463", inputPlaceholder: "#8A93C2", inputBorder: "#C7CEEA",
  chipBorderAccent: false,
};


const SERIF = "'Playfair Display', 'Georgia', serif";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace";

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

// ---- Storage (in-memory only for this preview — GitHub version keeps localStorage) ----
const memoryStore = {};
async function loadKey(key, fallback) {
  return key in memoryStore ? memoryStore[key] : fallback;
}
async function saveKey(key, value) {
  memoryStore[key] = value;
}
const TRADES_KEY = "rjournal:trades";
const THEME_KEY = "rjournal:theme";

// ---- Small atoms ----
function Chip({ label, active, onClick, activeColor, activeBg }) {
  const C = useTheme();
  const borderColor = active ? (C.chipBorderAccent === false ? C.line : activeColor) : C.line;
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
const THEME_ORDER = ["light", "dark", "blue"];
const THEME_META = {
  light: { label: "Light", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
  blue: { label: "Blue", Icon: Zap },
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

// ---- App ----
export default function RJournal() {
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
      const [t, th] = await Promise.all([
        loadKey(TRADES_KEY, []), loadKey(THEME_KEY, "light"),
      ]);
      setTrades(t);
      setThemeMode(THEME_ORDER.includes(th) ? th : "light");
      setLoaded(true);
    })();
  }, []);

  async function toggleTheme() {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(themeMode) + 1) % THEME_ORDER.length];
    setThemeMode(next);
    await saveKey(THEME_KEY, next);
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
    await saveKey(TRADES_KEY, next);
    setForm({ date: todayISO(), symbol: "", direction: "", reason: "", riskPct: "", rPlanned: "", rActual: "", rules: "", emotions: [], notes: "" });
    setTab("journal");
  }
  async function handleDelete(id) {
    const next = trades.filter((t) => t.id !== id);
    setTrades(next);
    await saveKey(TRADES_KEY, next);
  }

  const stats = useMemo(() => computeStats(trades), [trades]);

  const NAV = [
    { key: "log", label: "Log Trade", icon: PencilLine },
    { key: "journal", label: "Journal", icon: BookOpen },
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  const C = themeMode === "dark" ? DARK : themeMode === "blue" ? BLUE : LIGHT;

  return (
    <ThemeContext.Provider value={C}>
      <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: SANS, transition: "background .2s ease, color .2s ease" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:opsz,wght@5..1200,500;5..1200,600;5..1200,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
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
          }
        `}</style>
        <div className="app-shell">
          {/* Sidebar (desktop) */}
          <div className="sidebar">
            <div style={{ padding: "6px 10px 26px" }}>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 21, textTransform: "uppercase", letterSpacing: "0.045em" }}>
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
            <div style={{ padding: "0 2px", marginBottom: 12 }}>
              <ThemeToggle mode={themeMode} onToggle={toggleTheme} />
            </div>
            <div style={{ fontSize: 12, color: C.faint, padding: "0 10px", lineHeight: 1.5 }}>
              All data is stored locally in this browser.
            </div>
            <div style={{ fontSize: 11, color: C.faint, padding: "10px 10px 0", opacity: 0.7 }}>
              &copy; {new Date().getFullYear()} Apocalypse Archives. All rights reserved.
            </div>
          </div>

          {/* Mobile top bar */}
          <div className="mobile-topbar">
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 17, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Apocalypse Archives
            </div>
            <ThemeToggle mode={themeMode} onToggle={toggleTheme} compact />
          </div>

          {/* Main content */}
          <div className="main-area">
            <div style={{ marginBottom: 26 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 26 }}>
                {NAV.find((n) => n.key === tab)?.label}
              </div>
            </div>
            {!loaded ? (
              <div style={{ color: C.faint, fontSize: 14 }}>Loading…</div>
            ) : tab === "log" ? (
              <LogTradeForm form={form} updateForm={updateForm} toggleEmotion={toggleEmotion} handleSave={handleSave} canSave={canSave} />
            ) : tab === "journal" ? (
              <JournalList trades={trades} onDelete={handleDelete} onGoLog={() => setTab("log")} />
            ) : (
              <Dashboard trades={trades} />
            )}
            <div className="app-footer-mobile">
              &copy; {new Date().getFullYear()} Apocalypse Archives. All rights reserved.
            </div>
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
    <div style={
