// src/components/common/LightbulbIcon.jsx
// Custom-drawn lightbulb icon (bukan dari library lucide-react) — dipakai
// khusus untuk menu "Petunjuk" di HamburgerMenu. Outline-style, pakai
// currentColor supaya otomatis ikut warna teks di sekitarnya (tema
// light/dark), sama seperti ikon lucide lain di app ini.
import React from "react";

export default function LightbulbIcon({ size = 16, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {/* Bohlam */}
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.46.97 1.15 1.02 1.9.02.3.28.53.58.53h4a.6.6 0 0 0 .58-.53c.05-.75.42-1.44 1.02-1.9A6 6 0 0 0 12 3Z" />
      {/* Kilau kecil di sisi bohlam */}
      <path d="M12 7a3.5 3.5 0 0 0-2.3 6.13" opacity="0.55" />
    </svg>
  );
}
