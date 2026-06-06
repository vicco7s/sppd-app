import { model, db } from "@/services/firebases";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

/**
 * Fetch recent kwitansi history for AI learning context
 */
export const fetchRecentKeperluan = async () => {
  try {
    const q = query(
      collection(db, "kwitansi"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const snapshot = await getDocs(q);
    const records = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.keperluan && data.namaRekeningBelanja) {
        records.push({
          keperluan: data.keperluan,
          namaRekeningBelanja: data.namaRekeningBelanja,
          kodeRekening: data.kodeRekening || "",
          nominal: data.nominal || 0,
        });
      }
    });
    return records;
  } catch (err) {
    console.warn("Failed to fetch kwitansi history:", err);
    return [];
  }
};

/**
 * Build context string from form data for AI prompt
 */
export const buildFormContext = (formData) => {
  return [
    `Program: ${formData.program || "-"}`,
    `Kegiatan: ${formData.kegiatan || "-"}`,
    `Sub Kegiatan: ${formData.subKegiatan || "-"}`,
    `Kode Rekening: ${formData.kodeRekening || "-"}`,
    `Nama Rekening Belanja: ${formData.namaRekeningBelanja || "-"}`,
    `Penerima: ${formData.namaRekening || "-"}`,
    `Nominal: Rp ${Number(formData.nominal).toLocaleString("id-ID") || "-"}`,
    `Tanggal: ${formData.tanggal || "-"}`,
  ].join("\n");
};

/**
 * Generate keperluan suggestions using Gemini AI
 * @param {Object} formData - Current form data
 * @param {Array} recentHistory - Array of recent kwitansi records
 * @returns {Promise<string[]>} Array of suggestion strings
 */
export const generateKeperluanSuggestions = async (formData, recentHistory = []) => {
  const context = buildFormContext(formData);

  const historyExamples =
    recentHistory.length > 0
      ? `\n\nBerikut adalah contoh riwayat input sebelumnya (gunakan sebagai referensi gaya penulisan pengguna):\n${recentHistory
          .map(
            (r, i) =>
              `${i + 1}. [${r.namaRekeningBelanja}] → "${r.keperluan}"`
          )
          .join("\n")}`
      : "";

  const prompt = `Anda adalah asisten administrasi keuangan pemerintah yang sudah terbiasa dengan gaya penulisan pengguna. Berdasarkan data berikut, buatkan 3 opsi kalimat "Keperluan / Perihal" untuk kwitansi pembayaran.

Data Kwitansi Saat Ini:
${context}${historyExamples}

Instruksi:
1. Buat 3 opsi yang SESUAI dengan gaya penulisan pengguna dari contoh riwayat di atas.
2. Gunakan bahasa Indonesia formal yang baku.
3. Setiap opsi maksimal 1-2 kalimat.
4. Jika data mengandung "Perjalanan Dinas", gunakan istilah yang sesuai.
5. Variasikan opsi: satu mirip riwayat, satu lebih ringkas, satu lebih detail.
6. Kembalikan HANYA array JSON tanpa markdown: ["opsi 1", "opsi 2", "opsi 3"]`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const suggestions = JSON.parse(cleanJson);

  if (Array.isArray(suggestions) && suggestions.length > 0) {
    return suggestions;
  }
  throw new Error("Invalid AI response format");
};

/**
 * Generate fallback keperluan based on form data pattern
 */
export const perjadinKeperluan = (formData) => {
  const isPerjadin =
    formData.namaRekeningBelanja?.toLowerCase().includes("perjalanan dinas") ||
    formData.kodeRekening?.toLowerCase().includes("5.1.02.04.01");
  if (isPerjadin) {
    return `Pembayaran Biaya Perjalanan Dinas Dalam Kota atas nama ${formData.namaRekening || "pegawai"} dengan nominal Rp ${Number(formData.nominal).toLocaleString("id-ID")}`;
  }
  return `Pembayaran ${formData.namaRekeningBelanja || "kegiatan"} atas nama ${formData.namaRekening || "penerima"} sebesar Rp ${Number(formData.nominal).toLocaleString("id-ID")}`;
};
