// ============================================================================
// components/common/useInputStyle.js
// -----------------------------------------------------------------------------
// Hook kecil yang mengembalikan object style siap-pakai untuk <input>/<textarea>
// polos, biar tidak copy-paste style yang sama di banyak form.
// ============================================================================
import { useTheme, SANS } from "../../theme/tokens.js";

export default function useInputStyle() {
  const C = useTheme();
  return {
    width: "100%", boxSizing: "border-box", background: C.inputBg,
    border: `1px solid ${C.inputBorder}`, borderRadius: 0, padding: "14px 16px",
    color: C.inputText, fontFamily: SANS, fontSize: 16, outline: "none",
    boxShadow: "none",
  };
}
