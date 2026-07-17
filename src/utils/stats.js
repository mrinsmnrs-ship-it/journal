// ============================================================================
// utils/stats.js
// -----------------------------------------------------------------------------
// Semua kalkulasi statistik trading dari daftar trade mentah:
// - computeEquityCurve  -> data buat grafik equity curve (kumulatif R)
// - computeDailyR       -> total R per tanggal, buat calendar heatmap
// - computeSymbolStats  -> ringkasan performa per simbol
// - computeStats        -> ringkasan besar dashboard (win rate, expectancy,
//                          scorecard 5 metrik, breakdown by rules, dst)
// ============================================================================
import { clamp, parseISO } from "../utils/date.js";
import { POSITIVE_EMOTIONS, NEGATIVE_EMOTIONS } from "../theme/tokens.js";

export function computeEquityCurve(trades) {
  const sorted = [...trades].sort((a, b) => parseISO(a.date) - parseISO(b.date));
  let cum = 0;
  return sorted.map((t, i) => {
    cum += t.rActual;
    return { index: i + 1, date: t.date, symbol: t.symbol, cum: Math.round(cum * 100) / 100 };
  });
}
export function computeDailyR(trades) {
  const map = new Map();
  trades.forEach((t) => {
    const cur = map.get(t.date) || { total: 0, count: 0 };
    cur.total += t.rActual;
    cur.count += 1;
    map.set(t.date, cur);
  });
  return map;
}
export function computeSymbolStats(trades) {
  const map = new Map();
  trades.forEach((t) => {
    const sym = t.symbol || "\u2014";
    const cur = map.get(sym) || { symbol: sym, totalR: 0, count: 0, wins: 0, losses: 0 };
    cur.totalR += t.rActual;
    cur.count += 1;
    if (t.rActual > 0) cur.wins += 1;
    if (t.rActual < 0) cur.losses += 1;
    map.set(sym, cur);
  });
  return Array.from(map.values())
    .map((s) => ({ ...s, totalR: Math.round(s.totalR * 100) / 100, winRate: (s.wins + s.losses) ? (s.wins / (s.wins + s.losses)) * 100 : 0 }))
    .sort((a, b) => b.totalR - a.totalR);
}

// ---- Stats ----
export function computeStats(trades) {
  const total = trades.length;
  if (total === 0) {
    return {
      total: 0, winRate: 0, totalR: 0, expectancy: 0, avgWin: 0, avgLoss: 0,
      scorecard: ["Profitability", "Discipline", "Emotional Control", "Risk Consistency", "Win Rate"].map((m) => ({ metric: m, value: 0 })),
      byRules: { Yes: { count: 0, total: 0 }, Partial: { count: 0, total: 0 }, No: { count: 0, total: 0 } },
    };
  }
  const wins = trades.filter((t) => t.rActual > 0);
  const losses = trades.filter((t) => t.rActual < 0);
  const totalR = trades.reduce((s, t) => s + t.rActual, 0);
  // Win rate cuma dihitung dari trade yang menang/kalah -- BE (rActual === 0)
  // dikeluarkan dari pembagi supaya tidak ikut menurunkan persentase
  // seolah-olah dihitung kalah.
  const decisiveCount = wins.length + losses.length;
  const winRate = decisiveCount ? (wins.length / decisiveCount) * 100 : 0;
  const expectancy = totalR / total;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.rActual, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.rActual, 0) / losses.length : 0;
  const disciplined = trades.filter((t) => t.rules);
  const disciplineScore = disciplined.length
      ? disciplined.reduce((s, t) => s + (t.rules === "Yes" ? 100 : t.rules === "Partial" ? 50 : 0), 0) / disciplined.length
    : 0;
  const withEmotions = trades.filter((t) => !!t.emotion);
const emotionalScore = withEmotions.length
  ? withEmotions.reduce((s, t) => {
      if (POSITIVE_EMOTIONS.has(t.emotion)) return s + 100;
      if (NEGATIVE_EMOTIONS.has(t.emotion)) return s + 0;
      return s + 50;
    }, 0) / withEmotions.length
  : 0;
  const risks = trades.map((t) => t.riskPct).filter((r) => r !== null && r !== undefined && !isNaN(r));
  let riskConsistency = 100;
  if (risks.length >= 2) {
    const mean = risks.reduce((s, r) => s + r, 0) / risks.length;
    const variance = risks.reduce((s, r) => s + (r - mean) ** 2, 0) / risks.length;
    const cv = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 0;
    riskConsistency = clamp(100 - cv * 100, 0, 100);
  }
  const profitability = clamp(((expectancy + 2) / 4) * 100, 0, 100);
  const byRules = { Yes: { count: 0, total: 0 }, Partial: { count: 0, total: 0 }, No: { count: 0, total: 0 } };
  trades.forEach((t) => {
    if (t.rules && byRules[t.rules]) {
      byRules[t.rules].count += 1;
      byRules[t.rules].total += t.rActual;
    }
  });
  return {
    total, winRate, totalR, expectancy, avgWin, avgLoss,
    scorecard: [
      { metric: "Profitability", value: Math.round(profitability) },
      { metric: "Discipline", value: Math.round(disciplineScore) },
      { metric: "Emotional Control", value: Math.round(emotionalScore) },
      { metric: "Risk Consistency", value: Math.round(riskConsistency) },
      { metric: "Win Rate", value: Math.round(winRate) },
    ],
    byRules,
    disciplineScore, emotionalScore, riskConsistency,
  };
}
