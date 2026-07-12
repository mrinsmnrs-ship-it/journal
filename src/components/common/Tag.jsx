// ============================================================================
// components/common/Tag.jsx
// -----------------------------------------------------------------------------
// Label kecil monokrom (satu warna netral, tidak per-kategori), dipakai
// misalnya untuk menampilkan tag di kartu trade.
// ============================================================================
import { useTheme, SANS } from "../../theme/tokens.js";

export default function Tag({ text }) {
  // Monokrom: satu warna netral saja, tidak lagi per-kategori (blue/sage/rust/amber)
  // Warna & style disamakan persis dengan pill persona "Nox Valerica" di chat.
  const C = useTheme();
  return (
    <span style={{
      fontFamily: SANS, fontSize: 12, fontWeight: 400, color: C.muted,
      background: C.paperSoft, border: `1px solid ${C.line}`,
      borderRadius: 0, padding: "6px 13px",
    }}>
      {text}
    </span>
  );
}
