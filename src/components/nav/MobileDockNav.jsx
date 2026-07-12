// src/components/nav/MobileDockNav.jsx
// Bottom nav (mobile) — a Dock-style magnify effect with text labels.
import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "motion/react";
import { SANS, useTheme } from "../../theme/tokens.js";

function MobileDockItem({ label, active, onClick, mouseX, spring, distance, magnification, registerRef }) {
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
        border: "none", cursor: "pointer",
        padding: "6px 10px 4px", borderRadius: 0,
        color: active ? C.ink : C.faint,
      }}
    >
      <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </motion.button>
  );
}

export default function MobileDockNav({ items, activeKey, onSelect, registerItemRef, indicator, accentColor }) {
  const mouseX = useMotionValue(Infinity);
  const spring = { mass: 0.15, stiffness: 160, damping: 14 };

  return (
    <div
      className="bottom-nav"
      style={{ alignItems: "center" }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      onTouchMove={(e) => { if (e.touches && e.touches[0]) mouseX.set(e.touches[0].clientX); }}
      onTouchEnd={() => mouseX.set(Infinity)}
      onTouchCancel={() => mouseX.set(Infinity)}
    >
      {items.map((n) => (
        <MobileDockItem
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
        position: "absolute", top: 0, height: 3, borderRadius: 0,
        background: accentColor,
        left: indicator.left, width: indicator.width,
        transition: "left .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

