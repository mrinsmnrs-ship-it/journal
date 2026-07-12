import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import {
  Trash2, Plus, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, LogOut, X, Check,
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
import "./DateField.css";

// ---- Design tokens, util tanggal/format/stats, dan komponen atom kecil ----
// sekarang tinggal di file masing-masing (lihat src/theme, src/utils,
// src/components/common, src/components/trade) supaya file ini tidak lagi
// jadi satu file raksasa berisi semuanya.
import {
  SANS, SERIF, MONO, LABEL_FONT, DESKTOP_BREAKPOINT, NAV, PERIODS,
  ThemeContext, useTheme, getPageBackground, THEME_ORDER, LIGHT, DARK,
} from "./theme/tokens.js";
import { uid, fmtR, fileToCompressedDataURL } from "./utils/format.js";
import {
  todayISO, fmtDateDisplay, clamp, parseISO,
  startOfWeek, startOfMonth, startOfYear, tradeYears,
} from "./utils/date.js";
import {
  computeEquityCurve, computeDailyR, computeSymbolStats, computeStats,
} from "./utils/stats.js";
import PillToggle from "./components/common/PillToggle.jsx";
import Chip from "./components/common/Chip.jsx";
import Field from "./components/common/Field.jsx";
import useInputStyle from "./components/common/useInputStyle.js";
import Tag from "./components/common/Tag.jsx";
import SectionLabel from "./components/common/SectionLabel.jsx";
import ThemeToggle from "./components/common/ThemeToggle.jsx";
import RiskRPanel from "./components/trade/RiskRPanel.jsx";
// EyeLogo dipindah ke ./components/common/EyeLogo.jsx tapi TERNYATA tidak
// dipakai di mana pun dalam app (dead code) — tidak diimport lagi di sini.
// Silakan pakai lagi kalau memang mau ditampilkan, filenya masih ada.

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
    if (!opt || symbolOptions.some((o) => o.value === opt)) return;
    const next = [...symbolOptions, { value: opt, createdAt: Date.now() }];
    setSymbolOptions(next);
    await saveUserData(user.uid, { symbolOptions: next });
  }
  async function addEntryModelOption(opt) {
    if (!opt || entryModelOptions.some((o) => o.value === opt)) return;
    const next = [...entryModelOptions, { value: opt, createdAt: Date.now() }];
    setEntryModelOptions(next);
    await saveUserData(user.uid, { entryModelOptions: next });
  }
  async function deleteSymbolOption(opt) {
    const next = symbolOptions.filter((o) => o.value !== opt);
    setSymbolOptions(next);
    await saveUserData(user.uid, { symbolOptions: next });
  }
  async function deleteEntryModelOption(opt) {
    const next = entryModelOptions.filter((o) => o.value !== opt);
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

  // Catatan cleanup: sebelumnya ada DUA daftar NAV — satu di scope modul
  // (sekarang di theme/tokens.js) dan satu lagi didefinisikan ulang persis
  // sama di sini, yang otomatis "menutupi" (shadowing) versi module-nya.
  // Karena isinya identik, sekarang dipakai satu sumber saja: NAV dari tokens.js.
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
          html, body { margin:0; height: 100%; background: ${C.bg}; }
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
            .chat-mode .main-area { padding: 0 16px 0; }
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
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function TagSelect({ value, onChange, options, onAddOption, onDeleteOption, placeholder, uppercase, disabled }) {
  const C = useTheme();
  const inputStyle = useInputStyle();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const norm = (s) => (uppercase ? s.toUpperCase() : s);
  const trimmedQuery = query.trim();
  const filtered = options.filter((o) => o.value.toLowerCase().includes(trimmedQuery.toLowerCase()));
  const exactMatch = options.some((o) => o.value.toLowerCase() === trimmedQuery.toLowerCase());
  // Tag simbol/entry model di sini cuma shortcut biar gak perlu ngetik ulang,
  // jadi selalu boleh dihapus kapan saja — bukan tag ini yang butuh aturan
  // 7 hari (itu berlaku untuk trade yang sudah tersimpan di halaman Journal).

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
    if (!options.some((o) => o.value.toLowerCase() === v.toLowerCase())) onAddOption(v);
    onChange(v);
    closeMenu();
  }
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (exactMatch) select(options.find((o) => o.value.toLowerCase() === trimmedQuery.toLowerCase()).value);
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
                      key={opt.value}
                      onClick={() => select(opt.value)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        border: `1px solid ${C.line}`, borderRadius: 0, padding: "8px 10px",
                        background: opt.value === value ? C.btnAccentWash : C.paperSoft,
                        color: opt.value === value ? C.btnAccentText : C.ink,
                        fontSize: 14, fontWeight: 600, fontFamily: SANS, cursor: "pointer",
                      }}
                    >
                      <span>{opt.value}</span>
                      {(confirmDelete === opt.value ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={(e) => confirmDeleteNow(e, opt.value)}
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
                          onClick={(e) => requestDelete(e, opt.value)}
                          style={{
                            border: "none", background: "transparent", color: C.muted,
                            cursor: "pointer", padding: 2, display: "flex", flexShrink: 0,
                          }}
                          aria-label={`Delete ${opt.value}`}
                        ><X size={15} /></button>
                      ))}
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
          <div
            onClick={() => updateForm("entryModelTracked", !form.entryModelTracked)}
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
          >
            <span style={{ fontSize: 11, color: C.muted, fontFamily: SANS }}>Count in stats</span>
            <button
              type="button"
              role="checkbox"
              aria-checked={form.entryModelTracked}
              aria-label="Count in stats"
              onClick={(e) => { e.stopPropagation(); updateForm("entryModelTracked", !form.entryModelTracked); }}
              style={{
                width: 16, height: 16, padding: 0, boxSizing: "border-box", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${form.entryModelTracked ? C.btnAccent : C.inputBorder}`,
                borderRadius: 0,
                background: form.entryModelTracked ? C.btnAccent : C.inputBg,
                cursor: "pointer",
              }}
            >
              {form.entryModelTracked && <Check size={11} strokeWidth={3} color={C.btnAccentTextActive} />}
            </button>
          </div>
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
      <div style={{ marginTop: -10, marginBottom: 22, marginLeft: -5, marginRight: -5, display: "flex", flexWrap: "wrap" }}>
        {(form.images || []).map((src, i) => (
          <div key={i} style={{ width: "25%", boxSizing: "border-box", padding: "0 5px 10px" }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
              <img src={src} alt="" style={{
                width: "100%", height: "100%", objectFit: "cover", border: `1px solid ${C.line}`, borderRadius: 0,
                display: "block",
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
          </div>
        ))}
        {(form.images || []).length < 8 && (
          <div style={{ width: "25%", boxSizing: "border-box", padding: "0 5px 10px" }}>
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
          </div>
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
// ---- Collapsible trade card: collapsed shows just symbol / date / R, tap
// to expand and reveal the rest (reason, tags, notes, images). The height
// animation uses the CSS grid "0fr -> 1fr" trick — smooth, no manual
// height measurement needed, same idea as CardNav's expanding menu. ----
function TradeCard({ t, onDelete }) {
  const C = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const win = t.rActual > 0;
  const hasDetails = t.reason || t.direction || t.rules || t.emotion || t.notes || (t.images && t.images.length > 0);
  // Trade yang sudah tersimpan di Journal cuma boleh dihapus dalam 7 hari
  // sejak dicatat — setelahnya jadi catatan permanen. Trade lama tanpa
  // `createdAt` (dicatat sebelum aturan ini ada) dianggap sudah lewat masa itu.
  const canDelete = t.createdAt ? Date.now() - t.createdAt < ONE_WEEK_MS : false;

  return (
    <div style={{
      background: C.paperSoftLight, border: `1px solid ${C.line}`,
      borderRadius: 0, boxShadow: C.shadowCard, overflow: "hidden",
    }}>
      <button
        type="button"
        className="no-press"
        onClick={() => hasDetails && setExpanded((e) => !e)}
        style={{
          width: "100%", background: "transparent", border: "none", padding: "20px 22px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          cursor: hasDetails ? "pointer" : "default", textAlign: "left", color: C.ink,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontWeight: 700, fontSize: 19 }}>{t.symbol}</div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: C.faint }}>{t.date}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: win ? C.ink : C.faint }}>
            {fmtR(t.rActual)}
          </div>
          {hasDetails && (
            <span style={{ display: "flex", color: C.faint, transition: "transform 0.3s ease", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              <ChevronDown size={16} />
            </span>
          )}
        </div>
      </button>
      <div style={{
        display: "grid", gridTemplateRows: expanded ? "1fr" : "0fr",
        transition: "grid-template-rows 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "0 22px 20px" }}>
            {t.reason && <div style={{ fontSize: 15, color: C.inkSoft, marginTop: 4 }}>{t.reason}</div>}
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 13 }}>
              {t.direction && <Tag text={`Direction: ${t.direction}`} />}
              {t.entryModel && <Tag text={`Model: ${t.entryModel}`} />}
              {t.rules && <Tag text={`Rules: ${t.rules}`} />}
              {t.emotion && <Tag text={`Emotion: ${t.emotion}`} />}
            </div>
            {t.notes && <div style={{ fontSize: 14, color: C.muted, marginTop: 11, fontStyle: "italic" }}>{t.notes}</div>}
            {t.images && t.images.length > 0 && (
              <div style={{ marginTop: 11, marginLeft: -4, marginRight: -4, display: "flex", flexWrap: "wrap" }}>
                {t.images.map((src, i) => (
                  <div key={i} style={{ width: "25%", boxSizing: "border-box", padding: 4 }}>
                    <button
                      type="button"
                      className="no-press"
                      onClick={(e) => { e.stopPropagation(); setLightboxSrc(src); }}
                      style={{ display: "block", width: "100%", aspectRatio: "1", padding: 0, border: `1px solid ${C.line}`, background: "transparent", cursor: "pointer" }}
                    >
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {canDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
                marginTop: 15, background: "transparent", border: "none", color: C.faint, fontSize: 10,
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0,
              }}><Trash2 size={11} /> Delete</button>
            )}
          </div>
        </div>
      </div>
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

// ---- Full-size image popup — same "mobile style" modal treatment as
// DateField's calendar (portal to <body>, dark backdrop, centered card
// that scales/blurs in), just holding an <img> instead of a grid. ----
function ImageLightbox({ src, onClose }) {
  const C = useTheme();
  useEffect(() => {
    if (!src) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [src]);

  const content = (
    <AnimatePresence>
      {src && (
        <motion.div
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed", inset: 0, zIndex: 49,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, boxSizing: "border-box",
            background: "rgba(0,0,0,0.7)",
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative", maxWidth: "100%", maxHeight: "100%" }}
          >
            <img src={src} alt="" style={{
              display: "block", maxWidth: "90vw", maxHeight: "85vh",
              width: "auto", height: "auto", border: `1px solid ${C.line}`,
              boxShadow: C.shadowModal, objectFit: "contain",
            }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

function JournalList({ trades, onDelete, onGoLog }) {
  const C = useTheme();
  const [confirmId, setConfirmId] = useState(null);
  const confirmTrade = trades.find((t) => t.id === confirmId) || null;
  const [period, setPeriod] = useState("all");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });

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
      <div style={{ marginTop: period === "custom" ? 0 : 14 }}>
        <SectionLabel text={`Trade Log \u00b7 ${filteredTrades.length} trade${filteredTrades.length === 1 ? "" : "s"}`} />
      </div>
      {filteredTrades.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 16, marginBottom: 16 }}>No trades logged in this period.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: "100%" }}>
          {filteredTrades.map((t) => (
            <TradeCard key={t.id} t={t} onDelete={() => setConfirmId(t.id)} />
          ))}
        </div>
      )}
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
          <div style={{ marginTop: period === "custom" ? 0 : 14 }}>
            <SectionLabel text={`Summary \u00b7 ${filteredTrades.length} trade${filteredTrades.length === 1 ? "" : "s"}`} />
          </div>
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
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Cumulative R, trade by trade</div>
            </div>
            <div onPointerDown={() => activateChart("equity")}>
              <EquityCurve key={chartKey("equity")} trades={filteredTrades} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>R per Trade</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Green = win, red = loss</div>
            </div>
            <div onPointerDown={() => activateChart("rbar")}>
              <TradeRBarChart key={chartKey("rbar")} trades={filteredTrades} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Performance by Symbol</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Total R per simbol, diurutkan dari yang paling profitable</div>
            </div>
            <div onPointerDown={() => activateChart("symbol")}>
              <SymbolPerformanceChart key={chartKey("symbol")} trades={filteredTrades} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
  <div style={{ padding: "0 4px", marginBottom: 16 }}>
    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Trader Scorecard</div>
    <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Score 0–100 per dimension</div>
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

          {availableYears.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 4px", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Trade Calendar</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Daily P&amp;L for {heatmapYear}</div>
                </div>
                <YearStepper year={heatmapYear} years={availableYears} onChange={setHeatmapYear} />
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 0, padding: "14px 18px", boxShadow: C.shadowCard }}>
                <CalendarHeatmap trades={trades} year={heatmapYear} />
              </div>
            </div>
          )}

          <div style={{ marginTop: 22 }}>
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
          </div>
        </>
      )}
    </div>
  );
}
