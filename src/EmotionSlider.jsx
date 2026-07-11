import { useEffect, useRef, useState } from 'react';
import { Frown, Smile } from 'lucide-react';
import './EmotionSlider.css';

// Urutan emosi di sepanjang slider: kiri = paling "kurang disiplin",
// kanan = paling tenang/percaya diri. Ganti urutan array ini kalau
// mau susunan lain — index 0 selalu jadi ujung kiri.
const EMOTION_ORDER = ["Revenge", "Anxious", "FOMO", "Hesitant", "Bored", "Confident", "Calm"];

// theme: objek warna dari ThemeContext (C) milik App.jsx, dioper sebagai prop
// supaya slider ini otomatis ikut tema light/dark tanpa hardcode warna.
export default function EmotionSlider({ value, onChange, className = '', theme }) {
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

  useEffect(() => {
    if (value === "") return;
    const i = EMOTION_ORDER.indexOf(value);
    if (i !== -1 && i !== index) setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handlePointerMove = (e) => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      const raw = ((e.clientX - left) / width) * maxIndex;
      const newIndex = Math.min(Math.max(Math.round(raw), 0), maxIndex);
      if (newIndex !== index) {
        setIndex(newIndex);
        onChange(EMOTION_ORDER[newIndex]);
      }
    }
  };

  const handlePointerDown = (e) => {
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const getRangePercentage = () => (index / maxIndex) * 100;
  const label = EMOTION_ORDER[index];

  return (
    <>
      <div className="slider-wrapper">
        <div className="icon-circle">
          <Frown className="icon" />
        </div>

        <div
          ref={sliderRef}
          className="slider-root"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
        >
          <div className="slider-track-wrapper">
            <div className="slider-track">
              <div
                className="slider-range"
                style={{ width: `${getRangePercentage()}%` }}
              />
            </div>
          </div>
        </div>

        <div className="icon-circle">
          <Smile className="icon" />
        </div>
      </div>
      <p className="value-indicator">{label}</p>
    </>
  );
}
