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

  const adjust = (delta) => {
    const current = Number(form[activeField]) || 0;
    const next = Math.round((current + delta) * 100) / 100;
    updateForm(activeField, String(next));
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
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-start" }}>
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
    </div>
  );
}
