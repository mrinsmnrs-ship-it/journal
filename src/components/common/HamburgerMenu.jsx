// ============================================================================
// components/common/HamburgerMenu.jsx
// -----------------------------------------------------------------------------
// Menggantikan pasangan tombol "ThemeToggle + Logout" di pojok topbar dengan
// satu tombol ikon 2 garis horizontal (tanpa border). Saat dipencet, kedua
// garis bergerak dari tempatnya dan membentuk silang (X), dan sebuah panel
// kecil muncul "sembul" dari kanan berisi menu ganti tema & log out.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { useTheme, SANS, THEME_ORDER, THEME_META } from "../../theme/tokens.js";

export default function HamburgerMenu({ themeMode, onToggleTheme, onLogout }) {
  const C = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Klik di luar atau tekan Escape -> tutup panel.
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
          style={{ color: C.inkSoft, fontFamily: SANS }}
        >
          <ThemeIcon size={16} style={{ color: C.ink }} />
          <span>Switch to {nextLabel}</span>
        </button>
        <div className="hamburger-panel-divider" style={{ background: C.line }} />
        <button
          type="button"
          className="hamburger-panel-item"
          onClick={() => { setOpen(false); onLogout(); }}
          style={{ color: C.inkSoft, fontFamily: SANS }}
        >
          <LogOut size={16} style={{ color: C.ink }} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
