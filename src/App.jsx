import React, { useState, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { loadUserData, saveUserData } from "./store";
import AuthScreen from "./AuthScreen.jsx";
import JournalChat from "./JournalChat.jsx";
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
import DesktopBottomNav from "./components/nav/DesktopBottomNav.jsx";
import MobileDockNav from "./components/nav/MobileDockNav.jsx";

// ---- Pages ----
import LogTradeForm from "./components/trade/LogTradeForm.jsx";
import JournalList from "./components/JournalList.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";

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

  const NAV_DESKTOP = NAV;

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
  const isChatTab = tab === "chat";

  return (
    <ThemeContext.Provider value={C}>
      <div className={`app-root${isChatTab ? " chat-mode" : ""}`} style={{ ...getPageBackground(themeMode, C), minHeight: isDesktop ? "100vh" : undefined, color: C.ink, fontFamily: SANS }}>
        <style>{getAppStyles(C, SANS)}</style>
        <div className="app-shell">
          <DesktopTopbar
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            userEmail={user.email}
          />

          <MobileTopbar themeMode={themeMode} onToggleTheme={toggleTheme} onLogout={handleLogout} />

          <PerfMarquee stats={stats} />

          {/* Main content */}
          <div className="main-area">
            {!loaded ? (
              <div style={{ color: C.faint, fontSize: 14 }}>Loading…</div>
            ) : tab === "chat" ? (
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
        </div>

        {/* Bottom nav (desktop) — floating pill, centered, not full-width */}
        <DesktopBottomNav
          items={NAV_DESKTOP}
          activeKey={tab}
          onSelect={setTab}
          registerItemRef={(key, el) => { desktopNavRefs.current[key] = el; }}
          indicator={desktopNavIndicator}
          accentColor={C.btnAccent}
        />

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
