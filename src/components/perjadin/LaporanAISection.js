"use client";

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateContentWithRetry } from "@/lib/ai/callWithRetry";

const LaporanAISection = ({ 
    formData, 
    setFormData, 
    handleChange 
}) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAI = async () => {
        if (!formData.untuk) {
            toast.error("Mohon isi kolom 'Maksud / Untuk' terlebih dahulu sebagai dasar pembuatan laporan.");
            return;
        }

        setIsGenerating(true);
        try {
            const prompt = `
            Anda adalah staf administrasi pemerintahan yang bertugas menyusun laporan resmi perjalanan dinas.
            Berdasarkan maksud/tujuan berikut: "${formData.untuk} ${formData.tujuan} ${formData.tanggalBerangkat} ${formData.tanggalKembali}"
            Susun laporan formal dan profesional dengan bahasa baku administrasi pemerintahan.
            Kembangkan isi secara logis dan realistis seolah-olah kegiatan benar-benar dilaksanakan.
            Ketentuan:
            - Tulis dalam bentuk paragraf naratif.
            - Panjang setiap bagian minimal 1 - 2 kalimat.
            - Jangan gunakan bullet point.
            - Jangan gunakan markdown.
            - Jangan tambahkan teks penjelasan apapun.
            WAJIB keluarkan HANYA JSON valid dengan struktur berikut:
            {
              "kegiatan": "",
              "hasil": "",
              "kesimpulan": "",
              "saran": ""
            }`;

            const response = await generateContentWithRetry(prompt);
            const text = response.text();
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanText);

            setFormData(prev => ({
                ...prev,
                kegiatan: data.kegiatan || prev.kegiatan,
                hasil: data.hasil || prev.hasil,
                kesimpulan: data.kesimpulan || prev.kesimpulan,
                saran: data.saran || prev.saran
            }));

            toast.success("Laporan berhasil dibuat secara otomatis!");
        } catch (err) {
            console.error("Error generating AI content:", err);
            toast.error("Terjadi kesalahan saat membuat laporan otomatis. Coba lagi nanti.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Isi Laporan Otomatis</h3>
                    <p className="text-sm text-gray-500">Gunakan AI untuk mengisi detail laporan kegiatan secara otomatis.</p>
                </div>
                <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} className="mr-2" />
                            Generate AI
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kegiatan yang Dilaksanakan</label>
                    <textarea
                        name="kegiatan"
                        value={formData.kegiatan}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hasil yang Dicapai</label>
                    <textarea
                        name="hasil"
                        value={formData.hasil}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kesimpulan</label>
                    <textarea
                        name="kesimpulan"
                        value={formData.kesimpulan}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Saran / Penutup</label>
                    <textarea
                        name="saran"
                        value={formData.saran}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                    ></textarea>
                </div>
            </div>
        </div>
    );
};

export default LaporanAISection;
