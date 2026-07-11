import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";
import BrandMark from "./BrandMark.jsx";
import "./PillToggle.css";

// Font stack unified with App.jsx: GitHub's system font stack (Primer).
const CHAT_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
const SERIF = CHAT_FONT;
const SANS = CHAT_FONT;

// Tokens: palet Primer (GitHub) versi light — login page dikunci light
// regardless tema aktif, jadi selalu pakai warna GitHub light + aksen biru.
const C = {
  bg: "#ffffff", paper: "#ffffff", paperSoft: "#f5f5f5",
  pageBg: "#ffffff",
  ink: "#0a0a0a", inkSoft: "#737373", muted: "#737373", faint: "#a3a3a3",
  line: "#e5e5e5", lineSoft: "#ececec",
  inputBg: "#ffffff",
  clay: "#044df5", clayDeep: "#0339b8",
  btnAccent: "#044df5", btnAccentDeep: "#0339b8",
  rustRed: "#dc2626", rustWash: "#fee2e2",
  sage: "#0d9488", sageWash: "#ccfbf1",
  shadowCard: "none",
  shadowRaised: "0 1px 0 rgba(31,35,40,0.04)",
  shadowPopover: "0 8px 24px rgba(140,149,159,0.2)",
  shadowModal: "0 8px 24px rgba(140,149,159,0.3)",
};

function friendlyError(code) {
  switch (code) {
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/user-not-found": return "No account found with that email.";
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Incorrect email or password.";
    case "auth/email-already-in-use": return "An account already exists with that email. Try logging in instead.";
    case "auth/weak-password": return "Password should be at least 6 characters.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a bit and try again.";
    default: return "Something went wrong. Please try again.";
  }
}

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [pressed, setPressed] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setInfo("");
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    setError(""); setInfo("");
    if (!email.trim()) {
      setError("Type your email above first, then tap 'Forgot password'.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(friendlyError(err.code));
    }
  }

  function switchMode(next) {
    if (next === mode) return;
    setMode(next);
    setError(""); setInfo("");
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.pageBg, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: SANS, color: C.ink,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: ${C.faint}; }
        .auth-input { transition: border-color .12s ease, box-shadow .12s ease; box-shadow: none; }
        .auth-input:focus { outline: none; border-color: ${C.clay} !important; box-shadow: 0 0 0 3px rgba(9,105,218,0.15) !important; }
        .auth-submit { transition: box-shadow .12s ease; }
        .auth-submit:hover:not(:disabled) { box-shadow: ${C.shadowRaised}; }
        .auth-tab { transition: color .12s ease; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 380 }}>
      <div style={{
        width: "100%", maxWidth: 380, background: C.paper,
        border: `1px solid ${C.line}`, borderRadius: 0, padding: 32,
        boxShadow: C.shadowRaised,
      }}>
        <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6, fontSize: "clamp(16px, 5.4vw, 22px)" }}>
          <BrandMark style={{ height: "1.15em", width: "auto", color: C.ink, flexShrink: 0 }} />
          <span style={{ lineHeight: 1 }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.06em", color: C.ink }}>Aftermath</span>
            <span style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.05em", marginLeft: "0.05em", color: C.ink }}>Journey</span>
          </span>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
          {mode === "login" ? "Log in to sync your trades." : "Create an account to get started."}
        </div>

        {/* Segmented tabs — replaces the old bottom text-link switch */}
        <div style={{
          display: "flex", background: "rgba(20,20,19,0.05)", borderRadius: 0, padding: 4, marginBottom: 20,
        }}>
          {["login", "signup"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              data-active={mode === m}
              className="pill-toggle auth-tab"
              style={{
                flex: 1, border: "none", borderRadius: 0, padding: "9px 0",
                fontFamily: SANS, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                background: "transparent",
                "--pill-fill": C.paper,
                "--pill-base-text": C.muted,
                "--pill-active-text": C.ink,
              }}
            >
              <span className="pill-toggle-fill" style={{ boxShadow: C.shadowRaised }} />
              <span className="pill-toggle-label-stack">
                <span className="pill-toggle-label-base">{m === "login" ? "Log In" : "Sign Up"}</span>
                <span className="pill-toggle-label-active">{m === "login" ? "Log In" : "Sign Up"}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Animated butterfly video — decorative only, so touch/long-press
            interaction is disabled to prevent the browser's native
            download / picture-in-picture context menu from popping up. */}
        <video
          src={`${import.meta.env.BASE_URL}butterfly.mp4`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noremoteplayback nofullscreen"
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: "100%", height: 140, objectFit: "contain",
            borderRadius: 0, display: "block", marginBottom: 20,
            background: C.paper,
            pointerEvents: "none",
            WebkitTouchCallout: "none",
            userSelect: "none",
          }}
        />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Email
            </div>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", background: C.paper,
                border: `1px solid ${error ? C.rustRed : C.line}`, borderRadius: 0, padding: "12px 14px",
                fontSize: 15, color: C.ink, fontFamily: SANS,
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Password
              </div>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ background: "transparent", border: "none", color: C.muted, fontSize: 11, fontWeight: 400, cursor: "pointer", padding: 0, fontFamily: SANS }}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{
                width: "100%", background: C.paper,
                border: `1px solid ${error ? C.rustRed : C.line}`, borderRadius: 0, padding: "12px 14px",
                fontSize: 15, color: C.ink, fontFamily: SANS,
              }}
            />
          </div>

          {error && (
            <div style={{ background: C.rustWash, color: C.rustRed, borderRadius: 0, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ background: C.sageWash, color: C.sage, borderRadius: 0, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            data-active={pressed && !busy}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            onTouchStart={() => setPressed(true)}
            onTouchEnd={() => setPressed(false)}
            className="pill-toggle auth-submit"
            style={{
              width: "100%", padding: "13px 0", borderRadius: 0, border: "none",
              background: C.btnAccent, fontWeight: 700, fontSize: 15,
              cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
              boxShadow: C.shadowCard,
              "--pill-fill": C.btnAccentDeep,
              "--pill-base-text": "#FFFFFF",
              "--pill-active-text": "#FFFFFF",
            }}
          >
            <span className="pill-toggle-fill" />
            <span className="pill-toggle-label-stack">
              <span className="pill-toggle-label-base">{busy ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}</span>
              <span className="pill-toggle-label-active">{busy ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}</span>
            </span>
          </button>
        </form>
      </div>
      <div style={{ fontSize: 9, color: C.ink, marginTop: 16, fontFamily: SANS, opacity: 0.6 }}>
        &copy; {new Date().getFullYear()} Aftermath Journey. All rights reserved.
      </div>
      </div>
    </div>
  );
}
