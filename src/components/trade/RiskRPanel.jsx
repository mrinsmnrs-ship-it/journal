// ============================================================================
// components/trade/RiskRPanel.jsx
// -----------------------------------------------------------------------------
// Panel "Risk / R Planned / R Actual" di form Log Trade. Tap salah satu kotak
// untuk memilihnya, lalu pakai satu set tombol -0.1 / - / + / +0.1 di bawah
// untuk mengubah nilai kotak yang lagi aktif — jadi tidak perlu 3 pasang
// tombol +/- terpisah untuk tiap kotak.
// TODO (dari memory user): tambahkan tombol Reset di antara tombol - dan +.
// ============================================================================
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useTheme, SANS, LABEL_FONT } from "../../theme/tokens.js";

// Shared Risk % / R Planned / R Actual panel.
// Tap a box to select it, then use the single set of -0.1 / - / + / +0.1
// buttons to adjust whichever field is currently selected — no need for
// three separate +/- controls.
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

// Terima input angka mentah selagi diketik: boleh kosong, minus di depan,
// dan satu titik desimal -- baru divalidasi/dipakai sebagai Number saat dihitung.
const isRawNumber = (v) => v === "" || /^-?\d*\.?\d*$/.test(v);

export default function RiskRPanel({ form, updateForm }) {
  const C = useTheme();
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialRows, setPartialRows] = useState([{ a: "0", b: "0" }]);

  // Total R = jumlah kontribusi tiap baris (Partial R x Qty%), bukan
  // input manual lagi -- otomatis mengikuti isi baris di bawahnya.
  const partialTotal = Math.round(
    partialRows.reduce((sum, row) => sum + (Number(row.a) || 0) * (Number(row.b) || 0) / 100, 0) * 100
  ) / 100;

  const adjustField = (key, delta) => {
    const current = Number(form[key]) || 0;
    const { min, max } = FIELD_LIMITS[key];
    const next = Math.min(max, Math.max(min, Math.round((current + delta) * 100) / 100));
    updateForm(key, String(next));
  };

  const updatePartialRow = (idx, col, value) => {
    if (!isRawNumber(value)) return;
    setPartialRows((rows) => rows.map((row, i) => (i === idx ? { ...row, [col]: value } : row)));
  };

  const addPartialRow = () => {
    setPartialRows((rows) => (rows.length >= 15 ? rows : [...rows, { a: "0", b: "0" }]));
  };

  const deletePartialRow = (idx) => {
    setPartialRows((rows) => {
      const next = rows.filter((_, i) => i !== idx);
      return next.length ? next : [{ a: "0", b: "0" }];
    });
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button
          type="button"
          onClick={() => setPartialOpen(true)}
          style={{
            height: 26, padding: "0 10px", borderRadius: 0,
            border: `1px solid ${C.line}`, background: C.paperSoft,
            color: C.inkSoft, fontWeight: 600, fontSize: 10, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SANS, lineHeight: 1,
          }}
        >
          Partial
        </button>
      </div>
      {createPortal(
        <AnimatePresence>
          {partialOpen && (
            <motion.div
              onClick={() => setPartialOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "fixed", inset: 0, zIndex: 29,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 16, boxSizing: "border-box",
                background: "rgba(0,0,0,0.35)",
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  width: "min(85vw, 280px)", maxWidth: 280, maxHeight: "80vh",
                  display: "flex", flexDirection: "column",
                  color: C.ink,
                  background: C.paperSoftLight, border: "none", borderRadius: 0,
                  boxShadow: C.shadowModal,
                }}
              >
                <div style={{ padding: "16px 16px 14px 16px", flexShrink: 0, borderBottom: `1px solid ${C.line}` }}>
                  <div style={{
                    fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                    color: C.muted, marginBottom: 6, textTransform: "capitalize",
                  }}>Total R</div>
                  <div style={{
                    display: "flex", alignItems: "baseline", gap: 2, marginBottom: 18,
                    fontFamily: SANS, fontSize: 24, fontWeight: 700, color: C.inputText,
                  }}>
                    {partialTotal < 0 && <span style={{ lineHeight: 1 }}>&minus;</span>}
                    <span style={{ lineHeight: 1 }}>{Math.abs(partialTotal).toFixed(1)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 16, flexShrink: 0 }} />
                    <div style={{
                      flex: 1, fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                      color: C.muted, textTransform: "capitalize", textAlign: "left",
                    }}>R Partial</div>
                    <div style={{
                      flex: 1, fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                      color: C.muted, textTransform: "capitalize", textAlign: "left",
                    }}>Qty %</div>
                    <div style={{ width: 24, flexShrink: 0 }} />
                  </div>
                </div>
                <div style={{ padding: "12px 16px 16px 16px", overflowY: "auto", flex: 1, minHeight: 0 }}>
                  {partialRows.map((row, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 16, flexShrink: 0, fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.muted }}>
                        {idx + 1}.
                      </div>
                      {["a", "b"].map((col) => (
                        <input
                          key={col}
                          type="text"
                          inputMode="decimal"
                          value={row[col]}
                          onChange={(e) => updatePartialRow(idx, col, e.target.value)}
                          style={{
                            flex: 1, minWidth: 0, boxSizing: "border-box", background: "transparent",
                            border: "none", borderBottom: `1px solid ${C.inputBorder}`,
                            borderRadius: 0, height: 36, padding: "0 4px", textAlign: "center",
                            color: C.inputText, fontFamily: SANS, fontSize: 14, fontWeight: 600, outline: "none",
                          }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => deletePartialRow(idx)}
                        aria-label="Delete row"
                        style={{
                          width: 24, height: 36, padding: 0, flexShrink: 0, borderRadius: 0,
                          border: "none", background: "transparent",
                          color: C.inkSoft, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {partialRows.length < 15 && (
                    <button
                      type="button"
                      onClick={addPartialRow}
                      style={{
                        border: "none", background: "transparent", padding: "8px 0 0 0", marginTop: 4,
                        color: C.inkSoft, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      + Tambah
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
                               }
