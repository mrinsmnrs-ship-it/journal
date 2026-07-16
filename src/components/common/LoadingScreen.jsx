// src/components/common/LoadingScreen.jsx
// Full-screen loading indicator that reuses the same "number counting up"
// spring animation (CountUp) used on the Dashboard stat cards, but blown up
// large, on a plain black background — so the very first thing people see
// (before auth/data is ready) doesn't look like a different app.
//
// Note: this counts up from 0 to 100 exactly once and then holds at 100.
// It intentionally does NOT loop back to 0 — CountUp's spring easing means
// the "duration" prop is only approximate, so remounting it on a timer to
// loop caused the number to visibly jump backwards (sometimes resetting
// after only reaching ~20-40) because the spring hadn't actually settled
// at 100 yet when the reset fired.
import React from "react";
import CountUp from "../../CountUp.jsx";
import { MONO } from "../../theme/tokens.js";

export default function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MONO,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          fontSize: "clamp(56px, 14vw, 108px)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#eaeaea",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          fontFamily: MONO,
        }}
      >
        <CountUp from={0} to={100} duration={0.8} />
      </div>
    </div>
  );
}
