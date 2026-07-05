// src/gemini.js
// Manggil Gemini API langsung dari browser (client-side).
// Key diambil dari environment variable VITE_GEMINI_API_KEY yang di-set
// lewat GitHub Actions Secret (lihat README/percakapan setup).

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {string} systemInstruction
 * @returns {Promise<string>}
 */
export async function askGemini(history, systemInstruction = "") {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY belum ter-set. Cek GitHub Secret & workflow build.");
  }

  const contents = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const body = {
    contents,
    ...(systemInstruction && {
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
    generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
  };

  const res = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!reply) throw new Error("Gemini tidak mengembalikan jawaban. Coba lagi.");
  return reply;
}
