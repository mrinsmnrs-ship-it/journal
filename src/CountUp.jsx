import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  decimals,
  onStart,
  onEnd
}) {
  const ref = useRef(null);
  const motionValue = useMotionValue(direction === 'down' ? to : from);

  // Use duration+bounce directly instead of hand-rolled damping/stiffness.
  // The old formula scaled damping and stiffness together in a way that
  // kept the system heavily overdamped no matter what `duration` was set
  // to, so the real settle time stayed around ~2s even when `duration`
  // said 0.8 — the number just looked slow no matter how low you set it.
  // duration+bounce is honored literally by the spring, so lowering
  // `duration` now actually makes it faster.
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0.15
  });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  const getDecimalPlaces = num => {
    const str = num.toString();

    if (str.includes('.')) {
      const decimalsStr = str.split('.')[1];

      if (parseInt(decimalsStr) !== 0) {
        return decimalsStr.length;
      }
    }

    return 0;
  };

  // `decimals` lets a caller force an exact decimal count (e.g. always
  // "4.10" instead of "4.1") instead of relying on auto-detection from
  // the from/to values, which drops trailing zeros.
  const maxDecimals = typeof decimals === 'number' ? decimals : Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    latest => {
      const hasDecimals = maxDecimals > 0;

      const options = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0
      };

      const formattedNumber = Intl.NumberFormat('en-US', options).format(latest);

      return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
    },
    [maxDecimals, separator]
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === 'down' ? to : from);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, direction, formatValue]);

  useEffect(() => {
    if (isInView && startWhen) {
      if (typeof onStart === 'function') onStart();

      const timeoutId = setTimeout(() => {
        motionValue.set(direction === 'down' ? from : to);
      }, delay * 1000);

      const durationTimeoutId = setTimeout(
        () => {
          if (typeof onEnd === 'function') onEnd();
        },
        delay * 1000 + duration * 1000
      );

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', latest => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}
