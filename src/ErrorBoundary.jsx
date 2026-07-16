// src/ErrorBoundary.jsx
// Menangkap error React yang tidak tertangani supaya UI tidak jadi
// "layar putih kosong" total. Tanpa boundary ini, error apa pun yang
// terjadi saat render (misalnya dipicu oleh state yang berubah setelah
// delete) membuat React meng-unmount seluruh tree -> body kosong/putih.
// Dengan boundary ini, error tetap ditangkap, ditampilkan sebagai pesan,
// dan dicetak ke console supaya penyebab aslinya gampang dilacak.
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Ini yang perlu dilihat di DevTools Console (F12) kalau layar putih
    // muncul lagi — pesan errornya akan persis menunjuk baris masalahnya.
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: 24,
            textAlign: "center",
            fontFamily:
              "'Geist Pixel', ui-monospace, monospace",
            color: "#1a1a1a",
            background: "#ffffff",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            Something went wrong while loading the page
          </div>
          <div style={{ fontSize: 13, color: "#666", maxWidth: 480 }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: "10px 20px",
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
