// src/components/common/LoadingScreen.jsx
// Full-screen loading indicator that reuses the same "number counting up"
// spring animation (CountUp) used on the Dashboard stat cards, but blown up
// large and looped, on a plain black background — so the very first thing
// people see (before auth/data is ready) doesn't look like a different app.
import React, { useCallback, useState } from "react";
import CountUp from "../../CountUp.jsx";
import { SANS } from "../../theme/tokens.js";

export default function LoadingScreen({ label = "Loading" }) {
  // CountUp only fires once per mount (useInView once: true), so we remount
  // it on every completion by bumping `loopKey` — this makes the 0 → 100
  // count repeat for as long as the screen stays up.
  const [loopKey, setLoopKey] = useState(0);

  const handleEnd = useCallback(() => {
    setTimeout(() => setLoopKey((k) => k + 1), 250);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontFamily: SANS,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          fontSize: "clamp(56px, 14vw, 108px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "#eaeaea",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        <CountUp key={loopKey} from={0} to={100} duration={1.4} onEnd={handleEnd} />
        <span style={{ color: "#707070", fontSize: "0.5em", marginLeft: 4 }}>%</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#707070" }}>
        {label}
      </div>
    </div>
  );
}
