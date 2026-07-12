// ============================================================================
// utils/format.js
// -----------------------------------------------------------------------------
// uid()   -> id acak untuk trade/opsi baru
// fmtR()  -> format angka R jadi "+1.50R" / "-0.80R"
// fileToCompressedDataURL() -> kompres foto trade jadi JPEG base64 kecil
//   sebelum disimpan, karena foto disimpan langsung di dalam dokumen
//   Firestore yang sama (bukan Firebase Storage terpisah), jadi harus
//   dijaga di bawah limit 1MB per dokumen.
// ============================================================================

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Trade images are stored inline as base64 data URLs inside the same
// Firestore document as everything else (no Storage bucket wired up),
// so every image gets downscaled + re-encoded as JPEG here first —
// otherwise a couple of full-res phone photos would blow past
// Firestore's 1MB-per-document limit almost immediately.
export function fileToCompressedDataURL(file, maxDim = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function fmtR(n) {
  const v = Number(n) || 0;
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}R`;
}
