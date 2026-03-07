"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, ZapOff, Send, TimerResetIcon } from 'lucide-react';
import { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { model } from "@/services/firebases";

const notaOptions = [
    "Bendahara Kecamatan Salam babaris",
    "Sekretaris Camat Kecamatan Salam babaris",
    "kasubag perencanaan dan keuangan kecamatan salam babaris"
];

const PerjadinForm = ({ onSubmit, isSubmitting, initialData = null, pegawaiList = [], isEdit = false }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAutoSpt, setIsAutoSpt] = useState(true);
    const [useNota, setUseNota] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        idPegawai: '',
        no: 0,
        noSpt: '',
        noSpd: '',
        nama: '',
        namaPengikut: [],
        tujuan: '',
        tanggal: '',
        suratDari: '',
        tanggalSurat: '',
        tanggalBerangkat: '',
        tanggalKembali: '',
        perihalSurat: '',
        hari: 0,
        uangHarian: 0,
        transport: 0,
        total: 0,
        untuk: '',
        keterangan: '',
        kegiatan: '',
        hasil: '',
        kesimpulan: '',
        saran: '',
        dari: '',
        isinota: '',
        tglhasil: Timestamp.now(),
        status: 'Menunggu'
    });

    useEffect(() => {
        if (initialData) {
            const formattedData = { ...initialData };
            // Format tglhasil if it's a Firestore Timestamp or Date
            if (formattedData.tglhasil && typeof formattedData.tglhasil.toDate === 'function') {
                formattedData.tglhasil = formattedData.tglhasil.toDate().toISOString().split('T')[0];
            } else if (formattedData.tglhasil instanceof Date) {
                formattedData.tglhasil = formattedData.tglhasil.toISOString().split('T')[0];
            }
            setFormData(prev => ({ ...prev, ...formattedData }));

            // Auto-enable useNota if existing data has 'dari' or 'isinota'
            if (formattedData.dari || formattedData.isinota) {
                setUseNota(true);
            }
        }
    }, [initialData]);

    // hitung hari & total otomatis
    useEffect(() => {
        const { tanggalBerangkat, tanggalKembali, uangHarian, transport } = formData;
        let computedHari = formData.hari;

        if (tanggalBerangkat && tanggalKembali) {
            const start = new Date(tanggalBerangkat);
            const end = new Date(tanggalKembali);
            const diffTime = end - start;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            computedHari = diffDays > 0 ? diffDays : 0;
        }

        const computedTotal = (Number(uangHarian) + Number(transport)) * computedHari;

        setFormData(prev => ({
            ...prev,
            hari: computedHari,
            total: computedTotal
        }));
    }, [formData.tanggalBerangkat, formData.tanggalKembali, formData.uangHarian, formData.transport]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => {
            const newData = { ...prevData, [name]: value };
            if (name === 'no') {
                if (isAutoSpt) newData.noSpt = `800.1.11.1/${value}/ST/2026`;
                newData.noSpd = `000.2.2.4/${value}/SPD/2026`;
            }
            return newData;
        });
    };

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
      - Panjang setiap bagian minimal 3 - 5 kalimat.
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

            const result = await model.generateContent(prompt);
            const response = await result.response;
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

    const internalOnSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={internalOnSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor</label>
                    <input
                        type="text"
                        name="no"
                        value={formData.no}
                        onChange={handleChange}
                        placeholder="001"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-700">No. SPT</label>
                        <button
                            type="button"
                            onClick={() => setIsAutoSpt(!isAutoSpt)}
                            className={`flex items-center text-xs font-medium px-2 py-1 rounded-md transition-colors ${isAutoSpt ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {isAutoSpt ? (
                                <><Zap size={12} className="mr-1" /> Auto</>
                            ) : (
                                <><ZapOff size={12} className="mr-1" /> Custom</>
                            )}
                        </button>
                    </div>
                    <input
                        type="text"
                        name="noSpt"
                        value={formData.noSpt}
                        onChange={handleChange}
                        placeholder=" contoh : 800.1.11.1/01/ST/2026"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">No. SPD</label>
                    <input
                        type="text"
                        name="noSpd"
                        value={formData.noSpd}
                        onChange={handleChange}
                        placeholder="contoh : 000.2.2.4/01/SPD/2026"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Pelaksanaan SPT</label>
                    <input
                        type="date"
                        name="tanggal"
                        value={formData.tanggal}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Pegawai</label>
                <select
                    name="idPegawai"
                    value={formData.idPegawai || ""}
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedPegawai = pegawaiList.find(p => p.id === selectedId);
                        setFormData(prev => ({
                            ...prev,
                            idPegawai: selectedId,
                            nama: selectedPegawai ? (selectedPegawai.nama || selectedPegawai.displayName) : ""
                        }));
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                    <option value="">Pilih Pegawai</option>
                    {pegawaiList.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.nama || p.displayName}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Pengikut</label>
                <select
                    value=""
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId && !formData.namaPengikut?.includes(selectedId)) {
                            setFormData(prev => ({
                                ...prev,
                                namaPengikut: [...(prev.namaPengikut || []), selectedId]
                            }));
                        }
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                    <option value="">Pilih Pengikut</option>
                    {pegawaiList.map((p) => (
                        <option
                            key={p.id}
                            value={p.id}
                            disabled={formData.namaPengikut?.includes(p.id) || p.id === formData.idPegawai}
                        >
                            {p.nama || p.displayName}
                        </option>
                    ))}
                </select>

                {formData.namaPengikut?.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {formData.namaPengikut.map((id) => {
                            const pegawai = pegawaiList.find(p => p.id === id);
                            return (
                                <div key={id} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">{pegawai?.nama || pegawai?.displayName}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                namaPengikut: prev.namaPengikut.filter(item => item !== id)
                                            }));
                                        }}
                                        className="text-xs font-bold text-red-500 hover:text-red-700 uppercase"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tujuan Lokasi</label>
                <input
                    type="text"
                    name="tujuan"
                    value={formData.tujuan}
                    onChange={handleChange}
                    placeholder="contoh : Bapelitbang Kab. Tapin"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
            </div>

            <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dasar Surat</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-xs opacity-75">Surat Dari</label>
                        <textarea
                            name="suratDari"
                            rows={4}
                            value={formData.suratDari}
                            onChange={handleChange}
                            placeholder="BKAD Tapin Nomor..."
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-sm font-semibold mb-2 text-xs opacity-75 ${useNota ? 'text-gray-400' : 'text-gray-700'}`}>
                                Tanggal Surat {useNota && "(Dinonaktifkan karena Nota Dinas aktif)"}
                            </label>
                            <input
                                type="date"
                                name="tanggalSurat"
                                disabled={useNota}
                                value={useNota ? '' : formData.tanggalSurat}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none transition-all ${useNota ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 text-xs opacity-75">Tanggal Hasil</label>
                            <input
                                type="date"
                                name="tglhasil"
                                readOnly={!isEdit}
                                value={formData.tglhasil || new Date().toISOString().split('T')[0]}
                                onChange={handleChange}
                                className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none transition-all ${!isEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                            />
                            {!isEdit && <p className="text-[10px] text-gray-400 mt-1">* Otomatis terisi tanggal hari ini</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-xs opacity-75">Perihal</label>
                        <textarea
                            name="perihalSurat"
                            rows={4}
                            value={formData.perihalSurat}
                            onChange={handleChange}
                            placeholder="undangan rapat ...."
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Maksud / Untuk</label>
                <textarea
                    name="untuk"
                    value={formData.untuk}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Tujuan utama perjalanan dinas buat sedetail detailnya"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                ></textarea>
            </div>

            <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Berangkat dan Kembali</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-xs opacity-75">Tanggal Berangkat</label>
                        <input
                            type="date"
                            name="tanggalBerangkat"
                            value={formData.tanggalBerangkat}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-xs opacity-75">Tanggal Kembali</label>
                        <input
                            type="date"
                            name="tanggalKembali"
                            value={formData.tanggalKembali}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-xs opacity-75">Jumlah Hari</label>
                        <input
                            type="number"
                            value={formData.hari}
                            readOnly
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Uang Harian</label>
                    <input
                        type="number"
                        name="uangHarian"
                        value={formData.uangHarian}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Transportasi</label>
                    <input
                        type="number"
                        name="transport"
                        value={formData.transport}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total</label>
                    <input
                        type="number"
                        value={formData.total}
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan</label>
                <textarea
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Keterangan singkat..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                ></textarea>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-bold text-gray-900">Informasi Nota Dinas</h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${useNota ? 'text-blue-600' : 'text-gray-400'}`}>
                            {useNota ? 'Aktif' : 'Non-Aktif'}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                const newVal = !useNota;
                                setUseNota(newVal);
                                if (!newVal) {
                                    setFormData(prev => ({ ...prev, dari: '', isinota: '' }));
                                }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${useNota ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useNota ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {useNota ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Dari (Nota Dinas)</label>
                            <select
                                name="dari"
                                value={formData.dari}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="">Pilih Pengirim Nota</option>
                                {notaOptions.map((opt, idx) => (
                                    <option key={idx} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Isi Nota Dinas</label>
                            <textarea
                                name="isinota"
                                value={formData.isinota}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Masukkan isi nota dinas..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                            ></textarea>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-center border-2 border-dashed border-gray-100 rounded-lg">
                        <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                            <TimerResetIcon size={16} />
                            Nota Dinas tidak digunakan. Aktifkan jika diperlukan.
                        </p>
                    </div>
                )}
            </div>

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
                        {isGenerating ? "Generating..." : "Generate AI"}
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

            <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md disabled:opacity-70"
                >
                    {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </button>
            </div>
        </form>
    );
};

export default PerjadinForm;
