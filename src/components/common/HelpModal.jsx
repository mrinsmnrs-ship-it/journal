// src/components/common/HelpModal.jsx
// Modal "Petunjuk" (panduan singkat pakai app) — dibuka dari menu atas
// (HamburgerMenu). Pola modal (portal ke <body>, backdrop gelap, kartu
// yang muncul dengan scale+blur) sama seperti ImageLightbox.jsx supaya
// konsisten dengan modal lain di app ini.
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useTheme, SANS } from "../../theme/tokens.js";
import LightbulbIcon from "./LightbulbIcon.jsx";

const STEPS = [
  {
    title: "Log Trade",
    body: "Record every trade: symbol, direction (buy/sell), entry reason, risk, and R result. The more complete the data, the more accurate your Dashboard statistics.",
  },
  {
    title: "History",
    body: "Look back at every trade you've logged, complete with chart screenshots, notes, and the emotion you felt at the time. Can be filtered by period.",
  },
  {
    title: "Dashboard",
    body: "A performance summary: win rate, average R, and trends over time — helps you spot patterns before repeating the same mistakes.",
  },
];

export default function HelpModal({ open, onClose }) {
  const C = useTheme();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, boxSizing: "border-box",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="How to use"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "relative", width: "100%", maxWidth: 420,
              maxHeight: "85vh", overflowY: "auto",
              background: C.paper, border: `1px solid ${C.line}`,
              boxShadow: C.shadowModal, borderRadius: 0,
              padding: 24, fontFamily: SANS, color: C.ink,
              boxSizing: "border-box",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute", top: 16, right: 16,
                background: "transparent", border: "none", cursor: "pointer",
                color: C.faint, padding: 4, display: "flex",
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <LightbulbIcon size={20} style={{ color: C.btnAccent }} />
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>How to Use</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {STEPS.map((step) => (
                <div key={step.title}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: C.ink }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.inkSoft }}>
                    {step.body}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
