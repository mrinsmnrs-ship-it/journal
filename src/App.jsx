import React, { useState, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { loadUserData, saveUserData } from "./store";
import { getAppStyles } from "./styles/index.js";

import {
  SANS, DESKTOP_BREAKPOINT, NAV,
  ThemeContext, getPageBackground, THEME_ORDER, LIGHT, DARK,
} from "./theme/tokens.js";
import { uid, fileToCompressedDataURL } from "./utils/format.js";
import { todayISO } from "./utils/date.js";
import { computeStats } from "./utils/stats.js";

import DesktopTopbar from "./components/layout/DesktopTopbar.jsx";
import MobileTopbar from "./components/layout/MobileTopbar.jsx";
import PerfMarquee from "./components/layout/PerfMarquee.jsx";
import MobileDockNav from "./components/nav/MobileDockNav.jsx";
import PeriodFilterBar from "./components/common/PeriodFilterBar.jsx";
import Footer from "./components/layout/Footer.jsx";
import OrientationGuard from "./components/layout/OrientationGuard.jsx";

import LogTradeForm from "./components/trade/LogTradeForm.jsx";
import JournalList from "./components/JournalList.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import CircularText from "./components/common/CircularText.jsx";

export default function App() {
  const [user, setUser] = useState(undefined);
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
  return <RJournal user={user} />;
}

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
    if (!user) { setLoaded(true); return; }
    (async () => {
      const data = await loadUserData(user.uid);
      setTrades(data.trades);
      setThemeMode(THEME_ORDER.includes(data.theme) ? data.theme : "light");
      setSymbolOptions(data.symbolOptions);
      setLoaded(true);
    })();
  }, [user]);

  useEffect(() => {
    function updateIsDesktop() {
      setIsDesktop(window.innerWidth > DESKTOP_BREAKPOINT);
    }
    updateIsDesktop();
    window.addEventListener("resize", updateIsDesktop);
    return () => window.removeEventListener("resize", updateIsDesktop);
  }, []);

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
    if (user) await saveUserData(user.uid, { theme: next });
  }
  function updateForm(key, val) { setForm((f) => ({ ...f, [key]: val })); }
  function toggleEmotion(e) {
    setForm((f) => ({ ...f, emotion: f.emotion === e ? "" : e }));
  }
  async function addSymbolOption(opt) {
    if (!opt || symbolOptions.some((o) => o.value === opt)) return;
    const next = [...symbolOptions, { value: opt, createdAt: Date.now() }];
    setSymbolOptions(next);
    if (user) await saveUserData(user.uid, { symbolOptions: next });
  }
  async function deleteSymbolOption(opt) {
    const next = symbolOptions.filter((o) => o.value !== opt);
    setSymbolOptions(next);
    if (user) await saveUserData(user.uid, { symbolOptions: next });
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
    if (user) await saveUserData(user.uid, { trades: next });
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
    const prev = trades;
    const next = trades.filter((t) => t.id !== id);
    setTrades(next);
    try {
      if (user) await saveUserData(user.uid, { trades: next });
    } catch (err) {
      console.error("Failed to delete trade:", err);
      setTrades(prev);
      alert("Failed to delete trade. Please try again (check the console for error details).");
    }
  }
  async function handleLogout() {
    await signOut(auth);
  }

  const stats = useMemo(() => computeStats(trades), [trades]);
  const NAV_DESKTOP = NAV;

  useEffect(() => {
    function updateNavIndicator() {
      const el = navRefs.current[tab];
      if (el) setNavIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    updateNavIndicator();
    window.addEventListener("resize", updateNavIndicator);
    return () => window.removeEventListener("resize", updateNavIndicator);
  }, [tab]);

  useEffect(() => {
    function updateDesktopNavIndicator() {
      const activeKey = desktopNavRefs.current[tab] ? tab : "log";
      const el = desktopNavRefs.current[activeKey];
      if (el) setDesktopNavIndicator({ left: el.offsetLeft, width: el.offsetWidth });
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
            userEmail={user?.email}
            isLoggedIn={!!user}
          />

          <MobileTopbar themeMode={themeMode} onToggleTheme={toggleTheme} onLogout={handleLogout} isLoggedIn={!!user} />

          <PerfMarquee stats={stats} />

          {(tab === "journal" || tab === "dashboard") && (
            <PeriodFilterBar
              period={tab === "journal" ? journalPeriod : dashboardPeriod}
              setPeriod={tab === "journal" ? setJournalPeriod : setDashboardPeriod}
              customRange={tab === "journal" ? journalCustomRange : dashboardCustomRange}
              setCustomRange={tab === "journal" ? setJournalCustomRange : setDashboardCustomRange}
            />
          )}

          <div className="main-area" style={{ overflowX: "hidden" }}>
            <div className="main-area-inner">
              {!loaded ? (
                <div style={{ color: C.faint, fontSize: 14 }}>Loading…</div>
              ) : tab === "log" ? (
                <LogTradeForm form={form} updateForm={updateForm} toggleEmotion={toggleEmotion} handleSave={handleSave} canSave={canSave} symbolOptions={symbolOptions} onAddSymbolOption={addSymbolOption} onDeleteSymbolOption={deleteSymbolOption} onAddImages={addImages} onRemoveImage={removeImage} imageUploading={imageUploading} />
              ) : tab === "journal" ? (
                <JournalList trades={trades} onDelete={handleDelete} onGoLog={() => setTab("log")} period={journalPeriod} customRange={journalCustomRange} />
              ) : tab === "dashboard" ? (
                <Dashboard trades={trades} period={dashboardPeriod} customRange={dashboardCustomRange} />
              ) : (
                <LogTradeForm form={form} updateForm={updateForm} toggleEmotion={toggleEmotion} handleSave={handleSave} canSave={canSave} symbolOptions={symbolOptions} onAddSymbolOption={addSymbolOption} onDeleteSymbolOption={deleteSymbolOption} onAddImages={addImages} onRemoveImage={removeImage} imageUploading={imageUploading} />
              )}

              <Footer />
            </div>
          </div>
        </div>

        <MobileDockNav
          items={NAV}
          activeKey={tab}
          onSelect={setTab}
          registerItemRef={(key, el) => { navRefs.current[key] = el; }}
          indicator={navIndicator}
          accentColor={C.btnAccent}
        />

        <div className="circular-text-dock">
          <CircularText text="STAY DISCIPLINED * STAY CONSISTENT *" onHover="speedUp" spinDuration={20} />
        </div>

        <OrientationGuard />
      </div>
    </ThemeContext.Provider>
  );
}
