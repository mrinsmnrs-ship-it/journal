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
import { RotateCcw, Trash2 } from "lucide-react";
import { useTheme, SANS, LABEL_FONT } from "../../theme/tokens.js";
import Counter from "../../Counter.jsx";

// Shared Risk % / R Planned / R Actual panel.
// Tap a box to select it, then use the single set of -0.1 / - / + / +0.1
// buttons to adjust whichever field is currently selected — no need for
// three separate +/- controls.
const R_FIELDS = [
  { key: "riskPct", label: "Risk" },
  { key: "rPlanned", label: "R Planned" },
  { key: "rActual", label: "R Actual" },
];

export default function RiskRPanel({ form, updateForm }) {
  const C = useTheme();
  const [activeField, setActiveField] = useState("rActual");
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialMain, setPartialMain] = useState("0");
  const [partialRows, setPartialRows] = useState([{ a: "0", b: "0" }]);
  const [partialTarget, setPartialTarget] = useState("main");

  const adjust = (delta) => {
    const current = Number(form[activeField]) || 0;
    const next = Math.round((current + delta) * 100) / 100;
    updateForm(activeField, String(next));
  };

  const adjustPartial = (delta) => {
    if (partialTarget === "main") {
      setPartialMain((v) => String(Math.round(((Number(v) || 0) + delta) * 100) / 100));
      return;
    }
    const [idxStr, col] = partialTarget.split(":");
    const idx = Number(idxStr);
    setPartialRows((rows) => rows.map((row, i) => {
      if (i !== idx) return row;
      const current = Number(row[col]) || 0;
      return { ...row, [col]: String(Math.round((current + delta) * 100) / 100) };
    }));
  };

  const addPartialRow = () => {
    setPartialRows((rows) => (rows.length >= 15 ? rows : [...rows, { a: "0", b: "0" }]));
  };

  const resetPartial = () => {
    if (partialTarget === "main") {
      setPartialMain("0");
      return;
    }
    const [idxStr, col] = partialTarget.split(":");
    const idx = Number(idxStr);
    setPartialRows((rows) => rows.map((row, i) => (i === idx ? { ...row, [col]: "0" } : row)));
  };

  const deletePartialRow = (idx) => {
    setPartialRows((rows) => rows.filter((_, i) => i !== idx));
    setPartialTarget("main");
  };

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {R_FIELDS.map(({ key, label }) => {
          const active = activeField === key;
          const raw = form[key];
          const numeric = raw === "" || raw === undefined || raw === null || isNaN(Number(raw)) ? 0 : Number(raw);
          const isNegative = numeric < 0;
          return (
            <div key={key} style={{ flex: 1 }}>
              <div style={{
                fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                color: C.muted, marginBottom: 9, textTransform: "capitalize",
              }}>{label}</div>
              <button
                type="button"
                onClick={() => setActiveField(key)}
                style={{
                  width: "100%", boxSizing: "border-box", background: C.inputBg,
                  border: `1px solid ${active ? C.btnAccentBorder : C.inputBorder}`,
                  borderRadius: 0, height: 40, padding: "0 6px", cursor: "pointer",
                  display: "flex", justifyContent: "center", alignItems: "center", gap: 1,
                }}
              >
                {isNegative && (
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.inputText, lineHeight: 1 }}>&minus;</span>
                )}
                <Counter
                  value={Math.abs(numeric)}
                  places={[10, 1, ".", 0.1]}
                  fontSize={14}
                  padding={1}
                  gap={1}
                  horizontalPadding={0}
                  textColor={C.inputText}
                  fontWeight={600}
                  topGradientStyle={{ display: "none" }}
                  bottomGradientStyle={{ display: "none" }}
                />
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { label: "-0.1", delta: -0.1 },
            { label: "-", delta: -1 },
            { label: "+", delta: 1 },
            { label: "+0.1", delta: 0.1 },
          ].map(({ label, delta }) => (
            <button
              key={label}
              type="button"
              onClick={() => adjust(delta)}
              style={{
                width: 30, height: 26, padding: 0, borderRadius: 0,
                border: `1px solid ${C.line}`, background: C.paperSoft,
                color: C.inkSoft, fontWeight: 600, fontSize: 10, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: SANS, lineHeight: 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>
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
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "fixed", inset: 0, zIndex: 29,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 16, boxSizing: "border-box",
                background: "rgba(0,0,0,0.35)",
              }}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: "min(85vw, 280px)", maxWidth: 280, maxHeight: "80vh",
                  display: "flex", flexDirection: "column",
                  color: C.ink,
                  background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0,
                  boxShadow: C.shadowModal,
                }}
              >
                <div style={{ padding: "16px 16px 0 16px", flexShrink: 0 }}>
                  <div style={{
                    fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                    color: C.muted, marginBottom: 9, textTransform: "capitalize",
                  }}>Total R</div>
                  <button
                    type="button"
                    onClick={() => setPartialTarget("main")}
                    style={{
                      width: "100%", boxSizing: "border-box", background: C.inputBg,
                      border: `1px solid ${partialTarget === "main" ? C.btnAccentBorder : C.inputBorder}`,
                      borderRadius: 0, height: 40, padding: "0 12px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: C.inputText, fontFamily: SANS, fontSize: 14, fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    {partialMain}
                  </button>
                  <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[
                        { label: "-0.1", delta: -0.1 },
                        { label: "-", delta: -1 },
                        { label: "+", delta: 1 },
                        { label: "+0.1", delta: 0.1 },
                      ].map(({ label, delta }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => adjustPartial(delta)}
                          style={{
                            width: 30, height: 26, padding: 0, borderRadius: 0,
                            border: `1px solid ${C.line}`, background: C.paperSoft,
                            color: C.inkSoft, fontWeight: 600, fontSize: 10, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: SANS, lineHeight: 1,
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={resetPartial}
                      aria-label="Reset"
                      style={{
                        width: 26, height: 26, padding: 0, borderRadius: 0,
                        border: `1px solid ${C.line}`, background: C.paperSoft,
                        color: C.inkSoft, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 16, flexShrink: 0 }} />
                    <div style={{
                      flex: 1, fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                      color: C.muted, textTransform: "capitalize", textAlign: "left",
                    }}>Partial R</div>
                    <div style={{
                      flex: 1, fontFamily: LABEL_FONT, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                      color: C.muted, textTransform: "capitalize", textAlign: "left",
                    }}>Qty %</div>
                    <div style={{ width: 28, flexShrink: 0 }} />
                  </div>
                </div>
                <div style={{ padding: "0 16px 16px 16px", overflowY: "auto", flex: 1, minHeight: 0 }}>
                  {partialRows.map((row, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 16, flexShrink: 0, fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.muted }}>
                        {idx + 1}.
                      </div>
                      {["a", "b"].map((col) => {
                        const target = `${idx}:${col}`;
                        const active = partialTarget === target;
                        return (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setPartialTarget(target)}
                            style={{
                              flex: 1, boxSizing: "border-box", background: C.inputBg,
                              border: `1px solid ${active ? C.btnAccentBorder : C.inputBorder}`,
                              borderRadius: 0, height: 36, padding: "0 8px", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: C.inputText, fontFamily: SANS, fontSize: 13, fontWeight: 600,
                            }}
                          >
                            {row[col]}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => deletePartialRow(idx)}
                        aria-label="Delete row"
                        style={{
                          width: 28, height: 36, padding: 0, flexShrink: 0, borderRadius: 0,
                          border: `1px solid ${C.line}`, background: "transparent",
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
                        width: "100%", boxSizing: "border-box", background: "transparent",
                        border: `1px dashed ${C.line}`, borderRadius: 0, height: 36, marginTop: 8,
                        color: C.inkSoft, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      + Partial
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
