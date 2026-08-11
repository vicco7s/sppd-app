"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, FileText, Check, Loader2, AlertCircle, Gauge } from "lucide-react";
import { generateContentWithRetry, getAiUsageStatus } from "@/lib/ai/callWithRetry";
import toast from "react-hot-toast";

export default function NotaAIModal({ isOpen, onClose, formData, onSelect }) {
    const [drafts, setDrafts] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [error, setError] = useState(null);
    const modalRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setDrafts(null);
            setSelectedDraft(null);
            setError(null);
            generateDrafts();
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, onClose]);

    const getJenisKegiatan = (perihal) => {
        const lower = perihal.toLowerCase();
        if (lower.includes("antar")) return "Administrasi Dokumen";
        if (lower.includes("hadir") || lower.includes("undang")) return "Kehadiran Kegiatan";
        if (lower.includes("koordinasi") || lower.includes("sinkronisasi")) return "Sinkronisasi Antar Instansi";
        if (lower.includes("monitor") || lower.includes("pantau") || lower.includes("evaluasi")) return "Pemantauan Kegiatan";
        if (lower.includes("konsultasi") || lower.includes("bimbingan") || lower.includes("konsult")) return "Pembahasan Permasalahan";
        if (lower.includes("survey") || lower.includes("survei") || lower.includes("data")) return "Pengumpulan Data Lapangan";
        return "Sesuai dengan konteks Perihal";
    };

    const buildSystemPrompt = () => {
        const perihal = formData.perihalSurat || "-";
        const tujuan = formData.tujuan || "-";
        const tanggalBerangkat = formData.tanggalBerangkat || "-";
        const tanggalKembali = formData.tanggalKembali || "-";
        const maksud = formData.untuk || "-";
        const keterangan = formData.keterangan || "-";
        const jenisKegiatan = getJenisKegiatan(perihal);

        return {
            prompt: `Anda adalah staf administrasi pemerintahan daerah yang berpengalaman dalam penyusunan Nota Dinas.

Tugas Anda adalah membuat isi Nota Dinas resmi pemerintah dengan bahasa Indonesia formal, ringkas, profesional, dan sesuai tata naskah dinas.

Gunakan hanya data yang diberikan.
Dilarang membuat informasi yang tidak tersedia.
Dilarang menambahkan asumsi.

Analisis Perihal terlebih dahulu untuk menentukan gaya bahasa.

Jenis Kegiatan: ${jenisKegiatan}

Buat 3 alternatif draft:

1. **Recommended** — Bahasa formal ASN, mudah dipahami, ringkas, cocok untuk mayoritas kegiatan.
2. **Ringkas** — Sangat singkat, maksimal 1 paragraf, fokus pada inti kegiatan.
3. **Formal** — Sedikit lebih resmi, cocok untuk dokumen yang akan diperiksa, tetap tidak bertele-tele.

PENTING — ISI NOTA DINAS HARUS BERORIENTASI PADA KEGIATAN:
- Fokus pada: kegiatan, tujuan kegiatan, alasan perjalanan dinas, dan manfaat kegiatan.
- JANGAN menyebut nama pegawai.
- JANGAN menyebut NIP.
- JANGAN menyebut jabatan penandatangan.
- JANGAN menyebut identitas ASN.
- JANGAN menyebut pangkat atau golongan.
- JANGAN menyebut nama pejabat atau unit kerja pengirim.

FORMAT STRUKTUR YANG HARUS DIIKUTI (kecuali draft Ringkas):

**Paragraf 1 — Latar Belakang / Tujuan**
Buka dengan "Dalam rangka ..." dilanjutkan tujuan kegiatan, alasan perjalanan dinas, dan manfaat yang diharapkan.

**Paragraf 2 — Maksud Permohonan**
Gunakan transisi "Mendasari hal tersebut di atas, maka kami bermaksud untuk mengajukan perjalanan dinas ..." yang berisi maksud permohonan secara jelas.

**Paragraf 3 — Penutup**
Tutup dengan "Demikian disampaikan, atas perhatian dan perkenannya diucapkan terima kasih."

Contoh alur:
Paragraf 1: "Dalam rangka [tujuan/kegiatan] ..., maka kami bermaksud untuk melaksanakan ..."
Paragraf 2: "Mendasari hal tersebut di atas, maka kami bermaksud untuk mengajukan perjalanan dinas ..."
Paragraf 3: "Demikian disampaikan, atas perhatian dan perkenannya diucapkan terima kasih."

ATURAN:
- Draft Recommended dan Formal: TIGA paragraf sesuai format di bawah.
- Draft Ringkas: SATU paragraf, tidak perlu mengikuti format 3 paragraf.
- Bahasa Indonesia formal.
- Gunakan gaya bahasa administrasi pemerintahan daerah (Kecamatan, Kelurahan, OPD, Pemerintah Kabupaten).
- Hasil harus menyerupai Nota Dinas yang umum digunakan pada Kecamatan, Kelurahan, OPD, dan Pemerintah Kabupaten.
- Tidak menggunakan bullet.
- Tidak menggunakan daftar nomor.
- Tidak menulis nomor surat.
- Tidak menulis tanda tangan.
- Tidak menulis identitas pengirim.
- Tidak menulis identitas penerima.
- Hasil hanya isi Nota Dinas.
- Jangan mengulangi data mentah (seperti tanggal, lokasi) secara kaku — integrasikan secara alami dalam narasi.
- Jangan menambahkan teks di luar ketiga paragraf tersebut.
- "Demikian disampaian, atas perhatian dan perkenannya diucapkan terima kasih." adalah penutup baku, bukan salam penutup personal — wajib disertakan di draft Recommended dan Formal sebagai paragraf 3.

OUTPUT JSON — WAJIB pisahkan setiap paragraf ke key masing-masing:
{
  "jenisKegiatan": "${jenisKegiatan}",
  "draftRecommendedP1": "Paragraf 1 latar belakang...",
  "draftRecommendedP2": "Paragraf 2 maksud permohonan...",
  "draftRecommendedP3": "Paragraf 3 penutup...",
  "draftRingkas": "Paragraf tunggal ringkas...",
  "draftFormalP1": "Paragraf 1 latar belakang...",
  "draftFormalP2": "Paragraf 2 maksud permohonan...",
  "draftFormalP3": "Paragraf 3 penutup..."
}

PENTING: Untuk Recommended dan Formal, output HARUS memiliki 3 key terpisah (P1, P2, P3), jangan digabung dalam satu string.`,
            jenisKegiatan,
        };
    };

    const generateDrafts = async () => {
        setIsLoading(true);
        setError(null);

        const { prompt, jenisKegiatan } = buildSystemPrompt();

        try {
            const response = await generateContentWithRetry(prompt);

            // Handle response - bisa dari result.response atau langsung response.text()
            let rawText = "";
            try {
                rawText = response.text();
            } catch (e) {
                rawText = typeof response === "string" ? response : JSON.stringify(response);
            }

            // Debug: log raw response
            console.log("[NotaAI] Raw response:", rawText.substring(0, 500));

            if (!rawText || rawText.length < 10) {
                throw new Error("AI tidak memberikan respons. Coba lagi.");
            }

            // Bersihkan teks
            let cleanJson = rawText
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                // Normalize smart quotes
                .replace(/\u201C|\u201D/g, '"')
                .replace(/\u2018|\u2019/g, "'")
                .trim();

            // Cari JSON object ({ ... }) dalam teks
            const jsonStart = cleanJson.indexOf('{');
            const jsonEnd = cleanJson.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
                console.error("[NotaAI] No JSON found. Response:", cleanJson.substring(0, 500));
                // Cek apakah respons berisi pesan blokade
                if (cleanJson.toLowerCase().includes("maaf") || cleanJson.toLowerCase().includes("tidak dapat")) {
                    throw new Error("AI menolak permintaan. Coba periksa data form atau ulangi.");
                }
                throw new Error("AI tidak mengembalikan format JSON yang valid");
            }

            cleanJson = cleanJson.slice(jsonStart, jsonEnd + 1);

            let parsed;
            try {
                parsed = JSON.parse(cleanJson);
            } catch (parseErr) {
                console.error("[NotaAI] JSON parse error. String:", cleanJson.substring(0, 500));
                // Coba perbaiki JSON umum: hapus trailing comma
                try {
                    const fixed = cleanJson.replace(/,(\s*[}\]])/g, '$1');
                    parsed = JSON.parse(fixed);
                } catch {
                    throw new Error("AI mengembalikan data yang tidak dapat diproses");
                }
            }

            if (!parsed.draftRecommendedP1 && !parsed.draftRingkas && !parsed.draftFormalP1) {
                console.error("[NotaAI] Missing draft keys in:", JSON.stringify(parsed).substring(0, 300));
                throw new Error("AI tidak mengembalikan draft yang lengkap");
            }

            setDrafts({
                recommended: {
                    label: "Recommended",
                    description: "3 paragraf — format baku Nota Dinas pemerintah daerah",
                    paragraphs: [
                        parsed.draftRecommendedP1 || "",
                        parsed.draftRecommendedP2 || "",
                        parsed.draftRecommendedP3 || "",
                    ],
                },
                ringkas: {
                    label: "Ringkas",
                    description: "1 paragraf — sangat singkat, fokus inti kegiatan",
                    paragraphs: [parsed.draftRingkas || ""],
                },
                formal: {
                    label: "Formal",
                    description: "3 paragraf — lebih resmi, cocok untuk dokumen diperiksa",
                    paragraphs: [
                        parsed.draftFormalP1 || "",
                        parsed.draftFormalP2 || "",
                        parsed.draftFormalP3 || "",
                    ],
                },
            });
        } catch (err) {
            console.error("AI Generation Error:", err);
            const msg = err?.message || "";
            const isOverload =
                msg.includes("high demand") ||
                msg.includes("RESOURCE_EXHAUSTED") ||
                err?.status === 500 ||
                err?.code === 500;
            const isJsonError =
                msg.includes("JSON") ||
                msg.includes("draft") ||
                msg.includes("Mohon maaf");
            setError(
                isOverload
                    ? "Server AI sedang sibuk. Kami sudah mencoba 3 kali otomatis. Silakan tunggu beberapa saat dan coba lagi."
                    : isJsonError
                    ? "AI tidak dapat menyusun draft Nota Dinas dari data yang diberikan. Coba periksa kembali isian form (Perihal, Tujuan, Maksud) dan coba lagi."
                    : "Gagal menghasilkan draft. Silakan coba lagi."
            );
            toast.error("Gagal menghasilkan draft Nota Dinas");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (key) => {
        setSelectedDraft(key);
    };

    const handleConfirm = () => {
        if (!selectedDraft || !drafts) return;
        const selected = drafts[selectedDraft];
        // Kirim 3 paragraf terpisah (draft Ringkas hanya punya 1 paragraf)
        const p1 = selected.paragraphs[0] || "";
        const p2 = selected.paragraphs[1] || "";
        const p3 = selected.paragraphs[2] || "";
        onSelect(p1, p2, p3);
        toast.success(`Draft "${selected.label}" dipilih`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
            <div
                ref={modalRef}
                className="bg-white rounded-[1.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white shrink-0">
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold leading-none mb-1">
                                    Generate Nota AI
                                </h2>
                                <p className="text-indigo-100/70 text-[11px] font-medium">
                                    AI menganalisis data perjalanan untuk 3 alternatif draft
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 overflow-y-auto custom-scrollbar bg-gray-50/30">
                    {/* Quota Usage Indicator */}
                    <QuotaIndicator />
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative">
                                <Loader2 size={40} className="text-indigo-600 animate-spin" />
                                <Sparkles size={16} className="text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-700">Menganalisis data perjalanan...</p>
                                <p className="text-xs text-gray-400 mt-1">AI sedang menyusun 3 alternatif draft Nota Dinas</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-700">{error}</p>
                                <button
                                    type="button"
                                    onClick={generateDrafts}
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Sparkles size={12} />
                                    Coba Lagi
                                </button>
                            </div>
                        </div>
                    ) : drafts ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-gray-500">
                                    Pilih salah satu draft untuk mengisi Nota Dinas
                                </p>
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    3 alternatif
                                </span>
                            </div>

                            {/* Draft Cards */}
                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(drafts).map(([key, draft]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleSelect(key)}
                                        className={`relative w-full text-left rounded-xl border-2 p-4 transition-all ${
                                            selectedDraft === key
                                                ? "border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-100"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                                        }`}
                                    >
                                        {selectedDraft === key && (
                                            <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                                <Check size={14} className="text-white" />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                key === "recommended"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : key === "ringkas"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-purple-100 text-purple-700"
                                            }`}>
                                                {key === "recommended" ? "★ Recommended" : draft.label}
                                            </span>
                                            {key === "recommended" && (
                                                <span className="text-[9px] text-emerald-600 font-medium">Pilihan terbaik</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mb-2">{draft.description}</p>
                                        <div className="border-t border-gray-100 pt-2 space-y-2">
                                            {draft.paragraphs.map((para, pIdx) => (
                                                <div key={pIdx}>
                                                    {draft.paragraphs.length > 1 && (
                                                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                                                            Paragraf {pIdx + 1}
                                                        </span>
                                                    )}
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        {para || <span className="text-gray-300 italic">—</span>}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={!selectedDraft}
                                    className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                                        selectedDraft
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    <FileText size={14} />
                    Gunakan Draft Ini
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

/** Mini indicator — sisa kuota AI hari ini */
function QuotaIndicator() {
    const [status, setStatus] = useState({ used: 0, limit: 15, remaining: 15, percentage: 0 });

    useEffect(() => {
        try {
            setStatus(getAiUsageStatus());
        } catch (e) {
            // Ignore if not available
        }
    }, []);

    const { used, limit, remaining, percentage } = status;
    const isLow = remaining <= 3;
    const isCritical = remaining <= 1;

    return (
        <div className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg ${
            isCritical ? "bg-red-50 border border-red-200" :
            isLow ? "bg-amber-50 border border-amber-200" :
            "bg-gray-100/50"
        }`}>
            <Gauge size={12} className={
                isCritical ? "text-red-500" :
                isLow ? "text-amber-500" :
                "text-gray-400"
            } />
            <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${
                            isCritical ? "bg-red-500" :
                            isLow ? "bg-amber-500" :
                            "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${
                    isCritical ? "text-red-600" :
                    isLow ? "text-amber-600" :
                    "text-gray-500"
                }`}>
                    {remaining}/{limit} tersisa
                </span>
            </div>
        </div>
    );
}
