// src/components/common/PeriodFilterBar.jsx
// Shared "All / W / M / Y / Custom" filter used on both the Dashboard
// and Journal (History) pages. Rendered as a real, non-scrolling flex
// sibling right below the perf marquee (see .period-filter-header in
// src/styles/*.js and how it's placed in App.jsx) — same idea as the
// marquee/topbar — so it's always visible above the scrolling content,
// with a bottom line separating the two.
//
// Style: no borders, no pill/button chrome — plain clickable text in a
// single row (same "no box, just underline/plain" language as the Log
// Trade page), active item picked out by color+weight, press feedback
// comes from the normal global button:active scale in base.js.
import React from "react";
import { SANS, PERIODS, useTheme } from "../../theme/tokens.js";
import DateField from "../DateField.jsx";

function PeriodItem({ label, active, onClick, C }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent", border: "none", padding: 0, margin: 0,
        fontFamily: SANS, fontSize: 14,
        fontWeight: active ? 700 : 600,
        color: active ? C.clayOnWhite : C.muted,
        cursor: "pointer",
        transition: "color .15s ease",
      }}
    >
      {label}
    </button>
  );
}

export default function PeriodFilterBar({ period, setPeriod, customRange, setCustomRange }) {
  const C = useTheme();
  return (
    <div className="period-filter-header" style={{ background: C.bg, borderBottom: `1px solid ${C.line}` }}>
      <div className="period-filter-header-inner">
        <div className="period-filter-row">
          {PERIODS.map((p) => (
            <PeriodItem key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} C={C} />
          ))}
          <PeriodItem label="Custom" active={period === "custom"} onClick={() => setPeriod("custom")} C={C} />
          {period === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <DateField value={customRange.from} onChange={(d) => setCustomRange((r) => ({ ...r, from: d }))} autoOpen />
              <span style={{ color: C.muted, fontSize: 13, fontFamily: SANS, flexShrink: 0 }}>to</span>
              <DateField value={customRange.to} onChange={(d) => setCustomRange((r) => ({ ...r, to: d }))} align="right" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
