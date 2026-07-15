// src/components/trade/LogTradeForm.jsx
import React, { useRef } from "react";
import { Plus, X } from "lucide-react";
import { useTheme } from "../../theme/tokens.js";
import Field from "../common/Field.jsx";
import PillToggle from "../common/PillToggle.jsx";
import useInputStyle from "../common/useInputStyle.js";
import DateField from "../DateField.jsx";
import TagSelect from "../TagSelect.jsx";
import RiskRPanel from "./RiskRPanel.jsx";
import EmotionSlider from "../../EmotionSlider.jsx";

export default function LogTradeForm({ form, updateForm, toggleEmotion, handleSave, canSave, symbolOptions, onAddSymbolOption, onDeleteSymbolOption, onAddImages, onRemoveImage, imageUploading }) {
  const C = useTheme();
  const inputStyle = useInputStyle();
  const fileInputRef = useRef(null);
  return (
    <div style={{ background: C.paperSoftLight, borderRadius: 0, padding: 24, width: "100%", maxWidth: "100%", boxSizing: "border-box", fontSize: 16, border: `1px solid ${C.line}`, boxShadow: C.shadowCard }}>
      <Field label="Date">
        <DateField value={form.date} onChange={(d) => updateForm("date", d)} />
      </Field>
      <Field label="Symbol">
        <TagSelect
          value={form.symbol}
          onChange={(v) => updateForm("symbol", v)}
          options={symbolOptions}
          onAddOption={onAddSymbolOption}
          onDeleteOption={onDeleteSymbolOption}
          placeholder="EURUSD, XAUUSD, ..."
          uppercase
        />
      </Field>
      <Field label="Direction">
        <div style={{ display: "flex", gap: 12 }}>
          {["Long", "Short"].map((d) => (
            <PillToggle key={d} label={d} active={form.direction === d} onClick={() => updateForm("direction", d)} />
          ))}
        </div>
      </Field>
      <Field label="Reason / Setup">
        <input type="text" placeholder="Breakout retest, reversal, ..." value={form.reason} onChange={(e) => updateForm("reason", e.target.value)} style={{ ...inputStyle, height: 40, padding: "0 16px" }} />
      </Field>
      <RiskRPanel form={form} updateForm={updateForm} />
      <Field label="Rules Compliance">
        <div style={{ display: "flex", gap: 12 }}>
          {["Yes", "Partial", "No"].map((r) => (
            <PillToggle key={r} label={r} active={form.rules === r} onClick={() => updateForm("rules", r)} />
          ))}
        </div>
      </Field>
      <Field label="Emotions">
        <EmotionSlider value={form.emotion} onChange={(e) => updateForm("emotion", e)} theme={C} />
      </Field>
      <Field label="Notes">
        <textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
      </Field>
      <div style={{ marginTop: -10, marginBottom: 22, marginLeft: -5, marginRight: -5, display: "flex", flexWrap: "wrap" }}>
        {(form.images || []).map((src, i) => (
          <div key={i} style={{ width: "25%", boxSizing: "border-box", padding: "0 5px 10px" }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
              <img src={src} alt="" style={{
                width: "100%", height: "100%", objectFit: "cover", border: `1px solid ${C.line}`, borderRadius: 0,
                display: "block",
              }} />
              <button
                type="button"
                onClick={() => onRemoveImage(i)}
                aria-label="Remove image"
                style={{
                  position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: "50%",
                  background: C.ink, color: C.paper, border: `1px solid ${C.paper}`,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
                }}
              ><X size={12} /></button>
            </div>
          </div>
        ))}
        {(form.images || []).length < 8 && (
          <div style={{ width: "25%", boxSizing: "border-box", padding: "0 5px 10px" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              aria-label="Add image"
              style={{
                width: "100%", aspectRatio: "1", border: `1px dashed ${C.line}`, borderRadius: 0,
                background: C.inputBg, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: imageUploading ? "wait" : "pointer",
              }}
            >
              <Plus size={22} />
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { onAddImages(e.target.files); e.target.value = ""; }}
          style={{ display: "none" }}
        />
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        style={{
          width: "100%", padding: "16px 0", borderRadius: 0, border: "none",
          background: canSave ? C.btnAccent : C.lineSoft,
          color: canSave ? C.btnAccentTextActive : C.faint,
          fontWeight: 700, fontSize: 17, cursor: canSave ? "pointer" : "not-allowed",
          boxShadow: canSave ? C.shadowCard : "none",
          transition: "background-color 0.15s ease, color 0.15s ease",
        }}
      >
        Save Trade
      </button>
          </div>
  );
}
