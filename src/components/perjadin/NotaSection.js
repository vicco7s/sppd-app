"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, Plus, Trash2, TimerResetIcon, Sparkles, Copy } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db, model } from "@/services/firebases";
import toast from "react-hot-toast";

const NotaSection = ({ 
    formData, 
    setFormData, 
    useNota, 
    setUseNota, 
    handleChange 
}) => {
    const [searchTermNota, setSearchTermNota] = useState("");
    const [isOpenNota, setIsOpenNota] = useState(false);
    const [notaSenders, setNotaSenders] = useState([]);
    const [loadingNota, setLoadingNota] = useState(true);
    const [isManualNota, setIsManualNota] = useState(false);
    const dropdownRefNota = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRefNota.current && !dropdownRefNota.current.contains(event.target)) {
                setIsOpenNota(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotaSenders = async () => {
        setLoadingNota(true);
        try {
            const q = query(collection(db, "pengirimnotadinas"), orderBy("name", "asc"));
            const snap = await getDocs(q);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotaSenders(data);
        } catch (error) {
            console.error("Error fetching nota senders:", error);
            setNotaSenders([]);
        } finally {
            setLoadingNota(false);
        }
    };

    useEffect(() => {
        fetchNotaSenders();
    }, []);

    const handleSaveNotaSender = async (name) => {
        if (!name.trim()) return;
        try {
            const docRef = await addDoc(collection(db, "pengirimnotadinas"), {
                name: name.trim(),
                createdAt: serverTimestamp()
            });
            const newOption = { id: docRef.id, name: name.trim() };
            setNotaSenders(prev => [...prev, newOption].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData(prev => ({ ...prev, dari: name.trim() }));
            setIsOpenNota(false);
            setSearchTermNota("");
            toast.success("Pengirim nota baru disimpan");
        } catch (error) {
            console.error("Error saving nota sender:", error);
            toast.error("Gagal menyimpan pengirim nota");
        }
    };

    const handleDeleteNotaSender = async (id, name) => {
        if (!window.confirm(`Hapus "${name}" dari referensi?`)) return;
        try {
            await deleteDoc(doc(db, "pengirimnotadinas", id));
            setNotaSenders(prev => prev.filter(item => item.id !== id));
            if (formData.dari === name) {
                setFormData(prev => ({ ...prev, dari: "" }));
            }
            toast.success("Referensi dihapus");
        } catch (error) {
            console.error("Error deleting nota sender:", error);
            toast.error("Gagal menghapus referensi");
        }
    };

    const filteredNotaSenders = notaSenders.filter(opt => 
        opt.name.toLowerCase().includes(searchTermNota.toLowerCase())
    );

    const [isGeneratingIsi, setIsGeneratingIsi] = useState(false);

    const handleGenerateIsiNota = async () => {
        if (!formData.untuk) {
            toast.error("Isi 'Maksud / Untuk' terlebih dahulu sebagai bahan AI.");
            return;
        }
        setIsGeneratingIsi(true);
        try {
            const prompt = `Berperanlah sebagai staf administrasi pemerintah Indonesia. 
            Buatkan isi nota dinas yang formal dan sopan berdasarkan maksud perjalanan berikut:
            "${formData.untuk}"

            Contoh gaya bahasa:
            "Dalam rangka mendukung kelancaran administrasi, kami bermaksud [isi maksud] di [lokasi]. Kegiatan ini dilakukan untuk memastikan kelengkapan dokumen serta kelanjutan proses sesuai ketentuan yang berlaku."

            Tulis dalam 1 paragraf formal baku tanpa kutipan atau penjelasan tambahan.`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            setFormData(prev => ({ ...prev, isinota: text }));
            toast.success("Isi Nota berhasil di-generate!");
        } catch (error) {
            console.error("AI Error:", error);
            toast.error("Gagal generate isi nota.");
        } finally {
            setIsGeneratingIsi(false);
        }
    };

    const copyFromMaksud = () => {
        if (!formData.untuk) {
            toast.error("Kolom 'Maksud / Untuk' masih kosong.");
            return;
        }
        setFormData(prev => ({ ...prev, isinota: prev.untuk }));
        toast.success("Berhasil disalin dari Maksud/Untuk");
    };

    return (
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
                            } else {
                                if (!formData.tanggalSurat && formData.tanggal) {
                                    setFormData(prev => ({ ...prev, tanggalSurat: prev.tanggal }));
                                }
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
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Dari (Nota Dinas)</label>
                            <button
                                type="button"
                                onClick={() => setIsManualNota(!isManualNota)}
                                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors uppercase tracking-tight ${
                                    isManualNota ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                            >
                                {isManualNota ? 'Pilih dari List' : 'Input Manual'}
                            </button>
                        </div>
                        
                        {!isManualNota ? (
                            <div className="relative" ref={dropdownRefNota}>
                                <button
                                    type="button"
                                    onClick={() => setIsOpenNota(!isOpenNota)}
                                    className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                                >
                                    <span className={`truncate mr-2 ${!formData.dari ? "text-gray-400" : ""}`}>
                                        {formData.dari || "Pilih Pengirim Nota"}
                                    </span>
                                    <ChevronRight size={18} className={`text-gray-400 transition-transform duration-200 ${isOpenNota ? "-rotate-90" : "rotate-90"}`} />
                                </button>

                                {isOpenNota && (
                                    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                        <div className="sticky top-0 border-b border-gray-50 bg-gray-50/50 p-2 backdrop-blur-sm">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Cari pengirim nota..."
                                                    value={searchTermNota}
                                                    onChange={(e) => setSearchTermNota(e.target.value)}
                                                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                            {filteredNotaSenders.length > 0 ? (
                                                filteredNotaSenders.map((opt) => (
                                                    <div key={opt.id} className="group/item flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, dari: opt.name }));
                                                                setIsOpenNota(false);
                                                                setSearchTermNota("");
                                                            }}
                                                            className={`flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50/50 ${
                                                                formData.dari === opt.name ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                                                            }`}
                                                        >
                                                            {opt.name}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteNotaSender(opt.id, opt.name);
                                                            }}
                                                            className="opacity-0 group-hover/item:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all mr-1"
                                                            title="Hapus Referensi"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-6 text-center">
                                                    <p className="text-xs font-medium text-gray-400">Tidak ditemukan</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                <div className="relative flex-1">
                                    <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={14} />
                                    <input
                                        type="text"
                                        name="dari"
                                        value={formData.dari}
                                        onChange={handleChange}
                                        placeholder="Ketik pengirim nota baru..."
                                        className="w-full px-4 py-2.5 pl-9 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm"
                                        autoFocus
                                    />
                                </div>
                                {formData.dari && !notaSenders.some(s => s.name === formData.dari) && (
                                    <button
                                        type="button"
                                        onClick={() => handleSaveNotaSender(formData.dari)}
                                        className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm uppercase whitespace-nowrap"
                                    >
                                        Simpan Ref
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Isi Nota Dinas</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={copyFromMaksud}
                                    className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors uppercase tracking-tight"
                                >
                                    <Copy size={10} /> Samakan Maksud
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateIsiNota}
                                    disabled={isGeneratingIsi}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors uppercase tracking-tight"
                                >
                                    {isGeneratingIsi ? (
                                        <div className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-indigo-600 border-t-transparent"></div>
                                    ) : (
                                        <Sparkles size={12} />
                                    )}
                                    Auto Fill AI
                                </button>
                            </div>
                        </div>
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
    );
};

export default NotaSection;
