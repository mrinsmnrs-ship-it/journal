import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";

const SERIF = "'Poppins', 'Arial', sans-serif";
const SANS = "'Lora', 'Georgia', serif";

const C = {
  bg: "#FAF9F5", paper: "#FFFFFF", ink: "#141413", inkSoft: "#3D3D3A",
  muted: "#767470", line: "#E3E2DD", inputBg: "#F0EEE6",
  clay: "#D97757", rustRed: "#B85C50", rustWash: "#F1E2DE",
  sage: "#788C5D", sageWash: "#E8ECE1",
};

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
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
    setError("");
    setInfo("");
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

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: SANS, color: C.ink,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Lora:wght@400;500;600;700&display=swap');
        input::placeholder { color: #AFAEA9; }
      `}</style>
      <div style={{
        width: "100%", maxWidth: 380, background: C.paper,
        border: `1px solid ${C.line}`, borderRadius: 20, padding: 32,
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 22, textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: 6, color: C.ink }}>
          Apocalypse Archives
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>
          {mode === "login" ? "Log in to sync your trades." : "Create an account to get started."}
        </div>

        {/* Animated butterfly video — served from /public/butterfly.mp4 */}
       <video
  src={`${import.meta.env.BASE_URL}butterfly.mp4`}
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
  style={{
    width: "100%", height: 160, objectFit: "contain",
    borderRadius: 14, display: "block", marginBottom: 22,
    background: C.paper,
  }}
/>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Email
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", boxSizing: "border-box", background: C.inputBg,
                border: `1px solid ${error ? C.rustRed : C.line}`, borderRadius: 12, padding: "12px 14px",
                fontSize: 15, outline: "none", color: C.ink, fontFamily: SANS,
              }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Password
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{
                width: "100%", boxSizing: "border-box", background: C.inputBg,
                border: `1px solid ${error ? C.rustRed : C.line}`, borderRadius: 12, padding: "12px 14px",
                fontSize: 15, outline: "none", color: C.ink, fontFamily: SANS,
              }}
            />
          </div>

          {error && (
            <div style={{
              background: C.rustWash, color: C.rustRed, borderRadius: 10,
              padding: "10px 12px", fontSize: 13, marginBottom: 14,
            }}>{error}</div>
          )}
          {info && (
            <div style={{
              background: C.sageWash, color: C.sage, borderRadius: 10,
              padding: "10px 12px", fontSize: 13, marginBottom: 14,
            }}>{info}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
              background: C.clay, color: "#FFFFFF", fontWeight: 700, fontSize: 15,
              cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
              marginBottom: 14,
            }}
          >
            {busy ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>

        {mode === "login" && (
          <button
            onClick={handleForgotPassword}
            style={{ background: "transparent", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18, fontFamily: SANS }}
          >
            Forgot password?
          </button>
        )}

        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16, fontSize: 13.5, color: C.muted, textAlign: "center" }}>
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={{ background: "transparent", border: "none", color: C.ink, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: SANS }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={{ background: "transparent", border: "none", color: C.ink, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: SANS }}>
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
