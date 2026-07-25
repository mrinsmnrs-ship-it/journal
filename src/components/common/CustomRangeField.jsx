// src/components/common/CustomRangeField.jsx
// Custom date-range picker khusus untuk PeriodFilterBar. Beda dari
// DateField.jsx (yang bikin 1 popup kalender per input, jadi "Select
// date to Select date" nongol terpisah dari kalender) — di sini "from"
// dan "to" ditaruh JADI SATU baris di dalam popup yang sama, tepat di
// atas kalender, jadi keduanya kelihatan sebagai satu unit.
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SANS, useTheme } from "../../theme/tokens.js";
import { fmtDateDisplay } from "../../utils/date.js";

const CALENDAR_ROWS = 6;
const CALENDAR_CELLS = CALENDAR_ROWS * 7;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n) => String(n).padStart(2, "0");

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export default function CustomRangeField({ from, to, onChangeFrom, onChangeTo, autoOpen = false }) {
  const C = useTheme();
  const [open, setOpen] = useState(autoOpen);
  const [which, setWhich] = useState(from ? "to" : "from"); // sisi mana yang lagi diedit
  const seed = (which === "from" ? from : to) || from || to;
  const initial = seed ? new Date(seed + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [slideDir, setSlideDir] = useState(1);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  function jumpTo(iso) {
    const d = iso ? new Date(iso + "T00:00:00") : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function pickSide(side) {
    setWhich(side);
    jumpTo(side === "from" ? from : to);
  }

  const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length < CALENDAR_CELLS) cells.push(null);

  function selectDay(d) {
    const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
    if (which === "from") {
      onChangeFrom(iso);
      setWhich("to");
      if (!to) jumpTo(iso);
    } else {
      onChangeTo(iso);
      setOpen(false);
    }
  }
  function prevMonth() {
    setSlideDir(-1);
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    setSlideDir(1);
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1);
  }

  const popupContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          onClick={() => setOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed", inset: 0, zIndex: 29,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, boxSizing: "border-box",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              width: "min(85vw, 280px)", maxWidth: 280, color: C.ink,
              background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, padding: 16,
              boxShadow: C.shadowModal,
            }}
          >
            {/* from/to sekarang jadi header di DALAM popup, nempel langsung
                di atas kalender, bukan baris terpisah di luar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.line}`,
            }}>
              <button
                type="button"
                onClick={() => pickSide("from")}
                style={{
                  background: "transparent", border: "none", padding: "2px 0", cursor: "pointer",
                  fontFamily: SANS, fontSize: 14, fontWeight: which === "from" ? 700 : 500,
                  color: which === "from" ? C.ink : C.muted,
                  borderBottom: which === "from" ? `2px solid ${C.ink}` : "2px solid transparent",
                }}
              >
                {from ? fmtDateDisplay(from) : "Select date"}
              </button>
              <span style={{ color: C.muted, fontSize: 13, fontFamily: SANS }}>to</span>
              <button
                type="button"
                onClick={() => pickSide("to")}
                style={{
                  background: "transparent", border: "none", padding: "2px 0", cursor: "pointer",
                  fontFamily: SANS, fontSize: 14, fontWeight: which === "to" ? 700 : 500,
                  color: which === "to" ? C.ink : C.muted,
                  borderBottom: which === "to" ? `2px solid ${C.ink}` : "2px solid transparent",
                }}
              >
                {to ? fmtDateDisplay(to) : "Select date"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <button type="button" onClick={prevMonth} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4, display: "flex" }}>
                <ChevronLeft size={18} />
              </button>
              <div style={{ fontWeight: 700, fontSize: 15, fontFamily: SANS }}>{MONTHS[viewMonth]} {viewYear}</div>
              <button type="button" onClick={nextMonth} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4, display: "flex" }}>
                <ChevronRight size={18} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
              {WEEKDAYS.map((w, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 12, color: C.muted, fontWeight: 600, padding: "4px 0", fontFamily: SANS }}>{w}</div>
              ))}
            </div>
            <div style={{ position: "relative", overflow: "hidden" }}>
              <AnimatePresence initial={false} custom={slideDir} mode="popLayout">
                <motion.div
                  key={`${viewYear}-${viewMonth}`}
                  custom={slideDir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{
                    width: "100%",
                    display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                    gridAutoRows: "1fr", gridTemplateRows: `repeat(${CALENDAR_ROWS}, 1fr)`,
                    gap: 2,
                  }}
                >
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} style={{ aspectRatio: "1" }} />;
                    const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
                    const isFrom = iso === from;
                    const isTo = iso === to;
                    const inRange = from && to && iso > from && iso < to;
                    const isSelected = isFrom || isTo;
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => selectDay(d)}
                        style={{
                          aspectRatio: "1", border: "none", borderRadius: 0, cursor: "pointer",
                          background: isSelected ? C.btnAccent : inRange ? C.line : "transparent",
                          color: isSelected ? C.btnAccentTextActive : C.ink,
                          fontSize: 14, fontFamily: SANS,
                        }}
                      >{d}</button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="no-press"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "transparent", border: "none", padding: 0, margin: 0,
          color: C.muted, fontFamily: SANS, fontSize: 13, lineHeight: 1.3,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        }}
      >
        {from || to
          ? `${from ? fmtDateDisplay(from) : "Select date"} – ${to ? fmtDateDisplay(to) : "Select date"}`
          : "Select date"}
      </button>
      {createPortal(popupContent, document.body)}
    </div>
  );
}
