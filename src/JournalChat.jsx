// src/JournalChat.jsx
// Komponen chat AI — satu mode gabungan (chat bebas + refleksi trading).
// Konteks 5 trade terbaru otomatis disertakan ke AI kalau ada.
// Riwayat chat disimpan permanen di users/{uid}.chatMessages

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { askGemini } from "./gemini";
import { loadUserData, saveUserData } from "./store";

const SANS = "'Lora', 'Georgia', serif";

const SYSTEM_PROMPT =
  "Kamu adalah teman ngobrol sekaligus teman refleksi trading di aplikasi trading journal bernama Apocalypse Archives. Jawab hangat, ringkas, dalam Bahasa Indonesia. Kalau pengguna diberi konteks trade terbaru mereka (simbol, arah, hasil R, kepatuhan pada rules, emosi saat itu, catatan), bantu mereka merefleksikan pola perilaku dan emosinya saat trading dengan empati dan tanpa menghakimi, tanpa membuat diagnosis psikologis apapun. Kalau pengguna cuma mau ngobrol santai, ikuti saja obrolannya seperti biasa.";

const MAX_TEXTAREA_HEIGHT = 160;

export default function JournalChat({ user, trades, theme }) {
  const C = theme;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

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

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [input]);

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

    const userMsg = { role: "user", content: text, ts: Date.now() };
    const withUserMsg = [...messages, userMsg];
    setMessages(withUserMsg);

    try {
      const historyForChat = withUserMsg.map((m) => ({ role: m.role, content: m.content }));

      let systemInstruction = SYSTEM_PROMPT;
      const context = buildTradeContext();
      if (context) systemInstruction += `\n\n${context}`;

      const reply = await askGemini(historyForChat, systemInstruction);
      const aiMsg = { role: "assistant", content: reply, ts: Date.now() };
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

  return (
    <div
      style={{
        maxWidth: 640,
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 210px)",
        minHeight: 420,
        maxHeight: 720,
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes chatSpin { to { transform: rotate(360deg); } }
        .chat-input, .chat-input:focus { border-color: ${C.inputBorder} !important; }
        .chat-messages { scrollbar-width: thin; scrollbar-color: ${C.line} transparent; }
        .chat-messages::-webkit-scrollbar { width: 5px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 10px; }
        .chat-input::-webkit-scrollbar { width: 5px; }
        .chat-input::-webkit-scrollbar-track { background: transparent; }
        .chat-input::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "16px 20px",
          borderBottom: `1px solid ${C.line}`,
          fontWeight: 700,
          fontSize: 15,
          fontFamily: SANS,
          color: C.ink,
        }}
      >
        <Sparkles size={17} />
        Asisten AI
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {!loaded ? (
          <div style={{ color: C.faint, fontSize: 14 }}>Memuat...</div>
        ) : messages.length === 0 ? (
          <div style={{ color: C.faint, fontSize: 14, textAlign: "center", marginTop: 40 }}>
            Mulai obrolan dengan asisten kamu — bebas ngobrol atau refleksi soal trading kamu.
          </div>
        ) : (
          messages.map((m, i) => (
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
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Write a message..."
          style={{
            flex: 1, resize: "none", background: C.inputBg, border: `1px solid ${C.inputBorder}`,
            borderRadius: 12, padding: "10px 14px", color: C.inputText, fontFamily: SANS, fontSize: 14, outline: "none",
            lineHeight: 1.4, maxHeight: MAX_TEXTAREA_HEIGHT, overflowY: "hidden",
          }}
        />
        <button
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 40, height: 40, flexShrink: 0,
            background: C.clay, color: C.paper, border: "none", borderRadius: "50%",
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
