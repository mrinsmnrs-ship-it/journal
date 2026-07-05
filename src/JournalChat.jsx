// src/JournalChat.jsx
// Komponen chat AI, dua mode: "Chat Bebas" dan "Refleksi Trading"
// (mode kedua otomatis kasih konteks 5 trade terbaru ke AI).
// Riwayat chat disimpan permanen di users/{uid}.chatMessages

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, MessageCircle, Loader2 } from "lucide-react";
import { askGemini } from "./gemini";
import { loadUserData, saveUserData } from "./store";

const SANS = "'Inter', system-ui, -apple-system, sans-serif";

const SYSTEM_PROMPTS = {
  general:
    "Kamu adalah asisten AI yang ramah di aplikasi trading journal bernama Apocalypse Archives. Jawab hangat, ringkas, dalam Bahasa Indonesia.",
  "journal-insight":
    "Kamu adalah teman refleksi trading. Kamu akan diberi beberapa trade terbaru milik pengguna sebagai konteks (simbol, arah, hasil R, kepatuhan pada rules, emosi saat itu, catatan). Bantu pengguna merefleksikan pola perilaku dan emosinya saat trading dengan empati dan tanpa menghakimi. Jangan membuat diagnosis psikologis apapun. Jawab dalam Bahasa Indonesia.",
};

export default function JournalChat({ user, trades, theme }) {
  const C = theme;
  const [mode, setMode] = useState("general");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      const data = await loadUserData(user.uid);
      setMessages(data.chatMessages || []);
      setLoaded(true);
    })();
  }, [user.uid]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  function buildTradeContext() {
    const recent = trades.slice(0, 5);
    if (recent.length === 0) return "";
    const lines = recent.map(
      (t) =>
        `- ${t.date} ${t.symbol} (${t.direction}), hasil: ${t.rActual}R, rules: ${t.rules || "-"}, emosi: ${(t.emotions || []).join(", ") || "-"}, catatan: ${t.notes || "-"}`
    );
    return `Berikut 5 trade terbaru milik pengguna:\n${lines.join("\n")}`;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    setError(null);
    setIsSending(true);

    const userMsg = { role: "user", content: text, mode, ts: Date.now() };
    const withUserMsg = [...messages, userMsg];
    setMessages(withUserMsg);

    try {
      const historyForMode = withUserMsg
        .filter((m) => m.mode === mode)
        .map((m) => ({ role: m.role, content: m.content }));

      let systemInstruction = SYSTEM_PROMPTS[mode];
      if (mode === "journal-insight") {
        const context = buildTradeContext();
        if (context) systemInstruction += `\n\n${context}`;
      }

      const reply = await askGemini(historyForMode, systemInstruction);
      const aiMsg = { role: "assistant", content: reply, mode, ts: Date.now() };
      const finalMessages = [...withUserMsg, aiMsg];

      setMessages(finalMessages);
      await saveUserData(user.uid, { chatMessages: finalMessages });
    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const visibleMessages = messages.filter((m) => m.mode === mode);

  return (
    <div
      style={{
        maxWidth: 640,
        display: "flex",
        flexDirection: "column",
        height: 560,
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes chatSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Header + mode switch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, fontFamily: SANS, color: C.ink }}>
          <Sparkles size={17} />
          Asisten AI
        </div>
        <div style={{ display: "flex", gap: 6, background: C.paperSoft, borderRadius: 999, padding: 4 }}>
          <button
            onClick={() => setMode("general")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: "none",
              background: mode === "general" ? C.clay : "transparent",
              color: mode === "general" ? C.paper : C.inkSoft,
              fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <MessageCircle size={13} /> Chat Bebas
          </button>
          <button
            onClick={() => setMode("journal-insight")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: "none",
              background: mode === "journal-insight" ? C.clay : "transparent",
              color: mode === "journal-insight" ? C.paper : C.inkSoft,
              fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Sparkles size={13} /> Refleksi Trading
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {!loaded ? (
          <div style={{ color: C.faint, fontSize: 14 }}>Memuat...</div>
        ) : visibleMessages.length === 0 ? (
          <div style={{ color: C.faint, fontSize: 14, textAlign: "center", marginTop: 40 }}>
            {mode === "general"
              ? "Mulai obrolan bebas dengan asisten kamu."
              : "Tanya soal pola atau emosi trading kamu di sini."}
          </div>
        ) : (
          visibleMessages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "78%", padding: "10px 14px", borderRadius: 16,
                  background: m.role === "user" ? C.clay : C.paperSoft,
                  color: m.role === "user" ? C.paper : C.ink,
                  fontSize: 14, fontFamily: SANS, whiteSpace: "pre-wrap", lineHeight: 1.5,
                }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "10px 14px", borderRadius: 16, background: C.paperSoft, color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <Loader2 size={14} style={{ animation: "chatSpin 1s linear infinite" }} />
              Sedang mengetik...
            </div>
          </div>
        )}

        {error && <div style={{ color: C.rustRed, fontSize: 12, textAlign: "center" }}>{error}</div>}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${C.line}`, padding: 14, display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={mode === "general" ? "Tulis pesan..." : "Tanya soal trading kamu..."}
          style={{
            flex: 1, resize: "none", background: C.inputBg, border: `1px solid ${C.inputBorder}`,
            borderRadius: 12, padding: "10px 14px", color: C.inputText, fontFamily: SANS, fontSize: 14, outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          style={{
            background: C.clay, color: C.paper, border: "none", borderRadius: 12, padding: "10px 14px",
            cursor: isSending || !input.trim() ? "not-allowed" : "pointer",
            opacity: isSending || !input.trim() ? 0.4 : 1,
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
