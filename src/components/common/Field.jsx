// ============================================================================
// components/common/Field.jsx
// -----------------------------------------------------------------------------
// Wrapper label + input generik. Dipakai di semua form (Log Trade, dll)
// supaya jarak & style label konsisten di satu tempat.
// ============================================================================
import { useTheme, LABEL_FONT } from "../../theme/tokens.js";

export default function Field({ label, children }) {
  const C = useTheme();
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
        color: C.muted, marginBottom: 9, textTransform: "capitalize",
      }}>{label}</div>
      {children}
    </div>
  );
}
