// ============================================================================
// components/common/TopbarActions.jsx
// -----------------------------------------------------------------------------
// Dua tombol ikon-only (ganti tema + akun) ditampilkan langsung berdampingan
// di pojok topbar, tanpa dropdown/popup seperti HamburgerMenu dulu.
// - Ikon tema: cuma efek ikon saat ditekan (sama seperti menu bawah),
//   tanpa background kotak yang muncul saat tap/hover.
// - Ikon akun: "person" (login) saat belum login -> buka LoginModal;
//   berubah jadi "logout" saat sudah login -> buka ConfirmModal (Yes/No)
//   sebelum benar-benar logout.
// ============================================================================
import { useState } from "react";
import { User, LogOut } from "lucide-react";
import { useTheme, THEME_META } from "../../theme/tokens.js";
import ConfirmModal from "./ConfirmModal.jsx";
import LoginModal from "./LoginModal.jsx";

// Style tombol ikon topbar: tanpa background/border sama sekali, jadi
// tidak ada efek "kotak" saat ditekan -- feedback tekan cuma dari
// transform scale global (lihat styles/base.js: button:active), persis
// seperti item di menu bawah (MobileDockNav).
const iconButtonStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, background: "transparent", border: "none",
  borderRadius: 0, padding: 0, cursor: "pointer",
};

export default function TopbarActions({ themeMode, onToggleTheme, onLogout, isLoggedIn = true }) {
  const C = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { label: themeLabel, Icon: ThemeIcon } = THEME_META[themeMode] || THEME_META.light;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          type="button"
          style={iconButtonStyle}
          onClick={onToggleTheme}
          aria-label={`Current theme: ${themeLabel}`}
          title={`Current theme: ${themeLabel}`}
        >
          <ThemeIcon size={15} style={{ color: C.ink }} />
        </button>
        <button
          type="button"
          style={iconButtonStyle}
          onClick={() => (isLoggedIn ? setShowLogoutConfirm(true) : setShowLogin(true))}
          aria-label={isLoggedIn ? "Log out" : "Log in"}
          title={isLoggedIn ? "Log out" : "Log in"}
        >
          {isLoggedIn ? <LogOut size={15} style={{ color: C.ink }} /> : <User size={15} style={{ color: C.ink }} />}
        </button>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={onLogout}
        title="Log out?"
        message="You'll need to log in again to keep tracking your trades."
        confirmLabel="Yes, log out"
        cancelLabel="Cancel"
      />

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
