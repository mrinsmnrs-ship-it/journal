// src/components/TagSelect.jsx
// ---- Notion-style creatable select: pick an existing tag or type to
// create a new one, so you don't have to retype the same symbol/model
// every time. Opens as a centered popup (same "mobile style" modal as
// DateField) instead of an inline dropdown, and each option row has its
// own delete (×) button so old/typo'd tags can be cleaned up. ----
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { SANS, useTheme } from "../theme/tokens.js";
import Tag from "./common/Tag.jsx";
import useInputStyle from "./common/useInputStyle.js";

export default function TagSelect({ value, onChange, options, onAddOption, onDeleteOption, placeholder, uppercase, disabled }) {
  const C = useTheme();
  const inputStyle = useInputStyle();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const norm = (s) => (uppercase ? s.toUpperCase() : s);
  const trimmedQuery = query.trim();
  const filtered = options.filter((o) => o.value.toLowerCase().includes(trimmedQuery.toLowerCase()));
  const exactMatch = options.some((o) => o.value.toLowerCase() === trimmedQuery.toLowerCase());

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  function openMenu() {
    if (disabled) return;
    setQuery("");
    setConfirmDelete(null);
    setOpen(true);
  }
  function closeMenu() {
    setOpen(false);
    setConfirmDelete(null);
  }
  function select(opt) {
    onChange(opt);
    closeMenu();
  }
  function createAndSelect() {
    const v = norm(trimmedQuery);
    if (!v) return;
    if (!options.some((o) => o.value.toLowerCase() === v.toLowerCase())) onAddOption(v);
    onChange(v);
    closeMenu();
  }
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (exactMatch) select(options.find((o) => o.value.toLowerCase() === trimmedQuery.toLowerCase()).value);
      else createAndSelect();
    } else if (e.key === "Escape") {
      closeMenu();
    }
  }
  function requestDelete(e, opt) {
    e.stopPropagation();
    setConfirmDelete(opt);
  }
  function confirmDeleteNow(e, opt) {
    e.stopPropagation();
    onDeleteOption?.(opt);
    if (opt === value) onChange("");
    setConfirmDelete(null);
  }

  const popupContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          onClick={closeMenu}
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
              width: "min(88vw, 320px)", maxWidth: 320, maxHeight: "min(80vh, 440px)",
              display: "flex", flexDirection: "column", color: C.ink,
              background: C.paperSoftLight, border: "none", borderRadius: 0,
              boxShadow: C.shadowModal,
            }}>
            <div style={{ padding: "14px 14px 12px 14px", flexShrink: 0, borderBottom: `1px solid ${C.line}` }}>
              <input
                type="text"
                autoFocus
                className="tagselect-search-input"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(norm(e.target.value))}
                onKeyDown={handleKeyDown}
                style={{
                  ...inputStyle, border: "none", borderBottom: `1px solid ${C.inputBorder}`,
                  height: 40, padding: "0 2px",
                  textTransform: uppercase ? "uppercase" : "none",
                }}
              />
              <style>{`.tagselect-search-input:focus { border-bottom-color: ${C.inputBorder} !important; box-shadow: none !important; }`}</style>
            </div>
            <div style={{ padding: "12px 14px 14px 14px", overflowY: "auto", flex: 1, minHeight: 0 }}>
              {filtered.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {filtered.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => select(opt.value)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        border: "none", borderBottom: `1px solid ${C.line}`, borderRadius: 0, padding: "8px 10px",
                        background: C.paperSoft,
                        color: C.ink,
                        fontSize: 14, fontWeight: 600, fontFamily: SANS, cursor: "pointer",
                      }}
                    >
                      <span>{opt.value}</span>
                      {(confirmDelete === opt.value ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={(e) => confirmDeleteNow(e, opt.value)}
                            style={{
                              border: "none", background: "transparent", color: C.popupDangerRed,
                              fontSize: 12, fontWeight: 700, fontFamily: SANS, cursor: "pointer", padding: "2px 4px",
                            }}
                          >Delete</button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                            style={{
                              border: "none", background: "transparent", color: C.muted,
                              fontSize: 12, fontFamily: SANS, cursor: "pointer", padding: "2px 4px",
                            }}
                          >Cancel</button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => requestDelete(e, opt.value)}
                          style={{
                            border: "none", background: "transparent", color: C.muted,
                            cursor: "pointer", padding: 2, display: "flex", flexShrink: 0,
                          }}
                          aria-label={`Delete ${opt.value}`}
                        ><X size={15} /></button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {trimmedQuery && !exactMatch && (
                <button
                  type="button"
                  onClick={createAndSelect}
                  style={{
                    width: "100%", textAlign: "left", border: "none", background: "transparent",
                    color: C.muted, fontSize: 13, fontFamily: SANS, cursor: "pointer",
                    padding: "8px 4px", marginTop: filtered.length > 0 ? 6 : 0,
                  }}
                >
                  + Create "{norm(trimmedQuery)}"
                </button>
              )}
              {filtered.length === 0 && !trimmedQuery && (
                <div style={{ color: C.faint, fontSize: 13, fontFamily: SANS, padding: "6px 4px" }}>
                  Start typing to create an option.
                </div>
              )}
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
        disabled={disabled}
        onClick={openMenu}
        style={{
          width: "100%", boxSizing: "border-box", background: "transparent", border: "none",
          borderRadius: 0, padding: 0, margin: 0, color: value ? C.inputText : C.faint,
          fontFamily: SANS, fontSize: 15, lineHeight: 1.3, textTransform: uppercase ? "uppercase" : "none",
          textAlign: "right", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center",
          justifyContent: "flex-end", opacity: disabled ? 0.5 : 1, boxShadow: "none",
        }}
      >
        {value || placeholder}
      </button>
      {createPortal(popupContent, document.body)}
    </div>
  );
              }
