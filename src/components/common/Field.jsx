// ============================================================================
// components/common/Field.jsx
// -----------------------------------------------------------------------------
// Wrapper label + input generik. Dipakai di semua form (Log Trade, dll)
// supaya jarak & style label konsisten di satu tempat.
// Style "table row": tanpa border kotak, cuma garis bawah. Label rata kiri,
// isian/hasil rata kanan. Pakai stacked=true untuk field yang butuh baris
// sendiri (mis. Notes / textarea) — label tetap di atas, isian di bawahnya.
// ============================================================================
import { useTheme, LABEL_FONT } from "../../theme/tokens.js";

export default function Field({ label, children, stacked = false }) {
  const C = useTheme();

  const labelStyle = {
    fontFamily: LABEL_FONT, fontSize: 13, fontWeight: 600, letterSpacing: "0.01em",
    color: C.muted,
  };

  if (stacked) {
    return (
      <div style={{ padding: "14px 0", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ ...labelStyle, marginBottom: 10 }}>{label}</div>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, padding: "14px 0", borderBottom: `1px solid ${C.line}`,
    }}>
      <div style={{ ...labelStyle, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "flex-end" }}>
        {children}
      </div>
    </div>
  );
}
