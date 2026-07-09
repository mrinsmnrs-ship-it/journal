// src/JournalChat.jsx
// Komponen chat AI — persona "Rei" (Journal Assistant).
// Konteks 5 trade terbaru otomatis disertakan ke AI kalau ada.
// Riwayat chat disimpan permanen di users/{uid}.chatMessages, dan direset
// setiap 24 jam sejak aktivitas terakhir — tapi sebelum direset, percakapan
// diringkas jadi "chatMemory" yang tetap dipakai supaya Rei tetap
// nyambung & kenal pengguna walau tampilan chat sudah bersih.

import { useState, useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { askGemini } from "./gemini";
import { loadUserData, saveUserData } from "./store";

// Font disatukan dengan App.jsx & AuthScreen.jsx — Inter di semua tempat,
// termasuk bubble chat, supaya tidak ada halaman yang terasa "beda app".
const CHAT_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SANS = CHAT_FONT;

const PERSONA_NAME = "Rei";
const PERSONA_TITLE = "Journal Assistant";

const SYSTEM_PROMPT_BASE =
  `Kamu adalah ${PERSONA_NAME}, ${PERSONA_TITLE} di aplikasi trading journal bernama Apocalypse Archives — teman ngobrol sekaligus teman refleksi trading. Jawab hangat, ringkas, dalam Bahasa Indonesia. Kalau pengguna diberi konteks trade terbaru mereka (simbol, arah, hasil R, kepatuhan pada rules, emosi saat itu, catatan), bantu mereka merefleksikan pola perilaku dan emosinya saat trading dengan empati dan tanpa menghakimi, tanpa membuat diagnosis psikologis apapun. Kalau pengguna cuma mau ngobrol santai, ikuti saja obrolannya seperti biasa.`;

const INTRO_MESSAGE =
  `Halo, aku ${PERSONA_NAME} — ${PERSONA_TITLE} kamu di Apocalypse Archives. Aku di sini buat nemenin ngobrol atau bantu kamu merefleksikan trading kamu, kapan pun kamu butuh. Ada yang mau diobrolin?`;

const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 jam
const MAX_TEXTAREA_HEIGHT = 160;

function isCoarsePointer() {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
}

// Ringkas percakapan lama jadi catatan jangka panjang tentang pengguna,
// digabung dengan ringkasan sebelumnya (kalau ada), supaya "kenal" pengguna
// tetap terjaga meski tampilan chat direset tiap 24 jam.
async function summarizeForMemory(oldMessages, previousMemory) {
  const transcript = oldMessages
    .map((m) => `${m.role === "user" ? "Pengguna" : PERSONA_NAME}: ${m.content}`)
    .join("\n");

  const prompt =
    `Berikut transkrip percakapan sebelumnya antara pengguna dan asisten trading journal bernama ${PERSONA_NAME}:\n\n${transcript}\n\n` +
    (previousMemory ? `Catatan ringkasan sebelumnya tentang pengguna:\n${previousMemory}\n\n` : "") +
    `Buatkan ringkasan singkat (maksimal 8 poin) berisi fakta, preferensi, kebiasaan trading, dan konteks personal penting tentang pengguna yang perlu diingat untuk percakapan-percakapan berikutnya, supaya asisten tetap terasa mengenal pengguna meskipun riwayat chat sudah direset. Jangan sertakan basa-basi, cukup poin-poinnya saja dalam Bahasa Indonesia.`;

  const summary = await askGemini([{ role: "user", content: prompt }], "");
  return summary.trim();
}

export default function JournalChat({ user, trades, theme }) {
  const C = theme;
  const [messages, setMessages] = useState([]);
  const [chatMemory, setChatMemory] = useState("");
  const [needsIntro, setNeedsIntro] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    (async () => {
      const data = await loadUserData(user.uid);
      const storedMessages = data.chatMessages || [];
      const storedMemory = data.chatMemory || "";
      const lastActive = data.chatLastActive || null;
      const expired = lastActive && Date.now() - lastActive > RESET_INTERVAL_MS;

      if (expired && storedMessages.length > 0) {
        // Sudah lebih dari 24 jam sejak pesan terakhir: ringkas dulu supaya
        // "ingatan" tentang pengguna tidak hilang, baru kosongkan chat.
        let mergedMemory = storedMemory;
        try {
          mergedMemory = await summarizeForMemory(storedMessages, storedMemory);
        } catch (e) {
          console.error("Gagal meringkas chat lama, memory lama dipertahankan:", e);
        }
        setChatMemory(mergedMemory);
        setMessages([]);
        setNeedsIntro(true);
        await saveUserData(user.uid, {
          chatMessages: [],
          chatMemory: mergedMemory,
          chatLastActive: Date.now(),
        });
      } else {
        setChatMemory(storedMemory);
        setMessages(storedMessages);
        setNeedsIntro(storedMessages.length === 0);
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        `- ${t.date} ${t.symbol} (${t.direction}), hasil: ${t.rActual}R, rules: ${t.rules || "-"}, emosi: ${t.emotion || "-"}, catatan: ${t.notes || "-"}`
    );
    return `Berikut 5 trade terbaru milik pengguna:\n${lines.join("\n")}`;
  }

  function buildSystemInstruction() {
    let systemInstruction = SYSTEM_PROMPT_BASE;
    if (chatMemory) {
      systemInstruction += `\n\nCatatan tentang pengguna dari percakapan-percakapan sebelumnya (pakai ini supaya kamu tetap terasa kenal & nyambung dengan pengguna, tapi jangan menyebut ini sebagai "catatan"/"ringkasan" ke pengguna kecuali relevan):\n${chatMemory}`;
    }
    const tradeContext = buildTradeContext();
    if (tradeContext) systemInstruction += `\n\n${tradeContext}`;
    return systemInstruction;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    setError(null);
    setIsSending(true);

    const shouldIntro = needsIntro;
    if (shouldIntro) setNeedsIntro(false);

    const userMsg = { role: "user", content: text, ts: Date.now() };
    let withUserMsg = [...messages, userMsg];

    if (shouldIntro) {
      const introMsg = { role: "assistant", content: INTRO_MESSAGE, ts: Date.now() - 1 };
      withUserMsg = [introMsg, ...withUserMsg];
    }
    setMessages(withUserMsg);

    try {
      const historyForChat = withUserMsg.map((m) => ({ role: m.role, content: m.content }));
      const systemInstruction = buildSystemInstruction();
      const reply = await askGemini(historyForChat, systemInstruction);
      const aiMsg = { role: "assistant", content: reply, ts: Date.now() };
      const finalMessages = [...withUserMsg, aiMsg];

      setMessages(finalMessages);
      await saveUserData(user.uid, { chatMessages: finalMessages, chatLastActive: Date.now() });
    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !isCoarsePointer()) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        background: "transparent",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${C.faint};
          display: inline-block;
          animation: typingBounce 1.2s infinite ease-in-out;
        }
        .chat-input, .chat-input:focus { border-color: transparent !important; }
        .chat-messages { scrollbar-width: thin; scrollbar-color: ${C.line} transparent; }
        .chat-messages::-webkit-scrollbar { width: 5px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 10px; }
        .chat-input::-webkit-scrollbar { width: 5px; }
        .chat-input::-webkit-scrollbar-track { background: transparent; }
        .chat-input::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 10px; }

        /* Padding kiri-kanan bereskala mengikuti lebar panel (bukan angka
           tetap), jadi tetap terasa penuh & seimbang di layar sempit
           maupun sangat lebar. Lebar bubble juga proporsional lewat
           persentase, bukan px tetap. */
        .chat-messages { padding: 18px clamp(14px, 5%, 56px); }
        .chat-input-wrap { padding: 14px clamp(6px, 3%, 40px) 8px; }
        .chat-bubble { max-width: min(80%, 720px); }

        /* Kotak input: radius disamakan dengan kotak-kotak lain di app
           (card/date-box = 8px), dan diberi shadow "raised" tipis khas
           Claude yang keluar (bukan inset), makin jelas saat difokuskan. */
        .chat-input-box {
          transition: box-shadow .15s ease, border-color .15s ease;
          box-shadow: 0 1px 2px rgba(20,20,19,0.06), 0 1px 1px rgba(20,20,19,0.04);
        }
        .chat-input-box:focus-within {
          box-shadow: 0 1px 3px rgba(20,20,19,0.08), 0 3px 8px rgba(20,20,19,0.07);
        }
      `}</style>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {!loaded ? (
          <div style={{ color: C.faint, fontSize: 15 }}>Memuat...</div>
        ) : messages.length === 0 ? (
          <div style={{ color: C.faint, fontSize: 15, textAlign: "center", marginTop: 40 }}>
            Mulai obrolan dengan {PERSONA_NAME} — bebas ngobrol atau refleksi soal trading kamu.
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                className="chat-bubble"
                style={{
                  padding: m.role === "user" ? "11px 16px" : "0",
                  borderRadius: m.role === "user" ? 8 : 0,
                  background: m.role === "user" ? C.paperSoft : "transparent",
                  border: m.role === "user" ? `1px solid ${C.line}` : "none",
                  boxShadow: m.role === "user" ? "0 1px 2px rgba(20,20,19,0.05)" : "none",
                  color: C.ink,
                  fontSize: 15,
                  fontFamily: CHAT_FONT,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}

        {isSending && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ display: "flex", gap: 4, padding: "6px 0" }}>
              <span className="typing-dot" style={{ animationDelay: "0s" }} />
              <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
              <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}

        {error && (
  <div style={{ color: C.faint, fontSize: 11, fontFamily: CHAT_FONT, textAlign: "center" }}>
    {error}
  </div>
)}
        <div ref={scrollRef} />
      </div>

      {/* Input — satu kotak border, textarea di atas, pill persona + tombol kirim di bawah (mirip layout Claude) */}
      <div className="chat-input-wrap">
        <div
          className="chat-input-box"
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 8,
            background: C.paper,
            padding: "14px 12px 12px 18px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Write a message..."
            style={{
              width: "100%",
              display: "block",
              resize: "none", background: "transparent", border: "none",
              padding: "0 0 10px 0", color: C.inputText, fontFamily: CHAT_FONT, fontSize: 15, outline: "none",
              lineHeight: 1.45, maxHeight: MAX_TEXTAREA_HEIGHT, overflowY: "hidden",
              overflowWrap: "anywhere", wordBreak: "break-word",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: C.paperSoft,
                border: `1px solid ${C.line}`,
                boxShadow: "none",
                borderRadius: 6,
                padding: "6px 13px",
                height: 30,
                boxSizing: "border-box",
                fontFamily: CHAT_FONT,
                fontSize: 12,
                fontWeight: 400,
                color: C.muted,
              }}
            >
              {PERSONA_NAME}
              <span style={{ color: C.faint, margin: "0 5px" }}>•</span>
              <span style={{ color: C.muted }}>{PERSONA_TITLE}</span>
            </div>
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 30, height: 30, flexShrink: 0,
                background: C.ink, color: C.paper, border: "none", borderRadius: "50%",
                cursor: isSending || !input.trim() ? "not-allowed" : "pointer",
                opacity: isSending ? 1 : (!input.trim() ? 0.3 : 1),
                boxShadow: !isSending && input.trim() ? "0 1px 2px rgba(20,20,19,0.08)" : "none",
              }}
            >
              {isSending ? (
                <Square size={11} strokeWidth={2.4} fill={C.paper} style={{ borderRadius: 3 }} />
              ) : (
                <ArrowUp size={14} strokeWidth={2.4} />
              )}
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: C.faint, marginTop: 11, fontFamily: CHAT_FONT }}>
          {PERSONA_NAME} is an AI and can make mistakes. Please double-check important information.
        </div>
      </div>
    </div>
  );
}
