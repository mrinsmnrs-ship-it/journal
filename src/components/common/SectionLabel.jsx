// ============================================================================
// components/common/SectionLabel.jsx
// -----------------------------------------------------------------------------
// Judul kecil huruf besar untuk memisahkan bagian dalam satu halaman
// (mis. "Journal", "Dashboard").
// ============================================================================
import { useTheme, SANS } from "../../theme/tokens.js";

export default function SectionLabel({ text }) {
  const C = useTheme();
  return (
    <div style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      color: C.muted, marginBottom: 15, textTransform: "capitalize",
    }}>{text}</div>
  );
}
