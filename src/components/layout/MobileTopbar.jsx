// src/components/layout/MobileTopbar.jsx
import React from "react";
import { useTheme } from "../../theme/tokens.js";
import TopbarActions from "../common/TopbarActions.jsx";

export default function MobileTopbar({ onLogout, isLoggedIn, onOpenLogin }) {
  const C = useTheme();
  return (
    <div className="mobile-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 20 }}>
        <span style={{ lineHeight: 1 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em", color: C.ink }}>Aftermath</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em", color: C.ink }}>Journey</span>
        </span>
      </div>
      <TopbarActions onLogout={onLogout} isLoggedIn={isLoggedIn} onOpenLogin={onOpenLogin} />
    </div>
  );
}
