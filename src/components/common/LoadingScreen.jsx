// src/components/common/LoadingScreen.jsx
// Full-screen loading indicator that reuses the same "number counting up"
// spring animation (CountUp) used on the Dashboard stat cards, but blown up
// large and looped, on a plain black background — so the very first thing
// people see (before auth/data is ready) doesn't look like a different app.
import React, { useCallback, useState } from "react";
import CountUp from "../../CountUp.jsx";
import { MONO } from "../../theme/tokens.js";

export default function LoadingScreen() {
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
        <CountUp key={loopKey} from={0} to={100} duration={1.4} onEnd={handleEnd} />
      </div>
    </div>
  );
}
