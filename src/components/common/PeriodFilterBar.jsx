// src/components/common/PeriodFilterBar.jsx
// Shared "All Time / This Week / This Month / This Year / Custom Range"
// filter used on both the Dashboard and Journal pages. Rendered as a
// real, non-scrolling flex sibling right below the perf marquee (see
// .period-filter-header in src/styles/*.js and how it's placed in
// App.jsx) — same idea as the marquee/topbar — so it's always visible
// above the scrolling content, with a bottom line separating the two.
import React from "react";
import { SANS, PERIODS, useTheme } from "../../theme/tokens.js";
import Chip from "./Chip.jsx";
import DateField from "../DateField.jsx";

export default function PeriodFilterBar({ period, setPeriod, customRange, setCustomRange }) {
  const C = useTheme();
  return (
    <div className="period-filter-header" style={{ background: C.bg, borderBottom: `1px solid ${C.line}` }}>
      <div className="period-filter-header-inner">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 9 }}>
          {PERIODS.slice(0, 3).map((p) => (
            <Chip key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 9 }}>
          {PERIODS.slice(3).map((p) => (
            <Chip key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
          ))}
          <Chip label="Custom Range" active={period === "custom"} onClick={() => setPeriod("custom")} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
        </div>
        {period === "custom" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <DateField value={customRange.from} onChange={(d) => setCustomRange((r) => ({ ...r, from: d }))} />
            </div>
            <span style={{ color: C.muted, fontSize: 13, fontFamily: SANS }}>to</span>
            <div style={{ flex: 1, minWidth: 120 }}>
              <DateField value={customRange.to} onChange={(d) => setCustomRange((r) => ({ ...r, to: d }))} align="right" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
