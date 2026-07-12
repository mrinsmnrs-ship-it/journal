// src/components/nav/DesktopDockNav.jsx
// Sidebar navigation (desktop) — a Dock-style magnify effect on hover.
import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { useTheme } from "../../theme/tokens.js";

function DesktopDockItem({ label, active, onClick, mouseY, spring, distance, magnification, registerRef }) {
  const C = useTheme();
  const localRef = useRef(null);
  const setRef = (el) => {
    localRef.current = el;
    if (registerRef) registerRef(el);
  };
  const mouseDistance = useTransform(mouseY, (val) => {
    const rect = localRef.current?.getBoundingClientRect() ?? { y: 0, height: 40 };
    return val - rect.y - rect.height / 2;
  });
  const targetScale = useTransform(mouseDistance, [-distance, 0, distance], [1, magnification, 1]);
  const scale = useSpring(targetScale, spring);

  return (
    <motion.button
      ref={setRef}
      onClick={onClick}
      className="nav-item-desktop"
      style={{
        scale,
        transformOrigin: "center left",
        color: active ? C.ink : C.faint,
        background: active ? C.navActiveBg : "transparent",
      }}
    >
      {label}
    </motion.button>
  );
}

export default function DesktopDockNav({ items, activeKey, onSelect, registerItemRef, indicator, accentColor }) {
  const mouseY = useMotionValue(Infinity);
  const spring = { mass: 0.15, stiffness: 160, damping: 14 };

  return (
    <div
      style={{ position: "relative" }}
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
    >
      {items.map((n) => (
        <DesktopDockItem
          key={n.key}
          label={n.label}
          active={activeKey === n.key}
          onClick={() => onSelect(n.key)}
          mouseY={mouseY}
          spring={spring}
          distance={60}
          magnification={1.08}
          registerRef={(el) => registerItemRef(n.key, el)}
        />
      ))}
      <div style={{
        position: "absolute", top: indicator.top, right: 0,
        width: 3, height: indicator.height, borderRadius: 0,
        background: accentColor,
        transition: "top .28s cubic-bezier(.4,0,.2,1), height .28s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

