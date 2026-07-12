// ============================================================================
// components/common/Chip.jsx
// -----------------------------------------------------------------------------
// Tombol pilihan kecil bentuk pill (dipakai untuk pilihan singkat seperti
// direction Buy/Sell, filter periode, dll). Mirip PillToggle tapi lebih
// ringkas dan teksnya rata tengah + boleh terpotong "...".
// ============================================================================
import { useTheme, SANS } from "../../theme/tokens.js";
import "../../PillToggle.css";

export default function Chip({ label, active, onClick }) {
  const C = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className="pill-toggle"
      style={{
        fontFamily: SANS, fontSize: 14, fontWeight: 600,
        padding: "9px 12px", borderRadius: 0, textAlign: "center",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        border: `1px solid ${active ? C.btnAccentBorder : C.line}`,
        background: C.paperSoft,
        cursor: "pointer",
        "--pill-fill": C.btnAccent,
        "--pill-base-text": C.inkSoft,
        "--pill-active-text": C.btnAccentTextActive,
      }}
    >
      <span className="pill-toggle-fill" />
      <span className="pill-toggle-label-stack">
        <span className="pill-toggle-label-base">{label}</span>
        <span className="pill-toggle-label-active">{label}</span>
      </span>
    </button>
  );
}
