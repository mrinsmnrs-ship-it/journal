// src/components/layout/MobileTopbar.jsx
// Top bar shown on mobile only (hidden on desktop via .mobile-topbar CSS,
// see src/styles/mobile.js). Holds branding, theme toggle, and logout.
import React from "react";
import { LogOut } from "lucide-react";
import { useTheme } from "../../theme/tokens.js";
import BrandMark from "../../BrandMark.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";

export default function MobileTopbar({ themeMode, onToggleTheme, onLogout }) {
  const C = useTheme();
  return (
    <div className="mobile-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 17 }}>
        <BrandMark style={{ height: "1.15em", width: "auto", color: C.ink, flexShrink: 0 }} />
        <span style={{ lineHeight: 1 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em", color: C.ink }}>Aftermath</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em", color: C.ink }}>Journey</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <ThemeToggle mode={themeMode} onToggle={onToggleTheme} compact />
        <button
          onClick={onLogout}
          title="Log out"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 0,
            padding: 8, cursor: "pointer", color: C.inkSoft,
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}
