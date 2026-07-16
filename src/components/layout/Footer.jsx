// src/components/layout/Footer.jsx
// Footer/watermark ala web di bagian bawah setiap halaman, isinya nama
// brand app ini. Dirender sekali di App.jsx di dalam .main-area-inner,
// jadi otomatis muncul di bawah konten tab manapun yang lagi aktif
// (Log Trade / History / Dashboard), baik di mobile maupun desktop.
import React from "react";
import { useTheme, SANS } from "../../theme/tokens.js";

export default function Footer() {
  const C = useTheme();
  const year = new Date().getFullYear();
  return (
    <div
      className="app-footer"
      style={{
        textAlign: "center",
        fontSize: 11.5,
        color: C.faint,
        opacity: 0.7,
        fontFamily: SANS,
        marginTop: 40,
        padding: "16px 0 4px",
        borderTop: `1px solid ${C.line}`,
      }}
    >
      <span>&copy; {year} Aftermath. All rights reserved.</span>
    </div>
  );
}
