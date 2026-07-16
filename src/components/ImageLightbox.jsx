// src/components/ImageLightbox.jsx
// Full-size image popup — same "mobile style" modal treatment as
// DateField's calendar (portal to <body>, dark backdrop, centered card
// that scales/blurs in), just holding an <img> instead of a grid.
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../theme/tokens.js";

export default function ImageLightbox({ src, onClose }) {
  const C = useTheme();
  useEffect(() => {
    if (!src) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [src]);

  const content = (
    <AnimatePresence>
      {src && (
        <motion.div
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed", inset: 0, zIndex: 49,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, boxSizing: "border-box",
            background: "rgba(0,0,0,0.7)",
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative", maxWidth: "100%", maxHeight: "100%" }}
          >
            <img src={src} alt="" style={{
              display: "block", maxWidth: "90vw", maxHeight: "85vh",
              width: "auto", height: "auto", border: `1px solid ${C.line}`,
              boxShadow: C.shadowModal, objectFit: "contain",
            }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
