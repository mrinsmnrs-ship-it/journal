// src/components/nav/MobileDockNav.jsx
// Bottom nav (mobile) — plain text items, no hover/click magnify animation
// (that "Dock" magnify effect has been removed to match the desktop nav,
// see DesktopTopNav.jsx for the same plain-button pattern).
import React from "react";
import { SANS, useTheme } from "../../theme/tokens.js";

function MobileDockItem({ label, active, onClick, registerRef }) {
  const C = useTheme();
  return (
    <button
      ref={registerRef}
      onClick={onClick}
      style={{
        background: active ? C.navActiveBg : "transparent",
        border: "none", cursor: "pointer",
        padding: "6px 10px 4px", borderRadius: 0,
        color: active ? C.ink : C.faint,
      }}
    >
      <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}

export default function MobileDockNav({ items, activeKey, onSelect, registerItemRef, indicator, accentColor }) {
  return (
    <div className="bottom-nav" style={{ alignItems: "center" }}>
      {items.map((n) => (
        <MobileDockItem
          key={n.key}
          label={n.label}
          active={activeKey === n.key}
          onClick={() => onSelect(n.key)}
          registerRef={(el) => registerItemRef(n.key, el)}
        />
      ))}
      <div style={{
        position: "absolute", top: 0, height: 3, borderRadius: 0,
        background: accentColor,
        left: indicator.left, width: indicator.width,
        transition: "left .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}
