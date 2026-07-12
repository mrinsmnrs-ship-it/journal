// src/components/layout/PerfMarquee.jsx
// Scrolling stats summary shown below the mobile topbar only (hidden on
// desktop via .perf-marquee CSS, see src/styles/mobile.js).
import React from "react";
import { SANS, useTheme } from "../../theme/tokens.js";
import { fmtR } from "../../utils/format.js";

export default function PerfMarquee({ stats }) {
  const C = useTheme();
  return (
    <div className="perf-marquee">
      <div className="perf-marquee-track" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color: C.inkSoft, lineHeight: 1 }}>
        {[0, 1].map((rep) => (
          <span key={rep} style={{ display: "inline-flex", alignItems: "center" }}>
            <span style={{ padding: "0 14px" }}>Total Trades {stats.total}</span>
            <span style={{ color: C.line }}>&middot;</span>
            <span style={{ padding: "0 14px" }}>Win Rate {Math.round(stats.winRate)}%</span>
            <span style={{ color: C.line }}>&middot;</span>
            <span style={{ padding: "0 14px" }}>Total R {fmtR(stats.totalR)}</span>
            <span style={{ color: C.line }}>&middot;</span>
            <span style={{ padding: "0 14px" }}>Expectancy {fmtR(stats.expectancy)}</span>
            <span style={{ color: C.line }}>&middot;</span>
            <span style={{ padding: "0 14px" }}>Avg Win {fmtR(stats.avgWin)}</span>
            <span style={{ color: C.line }}>&middot;</span>
            <span style={{ padding: "0 14px" }}>Avg Loss {fmtR(stats.avgLoss)}</span>
            <span style={{ color: C.line }}>&middot;</span>
            <span style={{ padding: "0 14px" }}>Discipline {Math.round(stats.disciplineScore)}%</span>
            <span style={{ color: C.line }}>&middot;</span>
            <span style={{ padding: "0 14px" }}>Risk Consistency {Math.round(stats.riskConsistency)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
