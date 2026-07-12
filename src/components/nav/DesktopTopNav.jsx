// src/components/nav/DesktopTopNav.jsx
// Nav embedded inside the desktop topbar (not a separate bar). Same look
// and magnify animation as the mobile bottom dock (MobileDockNav) — plain
// text items, no icons, no rounded corners — except the sliding indicator
// sits at the BOTTOM edge of the topbar instead of the top, since the bar
// itself is at the top of the screen (indicator faces the page content).
import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { SANS, useTheme } from "../../theme/tokens.js";

function DesktopTopNavItem({ label, active, onClick, mouseX, spring, distance, magnification, registerRef }) {
  const C = useTheme();
  const localRef = useRef(null);
  const setRef = (el) => {
    localRef.current = el;
    if (registerRef) registerRef(el);
  };
  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = localRef.current?.getBoundingClientRect() ?? { x: 0, width: 60 };
    return val - rect.x - rect.width / 2;
  });
  const targetScale = useTransform(mouseDistance, [-distance, 0, distance], [1, magnification, 1]);
  const scale = useSpring(targetScale, spring);

  return (
    <motion.button
      ref={setRef}
      onClick={onClick}
      style={{
        scale,
        transformOrigin: "bottom center",
        background: active ? C.navActiveBg : "transparent",
        border: "none", cursor: "pointer", borderRadius: 0,
        padding: "6px 10px 4px",
        color: active ? C.ink : C.faint,
      }}
    >
      <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </motion.button>
  );
}

export default function DesktopTopNav({ items, activeKey, onSelect, registerItemRef, indicator, accentColor }) {
  const mouseX = useMotionValue(Infinity);
  const spring = { mass: 0.15, stiffness: 160, damping: 14 };

  return (
    <div
      className="desktop-top-nav"
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {items.map((n) => (
        <DesktopTopNavItem
          key={n.key}
          label={n.label}
          active={activeKey === n.key}
          onClick={() => onSelect(n.key)}
          mouseX={mouseX}
          spring={spring}
          distance={85}
          magnification={1.32}
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
