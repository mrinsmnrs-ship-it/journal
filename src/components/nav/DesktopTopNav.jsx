// src/components/nav/DesktopTopNav.jsx
// Nav embedded inside the desktop topbar (not a separate bar) — plain
// text items, no icons, no rounded corners, no hover/click magnify
// animation (that effect stays exclusive to the mobile bottom dock, see
// MobileDockNav.jsx). The sliding indicator sits at the BOTTOM edge of
// the topbar instead of the top, since the bar itself is at the top of
// the screen (indicator faces the page content).
import React from "react";
import { SANS, useTheme } from "../../theme/tokens.js";

function DesktopTopNavItem({ label, active, onClick, registerRef }) {
  const C = useTheme();
  return (
    <button
      ref={registerRef}
      onClick={onClick}
      style={{
        background: active ? C.navActiveBg : "transparent",
        border: "none", cursor: "pointer", borderRadius: 0,
        padding: "6px 10px 4px",
        color: active ? C.ink : C.faint,
      }}
    >
      <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}

export default function DesktopTopNav({ items, activeKey, onSelect, registerItemRef, indicator, accentColor }) {
  return (
    <div className="desktop-top-nav">
      {items.map((n) => (
        <DesktopTopNavItem
          key={n.key}
          label={n.label}
          active={activeKey === n.key}
          onClick={() => onSelect(n.key)}
          registerRef={(el) => registerItemRef(n.key, el)}
        />
      ))}
      <div style={{
        position: "absolute", bottom: 0, height: 3, borderRadius: 0,
        background: accentColor,
        left: indicator.left, width: indicator.width,
        transition: "left .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}
