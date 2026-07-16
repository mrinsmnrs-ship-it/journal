import { useEffect, useRef } from 'react';

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Punctuation/separators (e.g. the "/" in "BTC/USD") are kept static rather
// than scrambled — scrambling them adds noise without adding the "counting
// up" feel, and it keeps the string's shape readable while it resolves.
const STATIC_CHAR = /[^A-Za-z0-9]/;

// Same idea as CountUp, but for symbol names: instead of a number spinning
// up to its target, letters cycle through random glyphs and lock into the
// final characters left-to-right, like a slot machine settling.
export default function TextScramble({
  text,
  duration = 0.5,
  charset = DEFAULT_CHARSET,
  className = '',
  style
}) {
  const ref = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = text == null ? '' : String(text);
    const durationMs = Math.max(duration, 0.05) * 1000;
    // Characters scramble for this initial stretch, then lock in one by
    // one across the remaining time — so it reads as "resolving" rather
    // than an instant snap or a uniform fade.
    const scrambleFloor = durationMs * 0.35;
    const len = target.length;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      let out = '';
      let allLocked = true;

      for (let i = 0; i < len; i++) {
        const ch = target[i];
        if (STATIC_CHAR.test(ch)) {
          out += ch;
          continue;
        }
        const lockAt = len > 1
          ? scrambleFloor + (i / (len - 1)) * (durationMs - scrambleFloor)
          : scrambleFloor;

        if (elapsed >= lockAt) {
          out += ch;
        } else {
          allLocked = false;
          out += charset[Math.floor(Math.random() * charset.length)];
        }
      }

      if (ref.current) ref.current.textContent = out;

      if (!allLocked) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Re-run only when the target text (or timing config) actually changes —
    // re-renders with the same symbol name shouldn't restart the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, duration, charset]);

  return <span className={className} style={style} ref={ref} />;
}
