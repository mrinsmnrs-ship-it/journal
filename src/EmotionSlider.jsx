import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Frown, Smile } from 'lucide-react';
import './EmotionSlider.css';

const MAX_OVERFLOW = 50;

// Urutan emosi di sepanjang slider: kiri = paling "kurang disiplin",
// kanan = paling tenang/percaya diri. Ganti urutan array ini kalau
// mau susunan lain — index 0 selalu jadi ujung kiri.
const EMOTION_ORDER = ["Revenge", "Anxious", "FOMO", "Hesitant", "Bored", "Confident", "Calm"];

// theme: objek warna dari ThemeContext (C) milik App.jsx, dioper sebagai prop
// supaya slider ini otomatis ikut tema light/dark tanpa hardcode warna.
export default function EmotionSlider({ value, onChange, className = '', theme }) {
  // Track pakai versi transparan dari warna ink (hitam di tema light,
  // putih di tema dark) supaya kontras dengan bagian yang sudah "keisi"
  // (slider-range, warna solid) tetap kelihatan meski keduanya sama-sama
  // hitam/putih — bedanya cuma opacity, bukan abu-abu terpisah.
  const trackTint = theme && theme.ink === "#FFFFFF"
    ? "rgba(255,255,255,0.22)"
    : "rgba(0,0,0,0.22)";
  const cssVars = theme
    ? {
        '--es-ink': theme.ink,
        '--es-track-bg': trackTint,
        '--es-icon-bg': theme.paperSoft,
        '--es-icon-border': theme.line,
      }
    : undefined;

  return (
    <div className={`slider-container ${className}`} style={cssVars}>
      <Slider value={value} onChange={onChange} />
    </div>
  );
}

function Slider({ value, onChange }) {
  const maxIndex = EMOTION_ORDER.length - 1;
  const foundIndex = EMOTION_ORDER.indexOf(value);
  const [index, setIndex] = useState(foundIndex === -1 ? Math.round(maxIndex / 2) : foundIndex);
  const sliderRef = useRef(null);
  const [region, setRegion] = useState('middle');
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  // Kalau form di-reset dari luar (mis. setelah trade tersimpan dan form
  // dikosongkan lagi), ikuti perubahan value asal itu memang salah satu
  // label yang valid. Kalau value dikosongkan ("") posisi slider dibiarkan
  // di tempat terakhir, bukan dipaksa lompat.
  useEffect(() => {
    if (value === "") return;
    const i = EMOTION_ORDER.indexOf(value);
    if (i !== -1 && i !== index) setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useMotionValueEvent(clientX, 'change', latest => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let newValue;

      if (latest < left) {
        setRegion('left');
        newValue = left - latest;
      } else if (latest > right) {
        setRegion('right');
        newValue = latest - right;
      } else {
        setRegion('middle');
        newValue = 0;
      }

      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const handlePointerMove = e => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      const raw = ((e.clientX - left) / width) * maxIndex;
      const newIndex = Math.min(Math.max(Math.round(raw), 0), maxIndex);

      if (newIndex !== index) {
        setIndex(newIndex);
        onChange(EMOTION_ORDER[newIndex]);
      }
      clientX.jump(e.clientX);
    }
  };

  const handlePointerDown = e => {
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
  };

  const getRangePercentage = () => (index / maxIndex) * 100;
  const label = EMOTION_ORDER[index];

  return (
    <>
      <motion.div
        onHoverStart={() => animate(scale, 1.2)}
        onHoverEnd={() => animate(scale, 1)}
        onTouchStart={() => animate(scale, 1.2)}
        onTouchEnd={() => animate(scale, 1)}
        style={{
          scale,
          opacity: useTransform(scale, [1, 1.2], [0.7, 1])
        }}
        className="slider-wrapper"
      >
        <motion.div
          className="icon-circle"
          animate={{
            scale: region === 'left' ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'left' ? -overflow.get() / scale.get() : 0))
          }}
        >
          <Frown className="icon" />
        </motion.div>

        <div
          ref={sliderRef}
          className="slider-root"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onLostPointerCapture={handlePointerUp}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) {
                  const { width } = sliderRef.current.getBoundingClientRect();
                  return 1 + overflow.get() / width;
                }
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) {
                  const { left, width } = sliderRef.current.getBoundingClientRect();
                  return clientX.get() < left + width / 2 ? 'right' : 'left';
                }
              }),
              height: useTransform(scale, [1, 1.2], [6, 12]),
              marginTop: useTransform(scale, [1, 1.2], [0, -3]),
              marginBottom: useTransform(scale, [1, 1.2], [0, -3])
            }}
            className="slider-track-wrapper"
          >
            <div className="slider-track">
              <div
                className="slider-range"
                style={{ width: `${getRangePercentage()}%` }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          className="icon-circle"
          animate={{
            scale: region === 'right' ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'right' ? overflow.get() / scale.get() : 0))
          }}
        >
          <Smile className="icon" />
        </motion.div>
      </motion.div>
      <p className="value-indicator">{label}</p>
    </>
  );
}

function decay(value, max) {
  if (max === 0) {
    return 0;
  }

  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);

  return sigmoid * max;
}
