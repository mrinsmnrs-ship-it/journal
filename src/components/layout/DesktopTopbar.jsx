// src/components/layout/DesktopTopbar.jsx
import React from "react";
import { useTheme } from "../../theme/tokens.js";
import TopbarActions from "../common/TopbarActions.jsx";
import ShinyText from "../../ShinyText.jsx";

export default function DesktopTopbar({ onLogout, userEmail, isLoggedIn, onOpenLogin }) {
  const C = useTheme();
  return (
    <div className="desktop-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 22, flexShrink: 0 }}>
        <span style={{ lineHeight: 1 }}>
          <ShinyText
            text="Aftermath"
            color={C.ink}
            shineColor="#ffffff"
            speed={3}
            spread={120}
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em" }}
          />
          <ShinyText
            text="Journey"
            color={C.ink}
            shineColor="#ffffff"
            speed={3}
            spread={120}
            delay={0.2}
            style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em" }}
          />
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {userEmail && (
          <span title={userEmail} style={{ fontSize: 13, color: C.faint, marginRight: 2, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userEmail}
          </span>
        )}
        <TopbarActions onLogout={onLogout} isLoggedIn={isLoggedIn} onOpenLogin={onOpenLogin} />
      </div>
    </div>
  );
}
