import React, { useState, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { loadUserData, saveUserData } from "./store";
import AuthScreen from "./AuthScreen.jsx";
import { getAppStyles } from "./styles/index.js";

// ---- Design tokens, util tanggal/format/stats ----
// tinggal di file masing-masing (lihat src/theme, src/utils) supaya file
// ini tidak lagi jadi satu file raksasa berisi semuanya.
import {
  SANS, DESKTOP_BREAKPOINT, NAV,
  ThemeContext, getPageBackground, THEME_ORDER, LIGHT, DARK,
} from "./theme/tokens.js";
import { uid, fileToCompressedDataURL } from "./utils/format.js";
import { todayISO } from "./utils/date.js";
import { computeStats } from "./utils/stats.js";

// ---- Layout: desktop topbar+bottom nav / mobile topbar+marquee live in
// their own files under components/layout, mobile vs desktop nav under
// components/nav (see also src/styles/desktop.js + src/styles/mobile.js
// for their CSS) ----
import DesktopTopbar from "./components/layout/DesktopTopbar.jsx";
import MobileTopbar from "./components/layout/MobileTopbar.jsx";
import PerfMarquee from "./components/layout/PerfMarquee.jsx";
import MobileDockNav from "./components/nav/MobileDockNav.jsx";
import PeriodFilterBar from "./components/common/PeriodFilterBar.jsx";

// ---- Pages ----
import LogTradeForm from "./components/trade/LogTradeForm.jsx";
import JournalList from "./components/JournalList.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import CircularText from "./components/common/CircularText.jsx";

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
  const [desktopNavIndicator, setDesktopNavIndicator] = useState({ left: 0, width: 0 });
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth > DESKTOP_BREAKPOINT : true
  );
  const [trades, setTrades] = useState([]);
  const [themeMode, setThemeMode] = useState("light");
  const [loaded, setLoaded] = useState(false);
  const [symbolOptions, setSymbolOptions] = useState([]);
  const [form, setForm] = useState({
    date: todayISO(), symbol: "", direction: "", reason: "",
    riskPct: "", rPlanned: "", rActual: "", rules: "", emotion: "", notes: "",
    images: [],
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [dashboardPeriod, setDashboardPeriod] = useState("all");
  const [dashboardCustomRange, setDashboardCustomRange] = useState({ from: "", to: "" });
  const [journalPeriod, setJournalPeriod] = useState("all");
  const [journalCustomRange, setJournalCustomRange] = useState({ from: "", to: "" });

  useEffect(() => {
    (async () => {
      const data = await loadUserData(user.uid);
      setTrades(data.trades);
      setThemeMode(THEME_ORDER.includes(data.theme) ? data.theme : "light");
      setSymbolOptions(data.symbolOptions);
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
  async function deleteSymbolOption(opt) {
    const next = symbolOptions.filter((o) => o.value !== opt);
    setSymbolOptions(next);
    await saveUserData(user.uid, { symbolOptions: next });
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
      images: form.images || [],
    };
    const next = [trade, ...trades];
    setTrades(next);
    await saveUserData(user.uid, { trades: next });
    setForm({ date: todayISO(), symbol: "", direction: "", reason: "", riskPct: "", rPlanned: "", rActual: "", rules: "", emotion: "", notes: "", images: [] });
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

  const NAV_DESKTOP = NAV;

  // ---- Swipe kiri/kanan untuk pindah halaman ----
  // Halaman "mengikuti jari" secara live selama drag (transform dimanipulasi
  // langsung lewat ref, bukan lewat state React) supaya terasa mulus tanpa
  // lag re-render, lalu snap ke halaman terdekat dengan transisi CSS begitu
  // jari dilepas — mirip carousel native. Urutan halaman ikut array NAV.
  const pageOrder = NAV.map((n) => n.key);
  const mainAreaRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, baseIndex: 0, containerWidth: 0, horizontalLock: null });

  function applyTrackTransform(px, withTransition) {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = withTransition ? "transform .38s cubic-bezier(.22,.61,.36,1)" : "none";
    el.style.transform = `translateX(${px}px)`;
  }
  function snapToTab(key, withTransition) {
    const idx = Math.max(0, pageOrder.indexOf(key));
    const width = mainAreaRef.current?.offsetWidth || 0;
    applyTrackTransform(-idx * width, withTransition);
  }

  // Setiap kali tab berubah lewat cara lain (klik tombol nav, dsb), track
  // ikut geser dengan animasi yang sama supaya terasa konsisten dengan swipe.
  useEffect(() => { snapToTab(tab, true); }, [tab]);
  useEffect(() => {
    function onResize() { snapToTab(tab, false); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [tab]);

  function handleContentTouchStart(e) {
    const t = e.touches[0];
    dragRef.current = {
      dragging: true, startX: t.clientX, startY: t.clientY,
      baseIndex: Math.max(0, pageOrder.indexOf(tab)),
      containerWidth: mainAreaRef.current?.offsetWidth || 1,
      horizontalLock: null,
    };
  }
  function handleContentTouchMove(e) {
    const d = dragRef.current;
    if (!d.dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - d.startX;
    const dy = t.clientY - d.startY;
    if (d.horizontalLock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      d.horizontalLock = Math.abs(dx) > Math.abs(dy) * 1.2;
    }
    if (!d.horizontalLock) return; // biarkan scroll vertikal berjalan normal
    // sedikit tahanan (resistance) kalau sudah di halaman paling ujung
    const atFirst = d.baseIndex === 0 && dx > 0;
    const atLast = d.baseIndex === pageOrder.length - 1 && dx < 0;
    const effectiveDx = atFirst || atLast ? dx * 0.35 : dx;
    applyTrackTransform(-d.baseIndex * d.containerWidth + effectiveDx, false);
  }
  function handleContentTouchEnd(e) {
    const d = dragRef.current;
    if (!d.dragging) return;
    d.dragging = false;
    if (!d.horizontalLock) return; // bukan swipe halaman (mis. cuma scroll)
    const t = e.changedTouches[0];
    const dx = t.clientX - d.startX;
    const threshold = Math.min(90, d.containerWidth * 0.18);
    let newIndex = d.baseIndex;
    if (dx < -threshold && d.baseIndex < pageOrder.length - 1) newIndex = d.baseIndex + 1;
    else if (dx > threshold && d.baseIndex > 0) newIndex = d.baseIndex - 1;
    applyTrackTransform(-newIndex * d.containerWidth, true);
    if (newIndex !== d.baseIndex) setTab(pageOrder[newIndex]);
  }
  function handleContentTouchCancel() {
    const d = dragRef.current;
    if (!d.dragging) return;
    d.dragging = false;
    applyTrackTransform(-d.baseIndex * d.containerWidth, true);
  }

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
          left: el.offsetLeft,
          width: el.offsetWidth,
        });
      }
    }
    updateDesktopNavIndicator();
    window.addEventListener("resize", updateDesktopNavIndicator);
    return () => window.removeEventListener("resize", updateDesktopNavIndicator);
  }, [tab, isDesktop]);

  const C = themeMode === "dark" ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={C}>
      <div className="app-root" style={{ ...getPageBackground(themeMode, C), minHeight: isDesktop ? "100vh" : undefined, color: C.ink, fontFamily: SANS }}>
        <style>{getAppStyles(C, SANS)}</style>
        <div className="app-shell">
          <DesktopTopbar
            navItems={NAV_DESKTOP}
            activeKey={tab}
            onSelect={setTab}
            registerItemRef={(key, el) => { desktopNavRefs.current[key] = el; }}
            indicator={desktopNavIndicator}
            accentColor={C.btnAccent}
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            userEmail={user.email}
          />

          <MobileTopbar themeMode={themeMode} onToggleTheme={toggleTheme} onLogout={handleLogout} />

          <PerfMarquee stats={stats} />

          {(tab === "journal" || tab === "dashboard") && (
            <PeriodFilterBar
              period={tab === "journal" ? journalPeriod : dashboardPeriod}
              setPeriod={tab === "journal" ? setJournalPeriod : setDashboardPeriod}
              customRange={tab === "journal" ? journalCustomRange : dashboardCustomRange}
              setCustomRange={tab === "journal" ? setJournalCustomRange : setDashboardCustomRange}
            />
          )}

          {/* Main content — track geser (swipe) berisi 3 halaman berdampingan */}
          <div
            className="main-area"
            ref={mainAreaRef}
            style={{ overflowX: "hidden", touchAction: "pan-y" }}
            onTouchStart={handleContentTouchStart}
            onTouchMove={handleContentTouchMove}
            onTouchEnd={handleContentTouchEnd}
            onTouchCancel={handleContentTouchCancel}
          >
            {!loaded ? (
              <div className="main-area-inner">
                <div style={{ color: C.faint, fontSize: 14 }}>Loading…</div>
              </div>
            ) : (
              <div ref={trackRef} style={{ display: "flex", width: `${pageOrder.length * 100}%` }}>
                {pageOrder.map((key) => (
                  <div key={key} style={{ width: `${100 / pageOrder.length}%`, flexShrink: 0 }}>
                    <div className="main-area-inner">
                      {key === "log" ? (
                        <LogTradeForm form={form} updateForm={updateForm} toggleEmotion={toggleEmotion} handleSave={handleSave} canSave={canSave} symbolOptions={symbolOptions} onAddSymbolOption={addSymbolOption} onDeleteSymbolOption={deleteSymbolOption} onAddImages={addImages} onRemoveImage={removeImage} imageUploading={imageUploading} />
                      ) : key === "journal" ? (
                        <JournalList trades={trades} onDelete={handleDelete} onGoLog={() => setTab("log")} period={journalPeriod} customRange={journalCustomRange} />
                      ) : (
                        <Dashboard trades={trades} period={dashboardPeriod} customRange={dashboardCustomRange} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

        {/* Decorative spinning badge — desktop only, see .circular-text-dock CSS */}
        <div className="circular-text-dock">
          <CircularText text="STAY DISCIPLINED * STAY CONSISTENT *" onHover="speedUp" spinDuration={20} />
        </div>
      </div>
    </ThemeContext.Provider>
  );
         }
