// src/components/TradeCard.jsx
import React, { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { SANS, useTheme } from "../theme/tokens.js";
import { fmtR } from "../utils/format.js";
import ImageLightbox from "./ImageLightbox.jsx";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function TradeCard({ t, onDelete }) {
  const C = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const win = t.rActual > 0;
  const hasDetails = t.reason || t.direction || t.rules || t.emotion || t.notes || (t.images && t.images.length > 0);
  // Trade yang sudah tersimpan di Journal cuma boleh dihapus dalam 7 hari
  // sejak dicatat — setelahnya jadi catatan permanen. Trade lama tanpa
  // `createdAt` (dicatat sebelum aturan ini ada) dianggap sudah lewat masa itu.
  const canDelete = t.createdAt ? Date.now() - t.createdAt < ONE_WEEK_MS : false;

  return (
    <div style={{
      background: C.paperSoftLight, borderBottom: `1px solid ${C.line}`,
      borderRadius: 0, overflow: "hidden",
    }}>
      <button
        type="button"
        className="no-press"
        onClick={() => hasDetails && setExpanded((e) => !e)}
        style={{
          width: "100%", background: "transparent", border: "none", padding: "20px 22px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          cursor: hasDetails ? "pointer" : "default", textAlign: "left", color: C.ink,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontWeight: 700, fontSize: 19, fontFamily: SANS }}>{t.symbol}</div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: C.faint }}>{t.date}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, color: win ? C.ink : C.faint }}>
            {fmtR(t.rActual)}
          </div>
          {hasDetails && (
            <span style={{ display: "flex", color: C.faint, transition: "transform 0.3s ease", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              <ChevronDown size={16} />
            </span>
          )}
        </div>
      </button>
      <div style={{
        display: "grid", gridTemplateRows: expanded ? "1fr" : "0fr",
        transition: "grid-template-rows 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "0 22px 20px" }}>
            {(() => {
              const rows = [
                t.reason && { label: "Setup", value: t.reason },
                t.direction && { label: "Direction", value: t.direction },
                t.rules && { label: "Rules", value: t.rules },
                t.emotion && { label: "Emotion", value: t.emotion },
                t.notes && { label: "Notes", value: t.notes },
              ].filter(Boolean);
              if (rows.length === 0) return null;
              return (
                <div style={{ marginTop: 4, borderTop: `1px solid ${C.line}`, borderRadius: 0 }}>
                  {rows.map((row, i) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex", padding: "10px 12px", gap: 12,
                        borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                      }}
                    >
                      <div style={{
                        width: 84, flexShrink: 0, fontFamily: SANS, fontSize: 11,
                        fontWeight: 700, color: C.faint, textTransform: "uppercase",
                        letterSpacing: "0.04em", paddingTop: 1,
                      }}>{row.label}</div>
                      <div style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.4 }}>{row.value}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            {t.images && t.images.length > 0 && (
              <div style={{ marginTop: 11, marginLeft: -4, marginRight: -4, display: "flex", flexWrap: "wrap" }}>
                {t.images.map((src, i) => (
                  <div key={i} style={{ width: "25%", boxSizing: "border-box", padding: 4 }}>
                    <button
                      type="button"
                      className="no-press"
                      onClick={(e) => { e.stopPropagation(); setLightboxSrc(src); }}
                      style={{ display: "block", width: "100%", aspectRatio: "1", padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
                    >
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {canDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
                marginTop: 15, background: "transparent", border: "none", color: C.faint, fontSize: 10, fontFamily: SANS,
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0,
              }}><Trash2 size={11} /> Delete</button>
            )}
          </div>
        </div>
      </div>
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
                                       }
