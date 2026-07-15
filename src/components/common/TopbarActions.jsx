// ============================================================================
// components/common/TopbarActions.jsx
// -----------------------------------------------------------------------------
// Pengganti HamburgerMenu: dua tombol ikon-only (ganti tema + logout)
// ditampilkan langsung berdampingan di pojok topbar, tanpa dropdown/popup.
// Pakai style yang sama persis dengan .hamburger-panel-item supaya
// tampilannya konsisten dengan desain sebelumnya.
// ============================================================================
import { LogOut } from "lucide-react";
import { useTheme, THEME_META } from "../../theme/tokens.js";

export default function TopbarActions({ themeMode, onToggleTheme, onLogout }) {
  const C = useTheme();
  const { label: themeLabel, Icon: ThemeIcon } = THEME_META[themeMode] || THEME_META.light;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <button
        type="button"
        className="hamburger-panel-item"
        onClick={onToggleTheme}
        aria-label={`Current theme: ${themeLabel}`}
        title={`Current theme: ${themeLabel}`}
      >
        <ThemeIcon size={15} style={{ color: C.ink }} />
      </button>
      <button
        type="button"
        className="hamburger-panel-item"
        onClick={onLogout}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut size={15} style={{ color: C.ink }} />
      </button>
    </div>
  );
}
