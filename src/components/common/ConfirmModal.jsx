// ============================================================================
// components/common/ConfirmModal.jsx
// -----------------------------------------------------------------------------
// Modal konfirmasi Yes/No generik (dipakai untuk logout, dan bisa dipakai
// ulang untuk konfirmasi lain). Pola modal (portal ke <body>, backdrop
// gelap, kartu scale+blur) sama seperti HelpModal.jsx / ImageLightbox.jsx
// supaya konsisten dengan popup lain di app ini.
// ============================================================================
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTheme, SANS } from "../../theme/tokens.js";

export default function ConfirmModal({
  open, onClose, onConfirm,
  title = "Are you sure?", message = "",
  confirmLabel = "Yes", cancelLabel = "No",
}) {
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
            position: "fixed", inset: 0, zIndex: 70,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, boxSizing: "border-box",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "relative", width: "100%", maxWidth: 320,
              background: C.paper, border: `1px solid ${C.line}`,
              boxShadow: C.shadowModal, borderRadius: 0,
              padding: 24, fontFamily: SANS, color: C.ink,
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: message ? 8 : 20 }}>
              {title}
            </div>
            {message && (
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: C.inkSoft, marginBottom: 20 }}>
                {message}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 0,
                  border: `1px solid ${C.line}`, background: "transparent",
                  color: C.ink, fontFamily: SANS, fontSize: 14, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => { onClose(); onConfirm(); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 0,
                  border: "none", background: C.rustRed,
                  color: "#ffffff", fontFamily: SANS, fontSize: 14, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
