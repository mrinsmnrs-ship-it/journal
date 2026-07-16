import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../firebase.js";
import { useTheme, SANS } from "../../theme/tokens.js";

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

export default function LoginModal({ open, onClose }) {
  const C = useTheme();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

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
      onClose();
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

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed", inset: 0, zIndex: 70,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, boxSizing: "border-box",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Log in"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "relative", width: "100%", maxWidth: 380,
              maxHeight: "85vh", overflowY: "auto",
              background: C.paper, border: `1px solid ${C.line}`,
              boxShadow: C.shadowModal, borderRadius: 0,
              padding: 32, fontFamily: SANS, color: C.ink,
              boxSizing: "border-box",
            }}
          >
            <style>{`
              .login-modal-input::placeholder { color: ${C.faint}; }
              .login-modal-input { transition: border-color .12s ease, box-shadow .12s ease; box-shadow: none; }
              .login-modal-input:focus { outline: none; border-color: ${C.clay} !important; box-shadow: 0 0 0 3px ${C.clayWash} !important; }
            `}</style>

            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: C.ink }}>
              {mode === "login" ? "Log In" : "Sign Up"}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
              {mode === "login" ? "Log in to sync your trades." : "Create an account to get started."}
            </div>

            <div style={{
              display: "flex", background: C.paperSoft, borderRadius: 0, padding: 4, marginBottom: 20,
            }}>
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1, border: "none", borderRadius: 0, padding: "9px 0",
                    fontFamily: SANS, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                    background: mode === m ? C.paper : "transparent",
                    color: mode === m ? C.ink : C.muted,
                    boxShadow: mode === m ? C.shadowRaised : "none",
                    transition: "background-color 0.15s ease, color 0.15s ease",
                  }}
                >
                  {m === "login" ? "Log In" : "Sign Up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Email
                </div>
                <input
                  type="email"
                  className="login-modal-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: "100%", background: C.inputBg,
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
                  className="login-modal-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  style={{
                    width: "100%", background: C.inputBg,
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
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 0, border: "none",
                  background: C.btnAccent, color: "#FFFFFF", fontWeight: 700, fontSize: 15,
                  cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
                  boxShadow: C.shadowCard,
                  transition: "background-color 0.15s ease, color 0.15s ease",
                }}
              >
                {busy ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
