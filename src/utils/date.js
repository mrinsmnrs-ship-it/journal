// ============================================================================
// utils/date.js
// -----------------------------------------------------------------------------
// Helper murni untuk tanggal: format ISO <-> tampilan, cari awal minggu/
// bulan/tahun, daftar tahun yang punya trade, dan clamp angka ke rentang.
// Tidak ada satupun yang bergantung ke React atau state — aman dipakai
// dari mana saja tanpa efek samping.
// ============================================================================

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtDateDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}
export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function parseISO(iso) {
  return new Date(iso + "T00:00:00");
}
export function startOfWeek(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
export function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
export function startOfYear(d) { return new Date(d.getFullYear(), 0, 1); }
export function tradeYears(trades) {
  const years = new Set(trades.map((t) => parseISO(t.date).getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}
