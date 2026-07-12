// src/components/nav/DesktopBottomNav.jsx
// Floating bottom nav (desktop) — centered pill, not full-width, with a
// Dock-style magnify effect on hover. Replaces the old vertical sidebar
// nav; holds Log Trade / Journal / Dashboard / AI Chat.
import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { SANS, useTheme } from "../../theme/tokens.js";

function DesktopBottomItem({ label, Icon, active, onClick, mouseX, spring, distance, magnification, registerRef, accentColor }) {
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
        display: "flex", alignItems: "center", gap: 8,
        background: active ? C.navActiveBg : "transparent",
        border: "none", cursor: "pointer",
        padding: "10px 18px", borderRadius: 999,
        color: active ? C.ink : C.faint,
      }}
    >
      {Icon && <Icon size={16} style={{ color: active ? accentColor : "currentColor", flexShrink: 0 }} />}
      <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </motion.button>
  );
}

export default function DesktopBottomNav({ items, activeKey, onSelect, registerItemRef, indicator, accentColor }) {
  const mouseX = useMotionValue(Infinity);
  const spring = { mass: 0.15, stiffness: 160, damping: 14 };

  return (
    <div
      className="desktop-bottom-nav"
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {items.map((n) => (
        <DesktopBottomItem
          key={n.key}
          label={n.label}
          Icon={n.icon}
          active={activeKey === n.key}
          onClick={() => onSelect(n.key)}
          mouseX={mouseX}
          spring={spring}
          distance={85}
          magnification={1.1}
          registerRef={(el) => registerItemRef(n.key, el)}
          accentColor={accentColor}
        />
      ))}
      <div style={{
        position: "absolute", bottom: 6, height: 3, borderRadius: 999,
        background: accentColor,
        left: indicator.left, width: indicator.width,
        transition: "left .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}
