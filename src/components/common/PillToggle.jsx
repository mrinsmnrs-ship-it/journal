// ============================================================================
// components/common/PillToggle.jsx
// -----------------------------------------------------------------------------
// Tombol pill dengan animasi "fill" saat aktif (dipakai misalnya untuk
// toggle Save Trade / Login). Style animasinya ada di PillToggle.css.
// ============================================================================
import { useTheme } from "../../theme/tokens.js";
import { SANS } from "../../theme/tokens.js";
import "../../PillToggle.css";

export default function PillToggle({ label, active, onClick }) {
  const C = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className="pill-toggle"
      style={{
        flex: 1, height: 40, padding: 0, borderRadius: 0,
        border: `1px solid ${active ? C.btnAccentBorder : C.line}`,
        background: C.paperSoft, fontFamily: SANS, fontWeight: 700, fontSize: 16,
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
