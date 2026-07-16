// src/components/JournalList.jsx
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { SERIF, SANS, useTheme } from "../theme/tokens.js";
import { fmtR } from "../utils/format.js";
import { parseISO, startOfWeek, startOfMonth, startOfYear } from "../utils/date.js";
import TradeCard from "./TradeCard.jsx";

export default function JournalList({ trades, onDelete, onGoLog, period, customRange }) {
  const C = useTheme();
  const [confirmId, setConfirmId] = useState(null);
  const confirmTrade = trades.find((t) => t.id === confirmId) || null;

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

  // Kunci scroll di belakang popup delete selama dia terbuka — sama seperti
  // popup kalender. Keluarnya cuma lewat "No" / "Yes, Delete" atau klik di
  // luar kartu (overlay).
  useEffect(() => {
    if (!confirmTrade) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [confirmTrade]);

  if (trades.length === 0) {
    return (
      <div style={{ marginTop: 30, textAlign: "center", color: C.muted }}>
        <div style={{ fontSize: 16, marginBottom: 16, fontFamily: SANS }}>No trades logged yet.</div>
        <button onClick={onGoLog} style={{
          display: "inline-flex", alignItems: "center", gap: 8, background: "transparent",
          border: `1px dashed ${C.line}`, color: C.inkSoft, borderRadius: 0, padding: "12px 20px",
          fontFamily: SANS, fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}><Plus size={16} /> Log your first trade</button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      {filteredTrades.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 16, marginBottom: 16 }}>No trades logged in this period.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: "100%" }}>
          {filteredTrades.map((t) => (
            <TradeCard key={t.id} t={t} onDelete={() => setConfirmId(t.id)} />
          ))}
        </div>
      )}
      <AnimatePresence>
        {confirmTrade && (
          <motion.div
            key="delete-confirm-overlay"
            onClick={() => setConfirmId(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "fixed", inset: 0, zIndex: 39,
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
                width: "min(360px, calc(100vw - 48px))",
                background: C.paper, border: `1px solid ${C.line}`, borderRadius: 0, padding: 24,
                boxShadow: C.shadowModal,
              }}
            >
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, marginBottom: 9, letterSpacing: "-0.01em", color: C.ink }}>Delete this trade?</div>
              <div style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.5, marginBottom: 22 }}>
                {confirmTrade.symbol} &middot; {confirmTrade.date} &middot; {fmtR(confirmTrade.rActual)} will be permanently removed.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirmId(null)}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 0, border: `1px solid ${C.line}`,
                    background: C.paperSoft, color: C.ink, fontWeight: 700, fontSize: 15.5, cursor: "pointer",
                  }}
                >No</button>
                <button
                  onClick={() => { onDelete(confirmTrade.id); setConfirmId(null); }}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 0, border: "none",
                    background: C.popupDangerRed, color: "#FFFFFF", fontWeight: 700, fontSize: 15.5, cursor: "pointer",
                  }}
                >Yes, Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
                    }
