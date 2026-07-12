// ============================================================================
// components/common/ThemeToggle.jsx
// -----------------------------------------------------------------------------
// Tombol untuk ganti tema Light <-> Dark. "compact" = versi tanpa teks label
// (cuma ikon), dipakai di tempat yang sempit seperti topbar mobile.
// ============================================================================
import { useTheme, SANS, THEME_ORDER, THEME_META } from "../../theme/tokens.js";

export default function ThemeToggle({ mode, onToggle, compact }) {
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
        background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 0,
        padding: compact ? "9px" : "10px 16px", cursor: "pointer", color: C.inkSoft,
        fontFamily: SANS, fontSize: 14, fontWeight: 600,
      }}
    >
      <Icon size={16} style={{ color: C.ink }} />
      {!compact && label}
    </button>
  );
}
