// src/components/dashboard/Dashboard.jsx
// Performance dashboard: stat cards, equity curve, R-per-trade bar chart,
// symbol performance, trader scorecard (radar), and trade calendar heatmap.
// Shared between mobile and desktop layouts (styled responsively via CSS).
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SANS, SERIF, MONO, useTheme } from "../../theme/tokens.js";
import { fmtR } from "../../utils/format.js";
import { parseISO, startOfWeek, startOfMonth, startOfYear, clamp, tradeYears, fmtDateDisplay } from "../../utils/date.js";
import {
  computeEquityCurve, computeDailyR, computeSymbolStats, computeStats,
} from "../../utils/stats.js";
import Counter from "../../Counter.jsx";
import CountUp from "../../CountUp.jsx";

// ---- Dashboard ----

// Wraps CountUp with the +/- prefix and %/R suffix formatting the stats
// panels need, so the numbers themselves animate (spring, via CountUp)
// whenever the underlying value changes — e.g. switching the period
// filter — instead of just snapping to the new number.
function AnimatedStat({ value, decimals = 0, prefix = "", suffix = "", separator = "" }) {
  const v = Number(value) || 0;
  return (
    <>
      {v > 0 ? prefix : ""}
      <CountUp to={v} decimals={decimals} separator={separator} duration={0.8} />
      {suffix}
    </>
  );
}

// Shared boxed-list style used by Summary, Performance by Symbol, and
// Trader Scorecard so all three read as one consistent visual language
// (a bordered panel of stacked rows) instead of three different chart types.
function BarBox({ children }) {
  const C = useTheme();
  return (
    <div style={{ width: "100%", background: C.paperSoftStat, border: `1px solid ${C.line}`, borderRadius: 0, padding: "6px 10px", boxShadow: C.shadowCard }}>
      {children}
    </div>
  );
}

// One row: label on the left, a filled track in the middle (omitted when
// `percent` isn't given, e.g. a raw count like Total Trades), and the
// display value on the right. `sub` is optional smaller text below the row.
function BarRow({ label, percent, display, isFirst, sub }) {
  const C = useTheme();
  const hasBar = percent !== undefined && percent !== null;

  // No percent bar (e.g. Total Trades, a raw count): keep label and value
  // on the same line, side by side (label left, value right), instead of
  // stacking label above value.
  if (!hasBar) {
    return (
      <div style={{ padding: "12px 4px", borderTop: isFirst ? "none" : `1px solid ${C.lineSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: C.ink, textAlign: "left" }}>
            {label}
          </div>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 12, color: C.ink, flexShrink: 0 }}>
            {display}
          </span>
        </div>
        {sub && (
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 5 }}>
            {sub}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 4px", borderTop: isFirst ? "none" : `1px solid ${C.lineSoft}` }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13, color: C.ink, textAlign: "left" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
        <div style={{ flexGrow: 1, height: 6, background: C.lineSoft, overflow: "hidden" }}>
          {/* Same ink color the Emotion slider uses, but at its "idle" (un-pressed)
              opacity of 0.7 rather than full strength — these bars are static and
              never get pressed, so they should always read as the calmer, un-pressed
              state, not the bold/vivid pressed one. */}
          <div style={{ width: `${clamp(percent, 0, 100)}%`, height: "100%", background: C.ink, opacity: 0.7, transition: "width 0.7s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 12, color: C.ink, minWidth: 44, textAlign: "right", flexShrink: 0 }}>
          {display}
        </span>
      </div>
      {sub && (
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 5 }}>
          {sub}
        </div>
      )}
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

function SymbolPerformanceBars({ trades, filteredTrades }) {
  const C = useTheme();
  // The row set and order come from ALL trades ever logged (not the
  // period filter), so the box always lists every symbol the person has
  // traded and never reorders or resizes when the period changes. Only
  // the numbers per row come from the period-filtered trades — a symbol
  // with no activity in the current period just shows 0.
  const allSymbols = useMemo(() => computeSymbolStats(trades), [trades]);
  const periodStats = useMemo(() => {
    const map = new Map();
    computeSymbolStats(filteredTrades).forEach((s) => map.set(s.symbol, s));
    return map;
  }, [filteredTrades]);

  if (allSymbols.length === 0) return null;

  return (
    <BarBox>
      {allSymbols.map((item, i) => {
        const period = periodStats.get(item.symbol);
        const totalR = period ? period.totalR : 0;
        const winRate = period ? period.winRate : 0;
        const count = period ? period.count : 0;
        return (
          <BarRow
            key={item.symbol}
            isFirst={i === 0}
            label={item.symbol}
            display={<AnimatedStat value={winRate} decimals={0} suffix="%" />}
            sub={
              <>
                <span style={{ color: totalR > 0 ? C.ink : C.faint, fontWeight: 700 }}>
                  <AnimatedStat value={totalR} decimals={2} prefix="+" suffix="R" />
                </span>
                {" "}&middot; {count} trade{count === 1 ? "" : "s"}
              </>
            }
          />
        );
      })}
    </BarBox>
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
        background: C.inputBg, border: `1px solid ${C.line}`, borderRadius: 0,
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

export default function Dashboard({ trades, period, customRange }) {
  const C = useTheme();
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

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      {filteredTrades.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 16, marginBottom: 28 }}>No trades logged in this period.</div>
      ) : (
        <>
          <div style={{ marginTop: 0, marginBottom: 16, padding: "0 4px" }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Summary</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>
              {filteredTrades.length} trade{filteredTrades.length === 1 ? "" : "s"} in this period
            </div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <BarBox>
              <BarRow isFirst label="Total Trades" display={<AnimatedStat value={stats.total} decimals={0} />} />
              <BarRow label="Total R" display={<AnimatedStat value={stats.totalR} decimals={2} prefix="+" suffix="R" />} />
              <BarRow label="Win Rate" display={<AnimatedStat value={stats.winRate} decimals={1} suffix="%" />} />
              <BarRow label="Expectancy" display={<AnimatedStat value={stats.expectancy} decimals={2} prefix="+" suffix="R" />} />
              <BarRow label="Avg Win" display={<AnimatedStat value={stats.avgWin} decimals={2} prefix="+" suffix="R" />} />
              <BarRow label="Avg Loss" display={<AnimatedStat value={stats.avgLoss} decimals={2} suffix="R" />} />
            </BarBox>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Trader Scorecard</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Score 0–100 per dimension</div>
            </div>
            <BarBox>
              {stats.scorecard
                .filter((s) => s.metric !== "Win Rate")
                .map((s, i) => (
                  <BarRow key={s.metric} isFirst={i === 0} label={s.metric} percent={s.value} display={<AnimatedStat value={s.value} decimals={0} suffix="%" />} />
                ))}
            </BarBox>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Performance by Symbol</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Total R per symbol, sorted by most profitable</div>
            </div>
            <SymbolPerformanceBars trades={trades} filteredTrades={filteredTrades} />
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

        </>
      )}
    </div>
  );
}
