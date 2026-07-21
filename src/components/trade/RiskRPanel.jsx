// ============================================================================
// components/trade/RiskRPanel.jsx
// -----------------------------------------------------------------------------
// Panel "R Planned / R Actual" di form Log Trade. Tiap baris punya set
// tombol -1 / -0.1 / +0.1 / +1 sendiri untuk mengubah nilainya.
// ============================================================================
import { useTheme, SANS, LABEL_FONT } from "../../theme/tokens.js";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

const R_FIELDS = [
  { key: "rPlanned", label: "R Planned" },
  { key: "rActual", label: "R Actual" },
];

// R Planned tidak boleh negatif (0-100). R Actual boleh negatif
// (rugi) tapi dibatasi -100 sampai 100 supaya tidak salah pencet kebablasan.
const FIELD_LIMITS = {
  rPlanned: { min: 0, max: 100 },
  rActual: { min: -100, max: 100 },
};

export default function RiskRPanel({ form, updateForm }) {
  const C = useTheme();

  const adjustField = (key, delta) => {
    const current = Number(form[key]) || 0;
    const { min, max } = FIELD_LIMITS[key];
    const next = Math.min(max, Math.max(min, Math.round((current + delta) * 100) / 100));
    updateForm(key, String(next));
  };

  return (
    <div style={{ marginBottom: 22 }}>
      {R_FIELDS.map(({ key, label }) => {
        const raw = form[key];
        const numeric = raw === "" || raw === undefined || raw === null || isNaN(Number(raw)) ? 0 : Number(raw);
        const arrowBtnStyle = {
          background: "transparent", border: "none", padding: 2, margin: 0,
          color: C.faint, cursor: "pointer", display: "flex", alignItems: "center",
        };
        return (
          <div key={key} style={{
            width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, padding: "14px 0",
            borderBottom: `1px solid ${C.line}`,
          }}>
            <span style={{
              fontFamily: LABEL_FONT, fontSize: 13, fontWeight: 600, letterSpacing: "0.01em",
              color: C.muted, flexShrink: 0,
            }}>{label}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 1 }}>
              <button type="button" onClick={() => adjustField(key, -1)} aria-label="Decrease 1" style={arrowBtnStyle}><ChevronsLeft size={14} /></button>
              <button type="button" onClick={() => adjustField(key, -0.1)} aria-label="Decrease 0.1" style={arrowBtnStyle}><ChevronLeft size={14} /></button>
              <span style={{
                fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.inputText,
                minWidth: 36, textAlign: "center",
              }}>{numeric.toFixed(1)}</span>
              <button type="button" onClick={() => adjustField(key, 0.1)} aria-label="Increase 0.1" style={arrowBtnStyle}><ChevronRight size={14} /></button>
              <button type="button" onClick={() => adjustField(key, 1)} aria-label="Increase 1" style={arrowBtnStyle}><ChevronsRight size={14} /></button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
