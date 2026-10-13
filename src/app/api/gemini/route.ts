import { NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_AI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_AI_KEY belum dikonfigurasi di file .env.local" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    if (action === "autofill") {
      const { fileBase64, mimeType } = body;
      if (!fileBase64 || !mimeType) {
        return NextResponse.json(
          { error: "File base64 dan mimeType wajib disertakan untuk autofill" },
          { status: 400 }
        );
      }

      const prompt = `
Anda adalah asisten AI spesialis administrasi pemerintahan (Kecamatan Salam Babaris, Kabupaten Tapin).
Tugas Anda adalah membaca dokumen surat undangan atau dokumen dinas terlampir dan mengekstrak informasi perjalanan dinas secara akurat.

Kembalikan HANYA format JSON valid tanpa format markdown (tanpa \`\`\`json) dengan struktur persis seperti ini:
{
  "noSurat": "Nomor surat jika ada (contoh: 900.1.3/548/BKAD-PBH/V/2026)",
  "suratDari": "Pengirim surat lengkap beserta nomor jika ada (contoh: Surat dari BKAD Tapin Nomor: 900.1.3/548/BKAD-PBH/V/2026)",
  "tanggalSurat": "YYYY-MM-DD",
  "perihalSurat": "Perihal surat undangan (contoh: Undangan FGD)",
  "maksudPerjalanan": "Maksud atau tujuan perjalanan dinas (buat kalimat formal lengkap, contoh: Mengikuti Undangan FGD Pengelolaan TKD Kabupaten Tapin Tahun Anggaran 2026)",
  "tempatTujuan": "Lokasi spesifik kegiatan (contoh: Hotel Aria Barito Banjarmasin)",
  "tanggalBerangkat": "YYYY-MM-DD",
  "tanggalKembali": "YYYY-MM-DD",
  "lamaHari": 3,
  "lamaMalam": 2,
  "peserta": ["Nama peserta jika tertera di dokumen"]
}

Aturan penting:
1. Jika tanggal pelaksanaan hanya 1 hari, maka tanggalBerangkat dan tanggalKembali sama, lamaHari = 1, lamaMalam = 0.
2. Format tanggal wajib YYYY-MM-DD.
3. Kembalikan HANYA teks JSON valid.
`;

      const geminiPayload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: fileBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2,
        },
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error (Autofill):", response.status, errorText);

        if (response.status === 429) {
          return NextResponse.json(
            { error: "Limit kuota AI Gemini tercapai. Silakan coba lagi dalam beberapa detik." },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: `Gagal memproses dokumen dengan AI Gemini (Kode: ${response.status}).` },
          { status: response.status }
        );
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return NextResponse.json(
          { error: "AI tidak dapat membaca teks dari dokumen yang diunggah." },
          { status: 422 }
        );
      }

      const parsed = JSON.parse(cleanJsonString(rawText));
      return NextResponse.json({ success: true, data: parsed });
    }

    if (action === "generate-laporan") {
      const { perihal, maksud, tempat, tanggalBerangkat, tanggalKembali, peserta } = body;

      const prompt = `
Anda adalah penyusun laporan resmi perjalanan dinas pemerintah (Kecamatan Salam Babaris, Kabupaten Tapin).
Berdasarkan rincian kegiatan berikut:
- Perihal: ${perihal || "-"}
- Maksud/Keperluan: ${maksud || "-"}
- Tempat/Tujuan: ${tempat || "-"}
- Tanggal Pelaksanaan: ${tanggalBerangkat || "-"} s/d ${tanggalKembali || "-"}
- Pelaksana: ${Array.isArray(peserta) ? peserta.join(", ") : peserta || "-"}

Tolong susun 4 bagian laporan perjalanan dinas luar daerah:
1. kegiatan: Kegiatan yang dilaksanakan (uraikan poin-poin kegiatan resmi dengan tanda strip '-')
2. hasil: Hasil yang dicapai (uraikan poin-poin hasil substantif, wawasan/kesepakatan yang diperoleh)
3. kesimpulanSaran: Kesimpulan dan saran rekomendasi tindak lanjut bagi Kecamatan Salam Babaris
4. penutup: Paragraf penutup formal pertanggungjawaban kegiatan

Kembalikan HANYA JSON valid tanpa formatting markdown lain dengan struktur:
{
  "kegiatan": "- Melakukan registrasi...",
  "hasil": "- Diperoleh pemahaman mengenai...",
  "kesimpulanSaran": "- Kesimpulan: ...\\n- Saran: ...",
  "penutup": "Demikian laporan perjalanan dinas ini disusun sebagai bentuk pertanggungjawaban..."
}
`;

      const geminiPayload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.5,
        },
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error (Generate Laporan):", response.status, errorText);

        if (response.status === 429) {
          return NextResponse.json(
            { error: "Limit kuota AI Gemini tercapai. Silakan coba beberapa saat lagi." },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: `Gagal menghasilkan laporan dengan AI Gemini (Kode: ${response.status}).` },
          { status: response.status }
        );
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return NextResponse.json(
          { error: "AI gagal menghasilkan draf laporan." },
          { status: 422 }
        );
      }

      const parsed = JSON.parse(cleanJsonString(rawText));
      return NextResponse.json({ success: true, data: parsed });
    }

    return NextResponse.json(
      { error: "Action tidak dikenal. Gunakan 'autofill' atau 'generate-laporan'." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Gemini Route Catch Error:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan internal pada server AI." },
      { status: 500 }
    );
  }
}
