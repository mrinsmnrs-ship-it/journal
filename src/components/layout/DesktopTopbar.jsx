// src/components/layout/DesktopTopbar.jsx
// Top bar shown on desktop only (hidden on mobile via .desktop-topbar CSS,
// see src/styles/mobile.js). Full-width, fixed at the top. Holds branding
// on the left, nav (dock-style, same look/animation as the mobile bottom
// nav) in the middle, and theme toggle + logout on the right — replaces
// the old vertical sidebar and the separate floating bottom nav.
import React from "react";
import { LogOut } from "lucide-react";
import { useTheme } from "../../theme/tokens.js";
import BrandMark from "../../BrandMark.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";
import DesktopTopNav from "../nav/DesktopTopNav.jsx";

export default function DesktopTopbar({
  navItems, activeKey, onSelect, registerItemRef, indicator, accentColor,
  themeMode, onToggleTheme, onLogout, userEmail,
}) {
  const C = useTheme();
  return (
    <div className="desktop-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 19, flexShrink: 0 }}>
        <BrandMark style={{ height: "1.15em", width: "auto", color: C.ink, flexShrink: 0 }} />
        <span style={{ lineHeight: 1 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em", color: C.ink }}>Aftermath</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em", color: C.ink }}>Journey</span>
        </span>
      </div>

      <DesktopTopNav
        items={navItems}
        activeKey={activeKey}
        onSelect={onSelect}
        registerItemRef={registerItemRef}
        indicator={indicator}
        accentColor={accentColor}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span title={userEmail} style={{ fontSize: 13, color: C.faint, marginRight: 2, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userEmail}
        </span>
        <ThemeToggle mode={themeMode} onToggle={onToggleTheme} compact />
        <button
          onClick={onLogout}
          title="Log out"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: C.paperSoft, border: `1px solid ${C.line}`, borderRadius: 0,
            padding: 9, cursor: "pointer", color: C.inkSoft,
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
