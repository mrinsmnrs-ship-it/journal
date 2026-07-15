// src/components/layout/OrientationGuard.jsx
// "Kunci" orientasi ke portrait untuk pengguna HP.
//
// Catatan penting: browser TIDAK MENGIZINKAN website biasa (bukan
// aplikasi PWA yang di-install / fullscreen) untuk benar-benar memaksa
// layar tetap di posisi portrait — screen.orientation.lock() cuma jalan
// di beberapa browser Android saat mode fullscreen, dan sama sekali
// tidak didukung Safari/iOS. Jadi solusi paling reliable secara web
// adalah: begitu HP dimiringkan ke landscape, tampilkan layar penuh
// yang menutupi seluruh app dan minta pengguna memutar HP kembali ke
// posisi tegak — secara efektif app tidak bisa dipakai dalam mode
// miring. Kita tetap mencoba API lock asli sebagai bonus kalau
// browsernya mendukung (best-effort, dibungkus try/catch).
import React, { useEffect } from "react";
import { useTheme, SANS } from "../../theme/tokens.js";
import BrandMark from "../../BrandMark.jsx";

export default function OrientationGuard() {
  const C = useTheme();

  useEffect(() => {
    async function tryLock() {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("portrait");
        }
      } catch {
        // Diabaikan dengan sengaja: banyak browser (terutama iOS) memang
        // tidak mengizinkan ini di luar mode fullscreen/PWA-terinstall.
        // Overlay CSS di bawah adalah fallback utama yang selalu jalan.
      }
    }
    tryLock();
  }, []);

  return (
    <div
      className="orientation-lock-overlay"
      style={{ background: C.bg, color: C.ink, fontFamily: SANS }}
    >
      <BrandMark style={{ width: 48, height: 48, color: C.faint, marginBottom: 4 }} />
      <div style={{ fontSize: 15, fontWeight: 700 }}>Putar HP kembali ke posisi tegak</div>
      <div style={{ fontSize: 13, color: C.faint, maxWidth: 260 }}>
        Aplikasi ini dirancang untuk tampilan portrait saja.
      </div>
    </div>
  );
}
