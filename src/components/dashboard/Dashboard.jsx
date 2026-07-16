// src/components/dashboard/Dashboard.jsx
// Performance dashboard: stat cards, equity curve, R-per-trade bar chart,
// symbol performance, trader scorecard (radar), and trade calendar heatmap.
// Shared between mobile and desktop layouts (styled responsively via CSS).
import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SANS, SERIF, MONO, useTheme } from "../../theme/tokens.js";
import { fmtR } from "../../utils/format.js";
import { parseISO, startOfWeek, startOfMonth, startOfYear, clamp, fmtDateDisplay } from "../../utils/date.js";
import {
  computeEquityCurve, computeDailyR, computeSymbolStats, computeStats,
} from "../../utils/stats.js";
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

const CAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CAL_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const CAL_ROWS = 6;
const CAL_CELLS = CAL_ROWS * 7;
const calPad = (n) => String(n).padStart(2, "0");

// Same slide variants DateField's popup uses when paging between months,
// reused here so the inline calendar animates identically.
const calSlideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

// Month-grid trade calendar, styled like the DateField popup (chevron header,
// weekday row, sliding day grid) but rendered inline in the dashboard flow
// instead of as a portal/overlay. Always lays out a fixed 6-row/42-cell grid
// (same as DateField) so cell size never shifts between months — a 4-week
// February and a 6-week month occupy the same space. Days are colored
// win/loss using the same ink (win) / faint (loss) pair TradeCard uses for
// R numbers in History, rather than a red/green heatmap, and only days that
// actually have trade data get a border/fill — empty days are just a number.
function TradeCalendarMonth({ trades }) {
  const C = useTheme();
  const dailyMap = useMemo(() => computeDailyR(trades), [trades]);

  // Default to the month of the most recent trade so the calendar opens
  // somewhere with data, instead of always the current calendar month.
  const initial = useMemo(() => {
    if (!trades.length) return new Date();
    let latest = parseISO(trades[0].date);
    trades.forEach((t) => {
      const d = parseISO(t.date);
      if (d > latest) latest = d;
    });
    return latest;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [slideDir, setSlideDir] = useState(1);

  const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length < CAL_CELLS) cells.push(null);

  function prevMonth() {
    setSlideDir(-1);
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    setSlideDir(1);
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1);
  }

  const navBtnStyle = { background: "transparent", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4, display: "flex" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button type="button" onClick={prevMonth} style={navBtnStyle} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: C.ink }}>{CAL_MONTHS[viewMonth]} {viewYear}</div>
        <button type="button" onClick={nextMonth} style={navBtnStyle} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 2 }}>
        {CAL_WEEKDAYS.map((w, i) => (
          <div key={i} style={{ textAlign: "center", fontFamily: SANS, fontSize: 11, fontWeight: 600, color: C.muted, padding: "2px 0" }}>{w}</div>
        ))}
      </div>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <AnimatePresence initial={false} custom={slideDir} mode="popLayout">
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            custom={slideDir}
            variants={calSlideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              width: "100%",
              display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
              gridAutoRows: "1fr", gridTemplateRows: `repeat(${CAL_ROWS}, 1fr)`,
              gap: 4,
            }}
          >
            {cells.map((d, i) => {
              if (!d) return <div key={i} style={{ aspectRatio: "1" }} />;
              const iso = `${viewYear}-${calPad(viewMonth + 1)}-${calPad(d)}`;
              const data = dailyMap.get(iso);
              let bg = "transparent";
              let border = "1px solid transparent";
              let textColor = C.inkSoft;
              if (data && data.total > 0) { bg = C.ink; border = `1px solid ${C.ink}`; textColor = C.bg; }
              else if (data && data.total < 0) { bg = C.faint; border = `1px solid ${C.faint}`; textColor = C.ink; }
              else if (data) { bg = C.lineSoft; border = `1px solid ${C.line}`; textColor = C.ink; }
              const title = data
                ? `${fmtDateDisplay(iso)} \u00b7 ${fmtR(data.total)} \u00b7 ${data.count} trade${data.count === 1 ? "" : "s"}`
                : fmtDateDisplay(iso);
              return (
                <div
                  key={i}
                  title={title}
                  style={{
                    aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                    background: bg, border, borderRadius: 0, color: textColor,
                    fontFamily: MONO, fontSize: 12, fontWeight: 600,
                  }}
                >
                  {d}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontFamily: SANS, fontSize: 10.5, color: C.muted }}>
        <div style={{ width: 12, height: 12, borderRadius: 0, background: C.faint, border: `1px solid ${C.faint}` }} />
        <span>Loss</span>
        <div style={{ width: 12, height: 12, borderRadius: 0, background: C.ink, border: `1px solid ${C.ink}`, marginLeft: 10 }} />
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
            display={<>Winrate <AnimatedStat value={winRate} decimals={0} suffix="%" /></>}
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

export default function Dashboard({ trades, period, customRange }) {
  const C = useTheme();

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

          <div>
            <div style={{ padding: "0 4px", marginBottom: 16 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: C.ink }}>Trade Calendar</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 0 }}>Daily P&amp;L</div>
            </div>
            <div style={{ width: "100%", background: C.paperSoftStat, border: `1px solid ${C.line}`, borderRadius: 0, padding: "16px 18px", boxShadow: C.shadowCard }}>
              <TradeCalendarMonth trades={trades} />
            </div>
          </div>

        </>
      )}
    </div>
  );
}
