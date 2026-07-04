import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import {
  Trash2, Plus, PencilLine, BookOpen, LayoutDashboard,
  Sun, Moon, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from "recharts";

// ---- Design tokens : monochrome, Claude-matched palettes ----
// Accent is pure black/white (no orange). Green/red/amber are kept ONLY as
// functional data signals (win/loss, rules compliance) — not decorative accents.
const LIGHT = {
  bg: "#FAFAF8", paper: "#FFFFFF", paperSoft: "#F3F3F1",
  ink: "#171717", inkSoft: "#3F3F3D", muted: "#767470", faint: "#AFAEA9",
  line: "#E3E2DD", lineSoft: "#EDECE8",
  clay: "#171717", clayDeep: "#000000", clayWash: "#ECECE9",
  sage: "#5C8060", sageWash: "#E4EBE2",
  rustRed: "#B85C50", rustWash: "#F1E2DE",
  amber: "#B08A3E", amberWash: "#F1E7D4",
};

const DARK = {
  bg: "#1B1B1A", paper: "#252524", paperSoft: "#2E2E2C",
  ink: "#F2F1EC", inkSoft: "#CFCEC8", muted: "#94928C", faint: "#5E5D58",
  line: "#3D3C39", lineSoft: "#333230",
  clay: "#F2F1EC", clayDeep: "#FFFFFF", clayWash: "#38372F",
  sage: "#8CAE8E", sageWash: "#33402F",
  rustRed: "#D28A7E", rustWash: "#453029",
  amber: "#D4AE6E", amberWash: "#443A24",
};

const SERIF = "'Source Serif 4', 'Georgia', serif";
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
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfYear(d) {
  return new Date(d.getFullYear(), 0, 1);
}
const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

// ---- Storage ----
const TRADES_KEY = "rjournal:trades";
const THEME_KEY = "rjournal:theme";

async function loadKey(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("storage save failed", e);
  }
}

// ---- Small atoms ----

function Chip({ label, active, onClick, activeColor, activeBg }) {
  const C = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: SANS, fontSize: 13, fontWeight: 600,
        padding: "8px 15px", borderRadius: 999,
        border: `1px solid ${active ? activeColor : C.line}`,
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
    width: "100%", boxSizing: "border-box", background: C.paperSoft,
    border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px",
    color: C.ink, fontFamily: SANS, fontSize: 15, outline: "none",
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

function ThemeToggle({ mode, onToggle, compact }) {
  const C = useTheme();
  return (
    <button
      onClick={onToggle}
      title={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 999,
        padding: compact ? "8px" : "9px 14px", cursor: "pointer", color: C.inkSoft,
        fontFamily: SANS, fontSize: 13, fontWeight: 600,
      }}
    >
      {mode === "dark" ? <Moon size={15} style={{ color: C.ink }} /> : <Sun size={15} style={{ color: C.ink }} />}
      {!compact && (mode === "dark" ? "Dark" : "Light")}
    </button>
  );
}

// ---- Stats ----

function computeStats(trades) {
  const total = trades.length;
  if (total === 0) {
    return {
      total: 0, winRate: 0, totalR: 0, expectancy: 0, avgWin: 0, avgLoss: 0,
      scorecard: ["Win Rate", "Discipline", "Emotional Control", "Risk Consistency", "Profitability"].map((m) => ({ metric: m, value: 0 })),
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
      { metric: "Win Rate", value: Math.round(winRate) },
      { metric: "Discipline", value: Math.round(disciplineScore) },
      { metric: "Emotional Control", value: Math.round(emotionalScore) },
      { metric: "Risk Consistency", value: Math.round(riskConsistency) },
      { metric: "Profitability", value: Math.round(profitability) },
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
      setThemeMode(th === "dark" ? "dark" : "light");
      setLoaded(true);
    })();
  }, []);

  async function toggleTheme() {
    const next = themeMode === "dark" ? "light" : "dark";
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

  const C = themeMode === "dark" ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={C}>
      <div style={{ background: C.bg, minHeight: "100vh", color: C.ink, fontFamily: SANS, transition: "background .2s ease, color .2s ease" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,500;8..60,700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          html, body { margin:0; }
          input::placeholder, textarea::placeholder { color: ${C.faint}; }
          input, textarea { font-family: ${SANS}; }
          input:focus, textarea:focus { border-color: ${C.clay} !important; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }

          .app-shell { display: flex; min-height: 100vh; }
          .sidebar {
            width: 232px; flex-shrink: 0; padding: 26px 18px;
            border-right: 1px solid ${C.line}; display: flex; flex-direction: column;
          }
          .main-area { flex: 1; min-width: 0; padding: 34px 40px 60px; max-width: 900px; }
          .bottom-nav { display: none; }
          .mobile-topbar { display: none; }
          .nav-item {
            display:flex; align-items:center; gap:11px; padding:11px 14px; border-radius:12px;
            font-size:14.5px; font-weight:600; cursor:pointer; border:none; background:transparent;
            color: ${C.inkSoft}; width:100%; text-align:left; margin-bottom:4px; transition: all .12s ease;
          }
          .nav-item.active { background: ${C.clayWash}; color: ${C.clayDeep}; }
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
          }
        `}</style>

        <div className="app-shell">
          {/* Sidebar (desktop) */}
          <div className="sidebar">
            <div style={{ padding: "6px 10px 26px" }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22 }}>
                R Journal
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
          </div>

          {/* Mobile top bar */}
          <div className="mobile-topbar">
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19 }}>
              R Journal
            </div>
            <ThemeToggle mode={themeMode} onToggle={toggleTheme} compact />
          </div>

          {/* Main content */}
          <div className="main-area">
            <div style={{ marginBottom: 26 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 26 }}>
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
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", boxSizing: "border-box", background: C.paperSoft, border: `1px solid ${C.line}`,
          borderRadius: 12, padding: "12px 14px", color: C.ink, fontFamily: SANS, fontSize: 15,
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
                  <but
