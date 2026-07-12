// src/components/layout/DesktopSidebar.jsx
// Left sidebar shown on desktop only (hidden on mobile via .sidebar CSS,
// see src/styles/desktop.js). Holds branding, nav, theme toggle, and
// account info.
import React from "react";
import { LogOut } from "lucide-react";
import { useTheme } from "../../theme/tokens.js";
import BrandMark from "../../BrandMark.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";
import DesktopDockNav from "../nav/DesktopDockNav.jsx";

export default function DesktopSidebar({
  navItems, activeKey, onSelect, registerItemRef, indicator, accentColor,
  themeMode, onToggleTheme, onLogout, userEmail,
}) {
  const C = useTheme();
  return (
    <div className="sidebar">
      <div style={{ padding: "6px 10px 26px", display: "flex", alignItems: "center", gap: 6, fontSize: 19 }}>
        <BrandMark style={{ height: "1.15em", width: "auto", color: C.ink, flexShrink: 0 }} />
        <span style={{ lineHeight: 1 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em", color: C.ink }}>Aftermath</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em", color: C.ink }}>Journey</span>
        </span>
      </div>
      <DesktopDockNav
        items={navItems}
        activeKey={activeKey}
        onSelect={onSelect}
        registerItemRef={registerItemRef}
        indicator={indicator}
        accentColor={accentColor}
      />
      <div style={{ flex: 1 }} />
      <div style={{ padding: "0 2px", marginBottom: 12, display: "flex", gap: 8 }}>
        <ThemeToggle mode={themeMode} onToggle={onToggleTheme} />
        <button
          onClick={onLogout}
          title="Log out"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 0,
            padding: "10px 13px", cursor: "pointer", color: C.inkSoft,
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
      <div style={{ fontSize: 13, color: C.faint, padding: "0 10px", lineHeight: 1.5 }}>
        Signed in as {userEmail}. Synced across your devices.
      </div>
    </div>
  );
}
