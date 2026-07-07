import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";

const CHAT_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SERIF = CHAT_FONT; // now matches the AI Chat page font
const SANS = CHAT_FONT;  // now matches the AI Chat page font

const C = {
  bg: "#FAF9F5", paper: "#FFFFFF", ink: "#141413", inkSoft: "#3D3D3A",
  muted: "#767470", faint: "#AFAEA9", line: "#E3E2DD", inputBg: "#F0EEE6",
  clay: "#D97757", clayDeep: "#B85C3E",
  rustRed: "#B85C50", rustWash: "#F1E2DE",
  sage: "#788C5D", sageWash: "#E8ECE1",
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
  const [blinkFrame, setBlinkFrame] = useState("open"); // "open" | "half" | "closed"

  useEffect(() => {
    let cancelled = false;
    const timeouts = [];

    function doBlink() {
      const frames = ["open2", "half", "closed", "half", "open2", "open"]; // patah-patah: instant swap, no morph
      frames.forEach((f, i) => {
        timeouts.push(setTimeout(() => {
          if (!cancelled) setBlinkFrame(f);
        }, i * 70));
      });
    }

    function loop() {
      doBlink();
      timeouts.push(setTimeout(loop, 4500));
    }
    loop();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

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
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: SANS, color: C.ink,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Lora:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: ${C.faint}; }
        .auth-input { transition: border-color .12s ease, box-shadow .12s ease; }
        .auth-input:focus { outline: none; border-color: ${C.clay} !important; box-shadow: 0 0 0 3px ${C.clay}22; }
        .auth-submit { transition: background .12s ease, transform .1s ease; }
        .auth-submit:hover:not(:disabled) { background: ${C.clayDeep}; }
        .auth-submit:active:not(:disabled) { transform: scale(0.98); }
        .auth-tab { transition: color .12s ease; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 380 }}>
      <div style={{
        width: "100%", maxWidth: 380, background: C.paper,
        border: `1px solid ${C.line}`, borderRadius: 20, padding: 32,
        boxShadow: "0 12px 32px rgba(20,20,19,0.06)",
      }}>
<div style={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 4, fontSize: "clamp(14px, 5.4vw, 22px)", flexWrap: "nowrap" }}>
          <svg viewBox="0 0 494 497" style={{ color: C.ink, flexShrink: 0, width: "1.05em", height: "1.05em" }}>
            {blinkFrame === "open" && (
              <g transform="translate(0.000000,497.000000) scale(0.100000,-0.100000)"
              fill="currentColor" stroke="none">
              <path d="M2490 4419 c-33 -13 -68 -47 -88 -84 -17 -33 -18 -153 -6 -571 4
              -143 3 -223 -3 -227 -6 -4 -70 -14 -144 -22 -164 -19 -260 -39 -353 -72 -108
              -38 -284 -128 -361 -183 -38 -28 -73 -50 -76 -50 -4 0 -29 39 -55 88 -26 48
              -86 152 -134 232 -48 80 -97 164 -109 188 -12 24 -60 101 -107 172 -96 146
              -127 172 -203 172 -59 0 -86 -13 -111 -55 -24 -39 -27 -141 -6 -192 14 -33
              171 -300 242 -411 51 -80 204 -364 204 -379 0 -7 -26 -35 -57 -62 -102 -89
              -336 -325 -409 -413 -126 -150 -333 -480 -342 -542 -9 -68 33 -132 197 -297
              155 -157 204 -195 377 -289 60 -33 112 -66 117 -74 10 -14 -75 -219 -133 -323
              -80 -145 -119 -275 -101 -342 20 -73 105 -117 182 -94 63 19 108 73 163 196
              157 347 197 431 210 439 15 10 125 -19 216 -57 93 -39 409 -129 515 -147 61
              -10 156 -22 213 -25 l102 -8 2 -31 c1 -17 2 -130 2 -251 1 -202 3 -224 22
              -265 32 -68 64 -93 126 -98 65 -5 110 22 142 83 20 37 21 58 23 299 2 196 6
              262 15 268 7 4 33 8 58 8 71 0 215 35 423 100 265 83 364 123 452 181 42 27
              81 49 88 49 7 0 30 -26 52 -57 22 -31 75 -100 119 -152 43 -53 100 -128 127
              -167 59 -88 96 -120 148 -129 58 -10 101 2 139 38 82 79 58 196 -72 351 -28
              33 -67 81 -86 106 -19 25 -65 78 -102 118 -38 40 -68 79 -68 87 0 18 60 66
              185 148 197 130 361 257 384 298 77 136 8 286 -274 599 -48 54 -235 235 -383
              372 -39 37 -72 73 -72 81 0 8 59 76 130 150 174 180 316 350 346 412 49 103
              22 205 -62 234 -86 30 -156 -11 -280 -165 -85 -105 -390 -424 -406 -424 -6 0
              -37 16 -71 37 -57 34 -190 94 -379 168 -112 45 -261 83 -352 92 -39 3 -74 11
              -78 17 -4 6 -8 43 -8 83 0 40 -4 127 -10 195 -5 68 -11 204 -12 304 -3 177 -3
              181 -30 221 -16 24 -44 49 -70 62 -48 23 -70 25 -108 10z m658 -1355 c157 -52
              255 -99 337 -162 33 -25 89 -68 125 -95 79 -59 555 -529 617 -610 64 -85 61
              -90 -82 -162 -98 -49 -456 -275 -565 -356 -42 -32 -98 -59 -275 -134 -171 -73
              -260 -100 -302 -94 -21 4 -16 11 45 78 90 99 134 164 197 296 149 307 149 595
              0 900 -65 133 -132 223 -231 312 -41 36 -74 70 -74 75 0 14 66 -1 208 -48z
              m-958 32 c0 -2 -41 -34 -90 -71 -128 -95 -250 -235 -314 -361 -138 -272 -161
              -512 -74 -784 40 -124 83 -208 156 -305 33 -44 58 -83 56 -87 -11 -17 -519
              188 -759 307 -187 92 -337 187 -343 216 -1 8 18 51 44 95 26 43 62 106 82 139
              83 142 258 343 375 431 97 72 398 243 547 309 169 76 320 128 320 111z"/>
              </g>
            )}
            {blinkFrame === "open2" && (
              <g transform="translate(0.000000,497.000000) scale(0.100000,-0.100000)"
              fill="currentColor" stroke="none">
              <path d="M2413 4173 c-29 -6 -70 -54 -83 -101 -20 -70 -30 -346 -21 -575 6
              -122 8 -224 5 -228 -2 -4 -37 -10 -76 -14 -190 -17 -487 -96 -681 -180 -84
              -36 -157 -65 -162 -65 -19 0 -207 321 -340 578 -26 51 -66 113 -89 138 -35 39
              -48 47 -88 51 -44 5 -50 3 -83 -30 -32 -32 -35 -40 -35 -92 0 -40 9 -79 31
              -133 38 -98 162 -336 268 -516 44 -76 81 -142 81 -146 0 -4 -40 -34 -89 -67
              -130 -86 -286 -218 -454 -386 -132 -132 -152 -157 -183 -224 -39 -86 -42 -119
              -15 -171 49 -94 360 -337 586 -457 68 -36 126 -69 129 -74 3 -4 -23 -53 -57
              -108 -34 -56 -83 -141 -110 -190 -26 -48 -67 -123 -91 -167 -97 -174 -78 -296
              47 -296 89 0 108 23 316 382 73 125 139 232 147 238 17 15 33 12 159 -35 223
              -83 529 -145 712 -145 78 0 94 -3 101 -17 5 -10 12 -88 16 -173 18 -424 41
              -500 148 -500 55 0 77 15 101 68 21 45 22 58 19 339 l-2 292 37 6 c337 55 528
              110 786 229 43 20 83 36 90 36 7 0 82 -104 167 -232 161 -240 223 -319 271
              -343 95 -49 186 27 165 138 -10 52 -143 276 -283 478 -35 49 -63 93 -63 98 0
              5 42 35 93 67 196 124 426 294 488 360 85 92 102 167 53 240 -14 21 -108 120
              -207 219 -179 178 -327 305 -439 380 -32 21 -58 40 -58 42 0 2 19 32 42 66 39
              58 88 123 290 382 112 143 133 221 73 280 -47 48 -117 45 -183 -8 -75 -59
              -209 -221 -425 -511 -21 -28 -42 -52 -47 -54 -4 -2 -55 17 -114 42 -231 99
              -501 166 -716 178 l-45 3 -7 115 c-4 63 -11 241 -16 395 -8 252 -11 285 -30
              328 -16 36 -30 51 -56 62 -20 8 -39 14 -43 14 -4 -1 -18 -4 -30 -6z m-489
              -1375 c-216 -227 -307 -527 -244 -810 33 -149 98 -263 244 -427 l21 -23 -55 7
              c-269 35 -805 247 -1058 419 -155 105 -172 118 -172 130 0 22 199 199 343 304
              85 62 338 201 477 262 52 23 135 60 183 82 119 54 235 95 272 97 l29 1 -40
              -42z m1289 -33 c332 -133 603 -291 788 -462 52 -48 108 -99 124 -112 l28 -24
              -34 -28 c-97 -82 -407 -278 -559 -354 -136 -68 -307 -141 -410 -175 -118 -39
              -273 -81 -278 -76 -2 2 26 34 61 70 70 71 141 171 189 267 69 139 105 382 79
              534 -23 129 -90 285 -162 376 -57 72 -45 71 174 -16z"/>
              </g>
            )}
            {blinkFrame === "half" && (
              <g transform="translate(0.000000,497.000000) scale(0.100000,-0.100000)"
              fill="currentColor" stroke="none">
              <path d="M2510 3992 c-75 -37 -90 -130 -90 -569 0 -278 -1 -293 -18 -293 -111
              0 -594 -61 -798 -101 -99 -19 -168 -29 -174 -23 -18 19 -169 275 -215 364
              -133 263 -184 330 -250 330 -97 0 -138 -80 -104 -205 16 -58 94 -215 199 -404
              50 -89 89 -168 87 -175 -3 -6 -31 -20 -63 -30 -188 -58 -571 -283 -610 -358
              -20 -39 -18 -117 5 -155 11 -17 46 -49 78 -71 85 -58 343 -184 457 -223 54
              -19 100 -40 103 -47 3 -7 -6 -27 -19 -45 -13 -17 -42 -63 -65 -102 -22 -38
              -66 -114 -98 -168 -91 -154 -105 -238 -50 -293 20 -20 34 -24 81 -24 56 0 59
              2 103 48 26 26 102 141 171 255 69 115 136 222 150 238 l25 30 144 -26 c218
              -39 464 -65 683 -72 169 -5 198 -8 202 -22 3 -9 7 -97 11 -196 11 -283 20
              -368 45 -413 56 -100 158 -95 212 11 20 41 21 50 15 330 -5 220 -3 289 6 292
              7 2 77 11 157 19 187 19 397 65 734 162 47 13 50 13 65 -8 60 -83 134 -190
              206 -298 103 -154 160 -216 209 -226 56 -10 102 3 131 38 24 28 27 39 23 83
              -6 57 -39 117 -199 356 -55 83 -97 154 -92 158 4 4 62 27 128 51 215 78 384
              159 437 210 45 44 48 49 48 98 0 47 -4 57 -39 95 -24 25 -74 59 -123 84 -159
              80 -313 150 -397 179 -46 15 -85 34 -88 41 -6 15 149 258 252 393 82 110 110
              172 102 226 -7 44 -31 72 -75 91 -41 17 -95 3 -145 -38 -46 -38 -216 -266
              -322 -432 -48 -76 -94 -141 -102 -144 -9 -3 -38 0 -67 6 -289 71 -468 98 -713
              110 -84 4 -155 10 -159 13 -3 3 -9 174 -14 380 -7 346 -9 378 -28 414 -21 40
              -66 74 -99 74 -10 0 -34 -8 -53 -18z m967 -1317 c233 -38 625 -133 638 -155 7
              -11 -92 -42 -223 -70 -56 -11 -139 -32 -184 -45 -44 -14 -127 -34 -182 -45
              -56 -10 -155 -31 -221 -45 -176 -37 -177 -36 -121 42 72 102 81 128 81 240 l0
              103 27 0 c15 0 98 -11 185 -25z m-1679 -67 c-17 -105 10 -199 82 -293 22 -29
              40 -55 40 -60 0 -15 -294 18 -490 56 -257 48 -550 128 -550 149 0 8 107 39
              205 60 28 6 95 21 150 35 55 13 163 35 240 50 77 14 169 32 205 40 36 7 79 13
              96 14 l31 1 -9 -52z"/>
              </g>
            )}
            {blinkFrame === "closed" && (
              <g transform="translate(0.000000,497.000000) scale(0.100000,-0.100000)"
              fill="currentColor" stroke="none">
              <path d="M2376 3739 c-39 -31 -54 -66 -67 -165 -12 -94 -9 -374 11 -867 6
              -142 8 -263 5 -268 -14 -21 -360 -2 -725 41 -91 11 -172 20 -181 20 -9 0 -35
              35 -64 88 -27 48 -67 119 -91 158 -66 111 -161 304 -236 484 -74 176 -93 205
              -144 219 -44 12 -79 3 -114 -29 -27 -26 -30 -34 -30 -93 0 -39 10 -98 24 -148
              34 -115 129 -349 170 -418 36 -60 106 -196 106 -207 0 -18 -197 13 -359 56
              -103 27 -198 25 -232 -5 -30 -27 -48 -74 -42 -108 7 -34 52 -81 104 -107 77
              -40 262 -89 463 -124 49 -8 91 -17 93 -20 5 -5 -87 -173 -127 -231 -15 -22
              -65 -116 -111 -210 -72 -146 -84 -179 -87 -232 -4 -58 -2 -64 26 -93 25 -25
              38 -30 78 -30 44 0 51 4 93 48 25 26 78 101 117 167 39 66 127 213 194 328
              l123 207 41 0 c23 0 122 -9 221 -19 159 -17 316 -30 593 -47 74 -5 82 -8 86
              -27 3 -12 10 -192 16 -400 8 -268 15 -391 25 -425 29 -97 120 -140 183 -87 58
              49 62 80 62 532 l0 403 23 4 c12 3 92 7 177 11 194 7 470 46 639 90 69 18 70
              17 103 -40 6 -11 52 -83 103 -160 96 -147 119 -184 209 -331 62 -102 98 -138
              155 -155 86 -26 148 31 139 127 -7 75 -107 267 -260 497 -43 65 -78 122 -78
              127 0 5 17 12 38 15 199 34 433 96 512 135 70 36 110 87 110 140 -1 93 -118
              137 -243 90 -116 -43 -397 -95 -397 -73 0 3 45 91 100 194 128 241 209 411
              221 471 19 89 -18 148 -94 148 -91 0 -157 -73 -272 -300 -31 -63 -90 -176
              -129 -250 -39 -74 -87 -175 -107 -225 -25 -64 -43 -94 -60 -102 -59 -30 -486
              -91 -755 -109 l-102 -6 -6 28 c-3 16 -10 124 -16 239 -5 116 -13 230 -16 254
              -3 25 -9 189 -13 365 -8 352 -11 369 -70 419 -41 34 -96 36 -135 6z"/>
              </g>
            )}
          </svg>
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "1em", textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink, whiteSpace: "nowrap" }}>
            Apocalypse Archives
          </div>
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>
          {mode === "login" ? "Log in to sync your trades." : "Create an account to get started."}
        </div>

        {/* Segmented tabs — replaces the old bottom text-link switch */}
        <div style={{
          display: "flex", background: C.inputBg, borderRadius: 12, padding: 4, marginBottom: 20,
        }}>
          {["login", "signup"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className="auth-tab"
              style={{
                flex: 1, border: "none", borderRadius: 9, padding: "9px 0",
                fontFamily: SANS, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                background: mode === m ? C.paper : "transparent",
                color: mode === m ? C.ink : C.muted,
                boxShadow: mode === m ? "0 1px 3px rgba(20,20,19,0.08)" : "none",
              }}
            >
              {m === "login" ? "Log In" : "Sign Up"}
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
            borderRadius: 14, display: "block", marginBottom: 20,
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
                width: "100%", background: C.inputBg,
                border: `1px solid ${error ? C.rustRed : C.line}`, borderRadius: 12, padding: "12px 14px",
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
                  style={{ background: "transparent", border: "none", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: SANS }}
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
                width: "100%", background: C.inputBg,
                border: `1px solid ${error ? C.rustRed : C.line}`, borderRadius: 12, padding: "12px 14px",
                fontSize: 15, color: C.ink, fontFamily: SANS,
              }}
            />
          </div>

          {error && (
            <div style={{ background: C.rustWash, color: C.rustRed, borderRadius: 10, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{ background: C.sageWash, color: C.sage, borderRadius: 10, padding: "10px 12px", fontSize: 13, marginBottom: 16 }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="auth-submit"
            style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
              background: C.clay, color: "#FFFFFF", fontWeight: 700, fontSize: 15,
              cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>
      </div>
      <div style={{ fontSize: 9, color: C.faint, marginTop: 16, fontFamily: SANS, opacity: 0.7 }}>
        &copy; {new Date().getFullYear()} Apocalypse Archives. All rights reserved.
      </div>
      </div>
    </div>
  );
            }
