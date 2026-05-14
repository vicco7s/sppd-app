import { model } from '@/services/firebases';

/**
 * Converts a file to a Generative Part object for Gemini
 * @param {File} file 
 * @returns {Promise<{inlineData: {data: string, mimeType: string}}>}
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Parses a document using Gemini AI
 * @param {File} file - The uploaded document
 * @returns {Promise<Object>} - Structured JSON data
 */
export const parseSuratWithGemini = async (file) => {
  try {
    const filePart = await fileToGenerativePart(file);
    
    const prompt = `
      Anda adalah asisten administrasi cerdas. Tugas Anda adalah mengekstrak informasi dari dokumen surat undangan atau dokumen perjalanan dinas yang dilampirkan.
      
      Ekstrak data berikut dan kembalikan HANYA dalam format JSON bersih:
      - suratDari: Instansi atau pengirim surat (misal: "BKAD Kabupaten Tapin Nomor : ...")
      - perihalSurat: Inti atau perihal surat (misal: "Undangan Rapat Koordinasi")
      - tanggalSurat: Tanggal surat dikeluarkan dalam format YYYY-MM-DD
      - tujuan: Lokasi tujuan kegiatan (misal: "Aula BKAD Kabupaten Tapin")
      - tanggalBerangkat: Tanggal mulai kegiatan dalam format YYYY-MM-DD
      - tanggalKembali: Tanggal selesai kegiatan dalam format YYYY-MM-DD
      - untuk: Maksud atau tujuan perjalanan dinas (buat kalimat formal yang lengkap)
      - keterangan: Informasi tambahan jika ada, jika tidak ada isi "-"

      PENTING:
      1. Jika tanggal hanya satu hari, maka tanggalBerangkat dan tanggalKembali adalah sama.
      2. Gunakan format YYYY-MM-DD untuk semua tanggal.
      3. Pastikan output HANYA JSON, tanpa markdown formatting (tanpa \`\`\`json).
      
      Contoh Output:
      {
        "suratDari": "Sekretariat Daerah Kabupaten Tapin Nomor: 000.1/123/ORG",
        "perihalSurat": "Rapat Evaluasi Kinerja",
        "tanggalSurat": "2026-05-10",
        "tujuan": "Ruang Rapat Kantor Gubernur",
        "tanggalBerangkat": "2026-05-15",
        "tanggalKembali": "2026-05-15",
        "untuk": "Menghadiri Rapat Evaluasi Kinerja Organisasi Perangkat Daerah Tahun 2026",
        "keterangan": "-"
      }
    `;

    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON response (remove markdown if Gemini adds it despite instructions)
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON response:", text);
      throw new Error("Gagal memproses format data dari AI.");
    }
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw error;
  }
};
