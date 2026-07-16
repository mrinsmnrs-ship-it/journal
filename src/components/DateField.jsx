// src/components/DateField.jsx
// Custom date input dengan kalender popup (portal ke <body>), dipakai di
// LogTradeForm, JournalList, dan Dashboard (custom range picker).
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SANS, useTheme } from "../theme/tokens.js";
import { fmtDateDisplay } from "../utils/date.js";
import "./DateField.css";

const CALENDAR_ROWS = 6;
const CALENDAR_CELLS = CALENDAR_ROWS * 7;

const calendarSlideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export default function DateField({ value, onChange, align = "left" }) {
  const C = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const initial = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [slideDir, setSlideDir] = useState(1);
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
  const pad = (n) => String(n).padStart(2, "0");

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);
  const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length < CALENDAR_CELLS) cells.push(null);

  function selectDay(d) {
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
    setOpen(false);
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
            }}>
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
                variants={calendarSlideVariants}
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
                  const isSelected = iso === value;
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => selectDay(d)}
                      style={{
                        aspectRatio: "1", border: "none", borderRadius: 0, cursor: "pointer",
                        background: isSelected ? C.btnAccent : "transparent",
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
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="no-press"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", boxSizing: "border-box", background: C.inputBg, border: `1px solid ${C.inputBorder}`,
          borderRadius: 0, height: 40, padding: "0 16px", color: C.inputText, fontFamily: SANS, fontSize: 16,
          textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center",
          boxShadow: "none",
        }}
      >
        {value ? fmtDateDisplay(value) : "Select date"}
      </button>
      {createPortal(popupContent, document.body)}
    </div>
  );
}
