// src/components/dashboard/Dashboard.jsx
// Performance dashboard: stat cards, equity curve, R-per-trade bar chart,
// symbol performance, trader scorecard (radar), and trade calendar heatmap.
// Shared between mobile and desktop layouts (styled responsively via CSS).
import React, { useState, useMemo, useEffect } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SANS, SERIF, MONO, PERIODS, useTheme } from "../../theme/tokens.js";
import { fmtR } from "../../utils/format.js";
import { parseISO, startOfWeek, startOfMonth, startOfYear, clamp, tradeYears, fmtDateDisplay } from "../../utils/date.js";
import {
  computeEquityCurve, computeDailyR, computeSymbolStats, computeStats,
} from "../../utils/stats.js";
import Chip from "../common/Chip.jsx";
import SectionLabel from "../common/SectionLabel.jsx";
import DateField from "../DateField.jsx";
import Counter from "../../Counter.jsx";

// ---- Dashboard ----
function ScorecardTick({ x, y, cx, cy, payload, textAnchor }) {
  const C = useTheme();
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const push = 12;
  const nx = x + (dx / dist) * push;
  const ny = y + (dy / dist) * push;
  const words = String(payload.value).split(" ");
  return (
    <text x={nx} y={ny} textAnchor={textAnchor} fontFamily={SANS} fontSize={13} fontWeight={700} fill={C.inkSoft}>
      {words.map((w, i) => (
        <tspan key={i} x={nx} dy={i === 0 ? (words.length > 1 ? -6 : 4) : 14}>{w}</tspan>
      ))}
    </text>
  );
}
function riskConsistencyLabel(score) {
  if (score >= 75) return "Stabil";
  if (score >= 50) return "Sedang";
  return "Tidak Stabil";
}
function StatCard({ label, value, color }) {
  const C = useTheme();
  return (
    <div style={{ background: C.paperSoftStat, border: `1px solid ${C.line}`, borderRadius: 0, padding: "13px 15px", boxShadow: C.shadowCard }}>
      <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", color: C.muted, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: SANS, fontSize: 19, fontWeight: 700, color: C.ink }}>{value}</div>
    </div>
  );
}
function EquityCurve({ trades }) {
  const C = useTheme();
  const data = useMemo(() => computeEquityCurve(trades), [trades]);
  const final = data.length ? data[data.length - 1].cum : 0;
  const color = final >= 0 ? C.sage : C.rustRed;
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.lineSoft} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="index" tick={{ fontFamily: SANS, fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
          <YAxis tick={{ fontFamily: MONO, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, fontFamily: SANS, fontSize: 12 }}
            labelFormatter={(v, payload) => (payload && payload[0] ? `${payload[0].payload.symbol} \u00b7 ${fmtDateDisplay(payload[0].payload.date)}` : v)}
            formatter={(value) => [fmtR(value), "Cumulative R"]}
            cursor={{ stroke: C.faint, strokeWidth: 1 }}
          />
          <ReferenceLine y={0} stroke={C.line} />
          <Area type="monotone" dataKey="cum" stroke={color} strokeWidth={2} fill="url(#equityFill)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TradeRTooltip({ active, payload }) {
  const C = useTheme();
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const color = d.r >= 0 ? C.sage : C.rustRed;
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, padding: "9px 12px", fontFamily: SANS, fontSize: 12, boxShadow: C.shadowPopover }}>
      <div style={{ color: C.muted, marginBottom: 3 }}>{d.symbol} &middot; {fmtDateDisplay(d.date)}</div>
      <div style={{ color, fontWeight: 700, fontSize: 13 }}>{fmtR(d.r)}</div>
    </div>
  );
}
function TradeRBarChart({ trades }) {
  const C = useTheme();
  const data = useMemo(() => {
    const sorted = [...trades].sort((a, b) => parseISO(a.date) - parseISO(b.date));
    return sorted.map((t, i) => ({ index: i + 1, date: t.date, symbol: t.symbol, r: t.rActual }));
  }, [trades]);
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={C.lineSoft} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="index" tick={{ fontFamily: SANS, fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
          <YAxis tick={{ fontFamily: MONO, fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<TradeRTooltip />} cursor={{ fill: C.line, opacity: 0.18 }} />
          <ReferenceLine y={0} stroke={C.line} />
          <Bar dataKey="r" radius={0}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.r >= 0 ? C.sage : C.rustRed} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CalendarHeatmap({ trades, year }) {
  const C = useTheme();
  const dailyMap = useMemo(
    () => computeDailyR(trades.filter((t) => parseISO(t.date).getFullYear() === year)),
    [trades, year]
  );

  const weeks = useMemo(() => {
    const start = new Date(year, 0, 1);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    const end = new Date(year, 11, 31);
    const gridEnd = new Date(end);
    gridEnd.setDate(end.getDate() + (6 - end.getDay()));

    const cols = [];
    let cur = new Date(gridStart);
    while (cur <= gridEnd) {
      const col = [];
      for (let i = 0; i < 7; i++) {
        const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        col.push({ date: new Date(cur), iso, inYear: cur.getFullYear() === year });
        cur.setDate(cur.getDate() + 1);
      }
      cols.push(col);
    }
    return cols;
  }, [year]);

  const maxAbs = useMemo(() => {
    let m = 0;
    dailyMap.forEach((v) => { m = Math.max(m, Math.abs(v.total)); });
    return m || 1;
  }, [dailyMap]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    weeks.forEach((col, i) => {
      const first = col.find((d) => d.inYear);
      if (first && first.date.getDate() <= 7 && first.date.getMonth() !== lastMonth) {
        labels.push({ index: i, label: first.date.toLocaleString("en-US", { month: "short" }) });
        lastMonth = first.date.getMonth();
      }
    });
    return labels;
  }, [weeks]);

  const cell = 11, gap = 3;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <div style={{ position: "relative", height: 14, marginBottom: 4, marginLeft: 22 }}>
        {monthLabels.map((m) => (
          <div key={m.index} style={{ position: "absolute", left: m.index * (cell + gap), fontFamily: SANS, fontSize: 10, color: C.muted }}>{m.label}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap }}>
        <div style={{ display: "flex", flexDirection: "column", gap, marginRight: 4 }}>
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
            <div key={i} style={{ width: 18, height: cell, fontFamily: SANS, fontSize: 9, color: C.muted, lineHeight: `${cell}px` }}>{d}</div>
          ))}
        </div>
        {weeks.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap }}>
            {col.map((d, di) => {
              const data = dailyMap.get(d.iso);
              let bg = C.lineSoft;
              let opacity = d.inYear ? 0.45 : 0;
              if (d.inYear && data) {
                const intensity = clamp(Math.abs(data.total) / maxAbs, 0.3, 1);
                bg = data.total > 0 ? C.sage : data.total < 0 ? C.rustRed : C.lineSoft;
                opacity = data.total === 0 ? 0.5 : intensity;
              }
              const title = data
                ? `${fmtDateDisplay(d.iso)} \u00b7 ${fmtR(data.total)} \u00b7 ${data.count} trade${data.count === 1 ? "" : "s"}`
                : fmtDateDisplay(d.iso);
              return (
                <div
                  key={di}
                  title={title}
                  style={{ width: cell, height: cell, borderRadius: 0, background: bg, opacity, border: `1px solid ${C.line}` }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontFamily: SANS, fontSize: 10.5, color: C.muted }}>
        <span>Loss</span>
        {[1, 0.7, 0.4].map((o) => (
          <div key={`l${o}`} style={{ width: cell, height: cell, borderRadius: 0, background: C.rustRed, opacity: o, border: `1px solid ${C.line}` }} />
        ))}
        <div style={{ width: cell, height: cell, borderRadius: 0, background: C.lineSoft, opacity: 0.45, border: `1px solid ${C.line}` }} />
        {[0.4, 0.7, 1].map((o) => (
          <div key={`w${o}`} style={{ width: cell, height: cell, borderRadius: 0, background: C.sage, opacity: o, border: `1px solid ${C.line}` }} />
        ))}
        <span>Win</span>
      </div>
    </div>
  );
}

function SymbolTooltip({ active, payload }) {
  const C = useTheme();
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const color = d.totalR >= 0 ? C.sage : C.rustRed;
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, padding: "9px 12px", fontFamily: SANS, fontSize: 12, boxShadow: C.shadowPopover }}>
      <div style={{ color: C.ink, fontWeight: 700, marginBottom: 3 }}>{d.symbol}</div>
      <div style={{ color, fontWeight: 700, fontSize: 13 }}>{fmtR(d.totalR)}</div>
      <div style={{ color: C.muted, marginTop: 3 }}>{d.winRate.toFixed(0)}% win rate &middot; {d.count} trade{d.count === 1 ? "" : "s"}</div>
    </div>
  );
}
function SymbolPerformanceChart({ trades }) {
  const C = useTheme();
  const data = useMemo(() => computeSymbolStats(trades), [trades]);
  const barHeight = 34;
  const chartHeight = Math.max(120, data.length * barHeight + 20);
  return (
    <div style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={C.lineSoft} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontFamily: MONO, fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.line }} tickLine={false} />
          <YAxis
            type="category" dataKey="symbol" width={70}
            tick={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, fill: C.ink }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<SymbolTooltip />} cursor={{ fill: C.line, opacity: 0.18 }} />
          <ReferenceLine x={0} stroke={C.line} />
          <Bar dataKey="totalR" radius={0} barSize={18}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.totalR >= 0 ? C.sage : C.rustRed} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function YearStepper({ year, years, onChange }) {
  const C = useTheme();
  const idx = years.indexOf(year);
  const canUp = idx > 0; // years sorted descending, so index-1 = newer year
  const canDown = idx !== -1 && idx < years.length - 1;
  const stepHeight = 42;

  const goUp = () => { if (canUp) onChange(years[idx - 1]); };
  const goDown = () => { if (canDown) onChange(years[idx + 1]); };

  const btnStyle = (enabled) => ({
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    background: C.paperSoft, border: "none", padding: 0,
    color: enabled ? C.ink : C.faint, cursor: enabled ? "pointer" : "default",
  });

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: stepHeight, minWidth: 90, padding: "0 14px",
        background: C.inputBg, border: `1px solid ${C.btnAccentBorder}`, borderRadius: 0,
      }}>
        <Counter
          value={year}
          places={[1000, 100, 10, 1]}
          fontSize={16}
          padding={2}
          gap={1}
          horizontalPadding={0}
          textColor={C.inputText}
          fontWeight={700}
          topGradientStyle={{ display: "none" }}
          bottomGradientStyle={{ display: "none" }}
        />
      </div>
      <div style={{
        display: "flex", flexDirection: "column", height: stepHeight, width: 32,
        borderRadius: 0, overflow: "hidden", border: `1px solid ${C.line}`,
      }}>
        <button type="button" onClick={goUp} disabled={!canUp} style={{ ...btnStyle(canUp), borderBottom: `1px solid ${C.line}` }}>
          <ChevronUp size={14} strokeWidth={2.5} />
        </button>
        <button type="button" onClick={goDown} disabled={!canDown} style={btnStyle(canDown)}>
          <ChevronDown size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function Dashboard({ trades }) {
  const C = useTheme();
  const [period, setPeriod] = useState("all");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const availableYears = useMemo(() => tradeYears(trades), [trades]);
  const [heatmapYear, setHeatmapYear] = useState(() => availableYears[0] || new Date().getFullYear());

  useEffect(() => {
    if (availableYears.length && !availableYears.includes(heatmapYear)) {
      setHeatmapYear(availableYears[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableYears]);

  const filteredTrades = useMemo(() => {
    if (period === "all") return trades;
    if (period === "week") return trades.filter((t) => parseISO(t.date) >= startOfWeek(new Date()));
    if (period === "month") return trades.filter((t) => parseISO(t.date) >= startOfMonth(new Date()));
    if (period === "year") return trades.filter((t) => parseISO(t.date) >= startOfYear(new Date()));
    if (period === "custom" && customRange.from && customRange.to) {
      const from = parseISO(customRange.from);
      const to = parseISO(customRange.to);
      to.setHours(23, 59, 59, 999);
      return trades.filter((t) => { const d = parseISO(t.date); return d >= from && d <= to; });
    }
    return trades;
  }, [trades, period, customRange]);
  const stats = useMemo(() => computeStats(filteredTrades), [filteredTrades]);

  if (trades.length === 0) {
    return <div style={{ marginTop: 30, color: C.muted, fontSize: 16 }}>Log a trade to see your performance dashboard.</div>;
  }

  // Only one chart's tooltip should be visible at a time. Recharts keeps its
  // hover/tap state internally per-chart, so tapping chart B doesn't close
  // chart A's tooltip on its own. We force-remount every OTHER chart whenever
  // a new one is tapped, which resets its internal tooltip state to closed.
  const [activeChart, setActiveChart] = useState(null);
  const [chartGen, setChartGen] = useState(0);
  const activateChart = (id) => {
    setActiveChart((prev) => {
      if (prev !== id) setChartGen((g) => g + 1);
      return id;
    });
  };
  const chartKey = (id) => (activeChart === id ? `${id}-active` : `${id}-idle-${chartGen}`);

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 9 }}>
        {PERIODS.slice(0, 3).map((p) => (
          <Chip key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 9, marginBottom: 10 }}>
        {PERIODS.slice(3).map((p) => (
          <Chip key={p.key} label={p.label} active={period === p.key} onClick={() => setPeriod(p.key)} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
        ))}
        <Chip label="Custom Range" active={period === "custom"} onClick={() => setPeriod("custom")} activeColor={C.clayOnWhite} activeBg={C.clayWash} />
      </div>
      {period === "custom" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <DateField value={customRange.from} onChange={(d) => setCustomRange((r) => ({ ...r, from: d }))} />
          </div>
          <span style={{ color: C.muted, fontSize: 13, fontFamily: SANS }}>to</span>
          <div style={{ flex: 1, minWidth: 120 }}>
            <DateField value={customRange.to} onChange={(d) => setCustomRange((r) => ({ ...r, to: d }))} align="right" />
          </div>
        </div>
      )}
      {filteredTrades.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 16, marginBottom: 28 }}>No trades logged in this period.</div>
      ) : (
        <>
          <div style={{ marginTop: period === "custom" ? 0 : 14 }}>
            <SectionLabel text={`Summary \u00b7 ${filteredTrades.length} trade${filteredTrades.length === 1 ? "" : "s"}`} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            <StatCard label="Total Trades" value={stats.total} />
            <StatCard label="Adherence" value={`${Math.round(stats.disciplineScore)}%`} color={C.clayDeep} />
            <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={C.sage} />
            <StatCard label="Risk Consistency" value={riskConsistencyLabel(stats.riskConsistency)} />
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>R per Trade</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Green = win, red = loss</div>
            </div>
            <div onPointerDown={() => activateChart("rbar")}>
              <TradeRBarChart key={chartKey("rbar")} trades={filteredTrades} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Performance by Symbol</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Total R per simbol, diurutkan dari yang paling profitable</div>
            </div>
            <div onPointerDown={() => activateChart("symbol")}>
              <SymbolPerformanceChart key={chartKey("symbol")} trades={filteredTrades} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
  <div style={{ padding: "0 4px", marginBottom: 16 }}>
    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Trader Scorecard</div>
    <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Score 0–100 per dimension</div>
  </div>
  <div style={{ width: "100%", height: 320, overflow: "visible" }}>
    <ResponsiveContainer>
      <RadarChart data={stats.scorecard} outerRadius="72%" margin={{ top: 4, right: 32, bottom: 4, left: 46 }}>
                  <PolarGrid stroke={C.line} />
                  <PolarAngleAxis dataKey="metric" tick={<ScorecardTick />} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke={C.btnAccent} fill={C.btnAccent} fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: C.btnAccent, fillOpacity: 1, stroke: "none" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {availableYears.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 4px", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Trade Calendar</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Daily P&amp;L for {heatmapYear}</div>
                </div>
                <YearStepper year={heatmapYear} years={availableYears} onChange={setHeatmapYear} />
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 0, padding: "14px 18px", boxShadow: C.shadowCard }}>
                <CalendarHeatmap trades={trades} year={heatmapYear} />
              </div>
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            <SectionLabel text="By Rules Compliance" />
            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 0, padding: "4px 18px", boxShadow: C.shadowCard }}>
  {["Yes", "Partial", "No"].map((r, i) => {
    const d = stats.byRules[r];
    const avg = d.count ? d.total / d.count : 0;
    return (
      <div key={r} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderTop: i > 0 ? `1px solid ${C.lineSoft}` : "none" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, minWidth: 64 }}>{r}</div>
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, textAlign: "right" }}>
          {d.count} trade &middot; total {fmtR(d.total)} &middot; avg {avg.toFixed(2)}R
        </div>
      </div>
    );
  })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
