// src/components/common/PeriodFilterBar.jsx
// Shared "All Time / This Week / This Month / This Year / Custom Range"
// filter used on both the Dashboard and Journal pages. Sticks to the top
// of the scrolling content area (see .main-area in src/styles/*.js) so
// the user can switch periods without scrolling back up, with a bottom
// line separating it from the content that scrolls underneath it.
import React from "react";
import { SANS, PERIODS, useTheme } from "../../theme/tokens.js";
import Chip from "./Chip.jsx";
import DateField from "../DateField.jsx";

export default function PeriodFilterBar({ period, setPeriod, customRange, setCustomRange }) {
  const C = useTheme();
  return (
    <div
      className="period-filter-sticky"
      style={{
        position: "sticky", top: 0, zIndex: 20,
        background: C.bg,
        paddingBottom: 12,
        marginBottom: 14,
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 9 }}>
        {PERIODS.slice(0, 3).map((p) => (
          <Chip key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 9, marginBottom: period === "custom" ? 10 : 0 }}>
        {PERIODS.slice(3).map((p) => (
          <Chip key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
        ))}
        <Chip label="Custom Range" active={period === "custom"} onClick={() => setPeriod("custom")} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
      </div>
      {period === "custom" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
  );
}
