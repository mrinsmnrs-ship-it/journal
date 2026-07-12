// src/components/TradeCard.jsx
import React, { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { SANS, useTheme } from "../theme/tokens.js";
import { fmtR } from "../utils/format.js";
import Tag from "./common/Tag.jsx";
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
      background: C.paperSoftLight, border: `1px solid ${C.line}`,
      borderRadius: 0, boxShadow: C.shadowCard, overflow: "hidden",
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
          <div style={{ fontWeight: 700, fontSize: 19 }}>{t.symbol}</div>
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
            {t.reason && <div style={{ fontSize: 15, color: C.inkSoft, marginTop: 4 }}>{t.reason}</div>}
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 13 }}>
              {t.direction && <Tag text={`Direction: ${t.direction}`} />}
              {t.entryModel && <Tag text={`Model: ${t.entryModel}`} />}
              {t.rules && <Tag text={`Rules: ${t.rules}`} />}
              {t.emotion && <Tag text={`Emotion: ${t.emotion}`} />}
            </div>
            {t.notes && <div style={{ fontSize: 14, color: C.muted, marginTop: 11, fontStyle: "italic" }}>{t.notes}</div>}
            {t.images && t.images.length > 0 && (
              <div style={{ marginTop: 11, marginLeft: -4, marginRight: -4, display: "flex", flexWrap: "wrap" }}>
                {t.images.map((src, i) => (
                  <div key={i} style={{ width: "25%", boxSizing: "border-box", padding: 4 }}>
                    <button
                      type="button"
                      className="no-press"
                      onClick={(e) => { e.stopPropagation(); setLightboxSrc(src); }}
                      style={{ display: "block", width: "100%", aspectRatio: "1", padding: 0, border: `1px solid ${C.line}`, background: "transparent", cursor: "pointer" }}
                    >
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {canDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
                marginTop: 15, background: "transparent", border: "none", color: C.faint, fontSize: 10,
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
