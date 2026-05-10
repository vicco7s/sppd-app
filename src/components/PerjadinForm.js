"use client";

import React, { useState, useEffect } from 'react';
import { Zap, ZapOff, TimerResetIcon, Sparkles } from 'lucide-react';
import { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { model } from "@/services/firebases";

// Sub-components
import PersonilSection from './perjadin/PersonilSection';
import NotaSection from './perjadin/NotaSection';
import LaporanAISection from './perjadin/LaporanAISection';

const PerjadinForm = ({ onSubmit, isSubmitting, initialData = null, pegawaiList = [], isEdit = false }) => {
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
        keterangan: '-',
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
            if (formattedData.tglhasil && typeof formattedData.tglhasil.toDate === 'function') {
                formattedData.tglhasil = formattedData.tglhasil.toDate().toISOString().split('T')[0];
            } else if (formattedData.tglhasil instanceof Date) {
                formattedData.tglhasil = formattedData.tglhasil.toISOString().split('T')[0];
            }
            if (formattedData.namaPengikut && formattedData.namaPengikut.length > 0) {
                formattedData.namaPengikut = formattedData.namaPengikut.map(item => {
                    if (typeof item === 'string') {
                        return {
                            id: item,
                            tglBerangkat: formattedData.tanggalBerangkat || '',
                            tglKembali: formattedData.tanggalKembali || '',
                            hari: formattedData.hari || 0,
                            uangHarian: formattedData.uangHarian || 0,
                            transport: formattedData.transport || 0,
                            total: (Number(formattedData.uangHarian || 0) + Number(formattedData.transport || 0)) * (formattedData.hari || 0)
                        };
                    }
                    return item;
                });
            }
            if (!formattedData.keterangan) {
                formattedData.keterangan = '-';
            }
            setFormData(prev => ({ ...prev, ...formattedData }));
            if (formattedData.dari || formattedData.isinota) {
                setUseNota(true);
            }
        }
    }, [initialData]);

    const calculateHari = (tglBerangkat, tglKembali) => {
        if (!tglBerangkat || !tglKembali) return 0;
        const start = new Date(tglBerangkat);
        const end = new Date(tglKembali);
        const diffTime = end - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    };

    // Auto-calculate days and totals
    useEffect(() => {
        const { tanggalBerangkat, tanggalKembali, uangHarian, transport, namaPengikut } = formData;
        const computedHariUtama = calculateHari(tanggalBerangkat, tanggalKembali);
        const computedTotalUtama = (Number(uangHarian) + Number(transport)) * computedHariUtama;

        const updatedPengikut = (namaPengikut || []).map(p => {
            const h = calculateHari(p.tglBerangkat || tanggalBerangkat, p.tglKembali || tanggalKembali);
            const total = (Number(p.uangHarian ?? uangHarian) + Number(p.transport ?? transport)) * h;
            return { ...p, hari: h, total: total };
        });

        if (computedHariUtama !== formData.hari || computedTotalUtama !== formData.total || JSON.stringify(updatedPengikut) !== JSON.stringify(namaPengikut)) {
            setFormData(prev => ({
                ...prev,
                hari: computedHariUtama,
                total: computedTotalUtama,
                namaPengikut: updatedPengikut
            }));
        }
    }, [formData.tanggalBerangkat, formData.tanggalKembali, formData.uangHarian, formData.transport, formData.namaPengikut]);

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

    const [isGeneratingMaksud, setIsGeneratingMaksud] = useState(false);

    const handleGenerateMaksud = async () => {
        if (!formData.perihalSurat || !formData.tujuan) {
            toast.error("Isi 'Perihal' dan 'Tujuan' terlebih dahulu untuk generate otomatis.");
            return;
        }
        setIsGeneratingMaksud(true);
        try {
            const prompt = `Berperanlah sebagai staf administrasi pemerintah Indonesia. 
            Buatkan kalimat untuk kolom 'Maksud / Untuk' dalam dokumen SPPD berdasarkan:
            Perihal: "${formData.perihalSurat}"
            Tujuan: "${formData.tujuan}"

            Gunakan gaya bahasa formal seperti contoh berikut:
            Contoh: "Dalam rangka mendukung kelancaran administrasi, kami bermaksud [perihal] di [tujuan]. Kegiatan ini dilakukan untuk memastikan kelengkapan dokumen serta kelanjutan proses sesuai ketentuan yang berlaku."
            Atau gaya langsung: "Menghadiri [perihal] di [tujuan]"

            Berikan HANYA teks hasilnya saja yang paling natural menurutmu.`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            setFormData(prev => ({ ...prev, untuk: text }));
            toast.success("Maksud/Untuk berhasil di-generate!");
        } catch (error) {
            console.error("AI Error:", error);
            toast.error("Gagal generate maksud.");
        } finally {
            setIsGeneratingMaksud(false);
        }
    };

    const applyTemplate = (type) => {
        if (!formData.perihalSurat || !formData.tujuan) {
            toast.error("Isi 'Perihal' dan 'Tujuan' terlebih dahulu.");
            return;
        }
        let text = "";
        if (type === 'formal') {
            text = `Dalam rangka mendukung kelancaran administrasi, kami bermaksud ${formData.perihalSurat} di ${formData.tujuan}. Kegiatan ini dilakukan untuk memastikan kelengkapan dokumen serta kelanjutan proses sesuai ketentuan yang berlaku.`;
        } else {
            text = `${formData.perihalSurat} di ${formData.tujuan}`;
        }
        setFormData(prev => ({ ...prev, untuk: text }));
        toast.success("Template diterapkan!");
    };

    const internalOnSubmit = (e) => {
        e.preventDefault();
        if (!formData.idPegawai) {
            toast.error("Harap pilih minimal satu pegawai pelaksana (Pegawai Utama).");
            return;
        }
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
                            {isAutoSpt ? <><Zap size={12} className="mr-1" /> Auto</> : <><ZapOff size={12} className="mr-1" /> Custom</>}
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

            <PersonilSection 
                formData={formData} 
                setFormData={setFormData} 
                pegawaiList={pegawaiList} 
                calculateHari={calculateHari} 
            />

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
                        <label className="block text-sm font-semibold text-gray-700 mb-2 text-xs opacity-75">
                            {useNota ? 'Detail Lokasi' : 'Surat Dari'}
                        </label>
                        <textarea
                            name="suratDari"
                            rows={4}
                            value={formData.suratDari}
                            onChange={handleChange}
                            placeholder={useNota ? 'Ruang Akutansi BKAD' : 'BKAD Tapin Nomor...'}
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
                                value={formData.tanggalSurat}
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
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Maksud / Untuk</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => applyTemplate('formal')}
                            className="text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors uppercase"
                        >
                            Template Formal
                        </button>
                        <button
                            type="button"
                            onClick={() => applyTemplate('singkat')}
                            className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors uppercase"
                        >
                            Template Singkat
                        </button>
                        <button
                            type="button"
                            onClick={handleGenerateMaksud}
                            disabled={isGeneratingMaksud}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors uppercase tracking-tight"
                        >
                            {isGeneratingMaksud ? (
                                <div className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-indigo-600 border-t-transparent"></div>
                            ) : (
                                <Sparkles size={12} />
                            )}
                            Auto Fill AI
                        </button>
                    </div>
                </div>
                <textarea
                    name="untuk"
                    value={formData.untuk}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Tujuan utama perjalanan dinas buat sedetail detailnya"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                ></textarea>
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

            <NotaSection 
                formData={formData} 
                setFormData={setFormData} 
                useNota={useNota} 
                setUseNota={setUseNota} 
                handleChange={handleChange} 
            />

            <LaporanAISection 
                formData={formData} 
                setFormData={setFormData} 
                handleChange={handleChange} 
            />

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
