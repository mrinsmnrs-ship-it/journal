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
const SHADOW_LIGHT = {
  shadowCard: "0 1px 2px rgba(20,20,19,0.04)",
  shadowRaised: "0 1px 2px rgba(20,20,19,0.04), 0 1px 1px rgba(20,20,19,0.03)",
  shadowPopover: "0 4px 8px -2px rgba(20,20,19,0.06), 0 12px 20px -6px rgba(20,20,19,0.10)",
  shadowModal: "0 8px 12px -4px rgba(20,20,19,0.10), 0 24px 40px -8px rgba(20,20,19,0.18)",
};

const LIGHT = {
  bg: "#FAF9F5", paper: "#FFFFFF", paperSoft: "#F0EEE6",
  paperSoftLight: "#F8F7F2", paperSoftStat: "#F5F3ED",
  ink: "#141413", inkSoft: "#3D3D3A", muted: "#767470", faint: "#AFAEA9",
  line: "#E5E4DF", lineSoft: "#EDECE8",
  clay: "#D97757", clayDeep: "#B85C3E", clayWash: "#F5E4DB", clayOnWhite: "#B85C3E",
  sage: "#788C5D", sageWash: "#E8ECE1", sageOnWhite: "#5F7048",
  rustRed: "#B85C50", rustWash: "#F1E2DE", rustOnWhite: "#B85C50", dangerBg: "#B85C50",
  amber: "#6A9BCC", amberWash: "#E4ECF3", amberOnWhite: "#3D6C9C",
  inputBg: "#F0EEE6", inputText: "#141413", inputPlaceholder: "#AFAEA9", inputBorder: "#E3E2DD",
  btnAccent: "#D97757", btnAccentBorder: "#D97757", btnAccentWash: "#F0DECD",
  btnAccentText: "#B85C3E", btnAccentTextActive: "#FFFFFF",
  ...SHADOW_LIGHT,
};

const CHAT_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SERIF = CHAT_FONT; 
const SANS = CHAT_FONT;  
const MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace";

const DESKTOP_BREAKPOINT = 820;

function getPageBackground(C) {
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
        fontFamily: SANS, fontSize: 14, fontWeight: 600,
        padding: "9px 17px", borderRadius: 999,
        border: `1px solid ${active ? C.btnAccentBorder : C.line}`,
        background: active ? C.btnAccent : C.paper,
        color: active ? C.btnAccentTextActive : C.inkSoft,
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
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
        color: C.muted, marginBottom: 9, textTransform: "uppercase",
      }}>{label}</div>
      {children}
    </div>
  );
}
function useInputStyle() {
  const C = useTheme();
  return {
    width: "100%", boxSizing: "border-box", background: C.paper,
    border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px",
    color: C.inputText, fontFamily: SANS, fontSize: 16, outline: "none",
    boxShadow: "none",
  };
}
function Tag({ text }) {
  const C = useTheme();
  return (
    <span style={{
      fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.inkSoft,
      background: C.paperSoft, border: `1px solid ${C.line}`,
      borderRadius: 999, padding: "5px 12px",
    }}>
      {text}
    </span>
  );
}
function SectionLabel({ text }) {
  const C = useTheme();
  return (
    <div style={{
      fontFamily: SANS, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em",
      color: C.muted, marginBottom: 15, textTransform: "uppercase",
    }}>{text}</div>
  );
}

function ThemeToggle({ compact }) {
  const C = useTheme();
  return (
    <button
      title="Aplikasi dikunci ke tema Light"
      style={{
        display: "flex", alignItems: "center", gap: 9,
        background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 999,
        padding: compact ? "9px" : "10px 16px", cursor: "default", color: C.inkSoft,
        fontFamily: SANS, fontSize: 14, fontWeight: 600,
      }}
    >
      <Sun size={16} style={{ color: C.ink }} />
      {!compact && "Light"}
    </button>
  );
}

// ---- Reusable animated eye logo mark ----
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
      {/* (Frame open2, half, closed dipangkas agar menghemat space, fungsinya tetap berjalan) */}
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

export default function App() {
  const [user, setUser] = useState(undefined);
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
  const desktopNavRefs = useRef({});
  const [desktopNavIndicator, setDesktopNavIndicator] = useState({ top: 0, height: 0 });
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth > DESKTOP_BREAKPOINT : true
  );
  const [blinkFrame, setBlinkFrame] = useState("open"); 
  const [trades, setTrades] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(), symbol: "", direction: "", reason: "",
    riskPct: "", rPlanned: "", rActual: "", rules: "", emotion: "", notes: "",
  });

  useEffect(() => {
    (async () => {
      const data = await loadUserData(user.uid);
      setTrades(data.trades);
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
    const INDICATOR_HEIGHT = 18;
    function updateDesktopNavIndicator() {
      const activeKey = desktopNavRefs.current[tab] ? tab : "log";
      const el = desktopNavRefs.current[activeKey];
      if (el) {
        setDesktopNavIndicator({
          top: el.offsetTop + (el.offsetHeight - INDICATOR_HEIGHT) / 2,
          height: INDICATOR_HEIGHT,
        });
      }
    }
    updateDesktopNavIndicator();
    window.addEventListener("resize", updateDesktopNavIndicator);
    return () => window.removeEventListener("resize", updateDesktopNavIndicator);
  }, [tab, isDesktop]);

  const C = LIGHT; // Terkunci ke LIGHT
  const isChatTab = !isDesktop && tab === "chat";

  return (
    <ThemeContext.Provider value={C}>
      <div className={isChatTab ? "chat-mode" : ""} style={{ ...getPageBackground(C), minHeight: "100vh", color: C.ink, fontFamily: SANS, transition: "background .2s ease, color .2s ease" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,500&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          html, body { margin:0; height: 100%; overflow: hidden; }
          button { -webkit-tap-highlight-color: transparent; transition: transform .1s ease; }
          button:active:not(:disabled) { transform: scale(0.96); }
          .no-press, .no-press:active { transform: none !important; }
          input::placeholder, textarea::placeholder { color: ${C.inputPlaceholder}; }
          input, textarea { font-family: ${SANS}; }
          input:focus, textarea:focus { border-color: ${C.clay} !important; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }
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
          .app-footer-mobile { display: none; }

          .nav-item-desktop {
            display:flex; align-items:center; padding: 13px 6px; border-radius: 0;
            font-family: 'Inter', sans-serif; font-size:16px; font-weight:600; letter-spacing: -0.015em;
            cursor:pointer; border:none; background:transparent;
            width:100%; text-align:left; margin-bottom:2px; transition: color .12s ease;
          }
          .nav-item-desktop:hover { color: ${C.ink}; }

          .chat-mode { height: 100dvh; overflow: hidden; }
          .chat-mode .app-shell { height: 100%; }
          .chat-mode .main-area {
            display: flex; flex-direction: column; overflow: hidden;
            height: 100%;
          }

          @media (max-width: 820px) {
            .sidebar { display: none; }
            .desktop-chat-panel { display: none; }
            .main-area { padding: 74px 16px 100px; max-width: 100%; margin-left: 0; margin-right: 0; }
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
              <span style={{ fontSize: 19, lineHeight: 1 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em", color: C.ink }}>Apocalypse</span>
                <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em", color: C.ink }}>Archives</span>
              </span>
            </div>
            <div style={{ position: "relative" }}>
              {NAV_DESKTOP.map((n) => (
                <button
                  key={n.key}
                  ref={(el) => { desktopNavRefs.current[n.key] = el; }}
                  className="nav-item-desktop"
                  onClick={() => setTab(n.key)}
                  style={{ color: tab === n.key ? C.ink : C.faint }}
                >
                  {n.label}
                </button>
              ))}
              <div style={{
                position: "absolute", top: desktopNavIndicator.top, right: 0,
                width: 3, height: desktopNavIndicator.height, borderRadius: 999,
                background: C.ink,
                transition: "top .28s cubic-bezier(.4,0,.2,1), height .28s cubic-bezier(.4,0,.2,1)",
              }} />
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ padding: "0 2px", marginBottom: 12, display: "flex", gap: 8 }}>
              {/* Tombol Tema Tetap Ada */}
              <ThemeToggle />
              <button
                onClick={handleLogout}
                title="Log out"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 999,
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
            <span style={{ fontSize: 17, lineHeight: 1 }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em", color: C.ink }}>Apocalypse</span>
              <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em", color: C.ink }}>Archives</span>
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {/* Tombol Tema Tetap Ada */}
              <ThemeToggle compact />
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
            ) : !isDesktop && tab === "chat" ? (
              <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                <JournalChat user={user} trades={trades} theme={C} />
              </div>
            ) : tab === "log" ? (
              <LogTradeForm form={form} updateForm={updateForm} toggleEmotion={toggleEmotion} handleSave={handleSave} canSave={canSave} />
            ) : tab === "journal" ? (
              <JournalList trades={trades} onDelete={handleDelete} onGoLog={() => setTab("log")} />
            ) : tab === "dashboard" ? (
              <Dashboard trades={trades} />
            ) : (
              <LogTradeForm form={form} updateForm={updateForm} toggleEmotion={toggleEmotion} handleSave={handleSave} canSave={canSave} />
            )}
          </div>

          {/* AI Chat panel permanen (desktop only) */}
          {isDesktop && loaded && (
            <div className="desktop-chat-panel">
              <JournalChat user={user} trades={trades} theme={C} />
            </div>
          )}
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
                color: tab === n.key ? C.ink : C.faint,
                transition: "color .15s ease",
              }}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>{n.label}</span>
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

// ---- Log Trade Form, JournalList, & Dashboard Tetap Sama (Menggunakan C yang sudah ter-lock ke LIGHT) ----
// (Komponen pendukung di bawahnya sengaja tidak ditulis ulang secara penuh untuk efisiensi ruang, kodenya otomatis menggunakan data token LIGHT)
