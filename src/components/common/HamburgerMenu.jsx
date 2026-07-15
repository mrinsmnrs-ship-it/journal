// ============================================================================
// components/common/HamburgerMenu.jsx
// -----------------------------------------------------------------------------
// Tombol ikon hamburger (3 garis, tanpa border) yang berubah jadi silang (X)
// saat dipencet. Membuka popup kecil, icon-only (tanpa teks), yang menempel
// tepat di bawah tombol -- sejajar dengan item lain di topbar, menyatu
// dengan warna topbar, dan pakai shadow yang sama dengan popover lain di
// app (C.shadowPopover) supaya tidak terlalu tebal. Sudut popup tidak
// dibulatkan (border-radius: 0).
// ============================================================================
import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { useTheme, SANS, THEME_ORDER, THEME_META } from "../../theme/tokens.js";

export default function HamburgerMenu({ themeMode, onToggleTheme, onLogout }) {
  const C = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Klik di luar atau tekan Escape -> tutup popup.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const { label: themeLabel, Icon: ThemeIcon } = THEME_META[themeMode] || THEME_META.light;
  const nextMode = THEME_ORDER[(THEME_ORDER.indexOf(themeMode) + 1) % THEME_ORDER.length];
  const nextLabel = THEME_META[nextMode]?.label || "Light";

  return (
    <div className="hamburger-root" ref={rootRef}>
      <button
        type="button"
        className={`hamburger-btn${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        <span className="hamburger-line" style={{ background: C.ink }} />
        <span className="hamburger-line" style={{ background: C.ink }} />
      </button>

      <div
        className={`hamburger-panel${open ? " open" : ""}`}
        style={{ background: C.paper, border: `1px solid ${C.line}`, boxShadow: C.shadowPopover }}
      >
        <button
          type="button"
          className="hamburger-panel-item"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextLabel}`}
          title={`Switch to ${nextLabel}`}
          style={{ color: C.inkSoft, fontFamily: SANS }}
        >
          <ThemeIcon size={15} style={{ color: C.ink }} />
        </button>
        <div className="hamburger-panel-divider" style={{ background: C.line }} />
        <button
          type="button"
          className="hamburger-panel-item"
          onClick={() => { setOpen(false); onLogout(); }}
          aria-label="Log out"
          title="Log out"
          style={{ color: C.inkSoft, fontFamily: SANS }}
        >
          <LogOut size={15} style={{ color: C.ink }} />
        </button>
      </div>
    </div>
  );
}
