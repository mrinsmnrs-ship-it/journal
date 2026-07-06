// src/JournalChat.jsx
// Komponen chat AI — persona "Nox Valerica" (Journal Assistant).
// Konteks 5 trade terbaru otomatis disertakan ke AI kalau ada.
// Riwayat chat disimpan permanen di users/{uid}.chatMessages, dan direset
// setiap 24 jam sejak aktivitas terakhir — tapi sebelum direset, percakapan
// diringkas jadi "chatMemory" yang tetap dipakai supaya Nox Valerica tetap
// nyambung & kenal pengguna walau tampilan chat sudah bersih.

import { useState, useEffect, useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { askGemini } from "./gemini";
import { loadUserData, saveUserData } from "./store";

const SANS = "'Lora', 'Georgia', serif";
const CHAT_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const PERSONA_NAME = "Nox Valerica";
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
        `- ${t.date} ${t.symbol} (${t.direction}), hasil: ${t.rActual}R, rules: ${t.rules || "-"}, emosi: ${(t.emotions || []).join(", ") || "-"}, catatan: ${t.notes || "-"}`
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
        maxWidth: 640,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        background: C.paper,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes chatSpin { to { transform: rotate(360deg); } }
        .chat-input, .chat-input:focus { border-color: transparent !important; }
        .chat-messages { scrollbar-width: thin; scrollbar-color: ${C.line} transparent; }
        .chat-messages::-webkit-scrollbar { width: 5px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 10px; }
        .chat-input::-webkit-scrollbar { width: 5px; }
        .chat-input::-webkit-scrollbar-track { background: transparent; }
        .chat-input::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 10px; }
      `}</style>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {!loaded ? (
          <div style={{ color: C.faint, fontSize: 14 }}>Memuat...</div>
        ) : messages.length === 0 ? (
          <div style={{ color: C.faint, fontSize: 14, textAlign: "center", marginTop: 40 }}>
            Mulai obrolan dengan {PERSONA_NAME} — bebas ngobrol atau refleksi soal trading kamu.
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "78%",
                  padding: m.role === "user" ? "10px 14px" : "0",
                  borderRadius: m.role === "user" ? 16 : 0,
                  background: m.role === "user" ? C.paperSoft : "transparent",
                  color: C.ink,
                  fontSize: 14,
                  fontFamily: CHAT_FONT,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
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
            <div style={{ padding: "10px 14px", borderRadius: 16, background: C.paperSoft, color: C.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <Loader2 size={14} style={{ animation: "chatSpin 1s linear infinite" }} />
              Sedang mengetik...
            </div>
          </div>
        )}

        {error && <div style={{ color: C.rustRed, fontSize: 12, textAlign: "center" }}>{error}</div>}
        <div ref={scrollRef} />
      </div>

      {/* Input — satu kotak border, textarea di atas, pill persona + tombol kirim di bawah (mirip layout Claude) */}
      <div style={{ padding: "14px 4px 6px" }}>
        <div
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 24,
            background: C.paper,
            padding: "12px 10px 10px 16px",
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
              padding: "0 0 8px 0", color: C.inputText, fontFamily: CHAT_FONT, fontSize: 14, outline: "none",
              lineHeight: 1.4, maxHeight: MAX_TEXTAREA_HEIGHT, overflowY: "hidden",
              overflowWrap: "anywhere", wordBreak: "break-word",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: C.paperSoft,
                borderRadius: 999,
                padding: "7px 14px",
                fontFamily: CHAT_FONT,
                fontSize: 12.5,
                fontWeight: 600,
                color: C.ink,
              }}
            >
              {PERSONA_NAME}
              <span style={{ color: C.faint, margin: "0 6px" }}>•</span>
              <span style={{ color: C.muted, fontWeight: 500 }}>{PERSONA_TITLE}</span>
            </div>
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, flexShrink: 0,
                background: C.ink, color: C.paper, border: "none", borderRadius: "50%",
                cursor: isSending || !input.trim() ? "not-allowed" : "pointer",
                opacity: isSending || !input.trim() ? 0.3 : 1,
              }}
            >
              <ArrowUp size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: C.faint, marginTop: 10, fontFamily: CHAT_FONT }}>
          {PERSONA_NAME} adalah AI dan dapat melakukan kesalahan. Harap periksa kembali jawaban.
        </div>
      </div>
    </div>
  );
    }
