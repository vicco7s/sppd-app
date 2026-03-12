"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, ZapOff, Send, TimerResetIcon, RefreshCw, Copy } from 'lucide-react';
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
            // Handle legacy namaPengikut (array of strings) vs new (array of objects)
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

            setFormData(prev => ({ ...prev, ...formattedData }));

            // Auto-enable useNota if existing data has 'dari' or 'isinota'
            if (formattedData.dari || formattedData.isinota) {
                setUseNota(true);
            }
        }
    }, [initialData]);

    // Helper untuk hitung hari
    const calculateHari = (tglBerangkat, tglKembali) => {
        if (!tglBerangkat || !tglKembali) return 0;
        const start = new Date(tglBerangkat);
        const end = new Date(tglKembali);
        const diffTime = end - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    };

    // hitung hari & total otomatis
    useEffect(() => {
        const { tanggalBerangkat, tanggalKembali, uangHarian, transport, namaPengikut } = formData;
        
        // Hitung untuk Utama
        const computedHariUtama = calculateHari(tanggalBerangkat, tanggalKembali);
        const computedTotalUtama = (Number(uangHarian) + Number(transport)) * computedHariUtama;

        // Hitung untuk Pengikut
        const updatedPengikut = (namaPengikut || []).map(p => {
            const h = calculateHari(p.tglBerangkat || tanggalBerangkat, p.tglKembali || tanggalKembali);
            const total = (Number(p.uangHarian ?? uangHarian) + Number(p.transport ?? transport)) * h;
            return {
                ...p,
                hari: h,
                total: total
            };
        });

        // Hanya update jika ada perubahan untuk menghindari infinite loop
        const isUtamaChanged = computedHariUtama !== formData.hari || computedTotalUtama !== formData.total;
        const isPengikutChanged = JSON.stringify(updatedPengikut) !== JSON.stringify(namaPengikut);

        if (isUtamaChanged || isPengikutChanged) {
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
        if (!formData.idPegawai) {
            toast.error("Harap pilih minimal satu pegawai pelaksana (Pegawai Utama).");
            return;
        }
        onSubmit(formData);
    };

    const handleAddParticipant = (selectedId) => {
        if (!selectedId) return;

        const isAlreadyAdded = formData.idPegawai === selectedId || formData.namaPengikut?.some(p => p.id === selectedId);
        if (isAlreadyAdded) {
            toast.error("Pegawai sudah ada dalam daftar.");
            return;
        }

        const selectedPegawai = pegawaiList.find(p => p.id === selectedId);

        if (!formData.idPegawai) {
            // First person becomes Utama
            setFormData(prev => ({
                ...prev,
                idPegawai: selectedId,
                nama: selectedPegawai?.nama || selectedPegawai?.displayName || ""
            }));
        } else {
            // Add as follower with default dates from Utama
            const newFollower = {
                id: selectedId,
                tglBerangkat: formData.tanggalBerangkat,
                tglKembali: formData.tanggalKembali,
                hari: formData.hari,
                uangHarian: formData.uangHarian,
                transport: formData.transport,
                total: formData.total
            };
            setFormData(prev => ({
                ...prev,
                namaPengikut: [...(prev.namaPengikut || []), newFollower]
            }));
        }
    };

    const handleRemoveParticipant = (type, index = null) => {
        setFormData(prev => {
            if (type === 'utama') {
                if (prev.namaPengikut.length > 0) {
                    // First follower becomes Utama
                    const next = prev.namaPengikut[0];
                    const remaining = prev.namaPengikut.slice(1);
                    const nextPegawai = pegawaiList.find(p => p.id === next.id);
                    return {
                        ...prev,
                        idPegawai: next.id,
                        nama: nextPegawai?.nama || nextPegawai?.displayName || "",
                        tanggalBerangkat: next.tglBerangkat,
                        tanggalKembali: next.tglKembali,
                        hari: next.hari,
                        uangHarian: next.uangHarian,
                        transport: next.transport,
                        total: next.total,
                        namaPengikut: remaining
                    };
                } else {
                    return { ...prev, idPegawai: '', nama: '' };
                }
            } else {
                return {
                    ...prev,
                    namaPengikut: prev.namaPengikut.filter((_, i) => i !== index)
                };
            }
        });
    };

    const handleSyncFollowers = (index = null) => {
        setFormData(prev => {
            if (index !== null) {
                const newList = [...prev.namaPengikut];
                newList[index] = {
                    ...newList[index],
                    tglBerangkat: prev.tanggalBerangkat,
                    tglKembali: prev.tanggalKembali,
                    uangHarian: prev.uangHarian,
                    transport: prev.transport
                };
                return { ...prev, namaPengikut: newList };
            } else {
                return {
                    ...prev,
                    namaPengikut: (prev.namaPengikut || []).map(p => ({
                        ...p,
                        tglBerangkat: prev.tanggalBerangkat,
                        tglKembali: prev.tanggalKembali,
                        uangHarian: prev.uangHarian,
                        transport: prev.transport
                    }))
                };
            }
        });
        toast.success(index !== null ? "Data disinkronkan dengan Utama" : "Semua pengikut disinkronkan");
    };

    const handleSetUtama = (index) => {
        setFormData(prev => {
            const currentUtama = {
                id: prev.idPegawai,
                tglBerangkat: prev.tanggalBerangkat,
                tglKembali: prev.tanggalKembali,
                hari: prev.hari,
                uangHarian: prev.uangHarian,
                transport: prev.transport,
                total: prev.total
            };
            const target = prev.namaPengikut[index];
            const targetPegawai = pegawaiList.find(p => p.id === target.id);
            
            const newFollowers = [...prev.namaPengikut];
            newFollowers[index] = currentUtama;

            return {
                ...prev,
                idPegawai: target.id,
                nama: targetPegawai?.nama || targetPegawai?.displayName || "",
                tanggalBerangkat: target.tglBerangkat,
                tanggalKembali: target.tglKembali,
                hari: target.hari,
                uangHarian: target.uangHarian,
                transport: target.transport,
                total: target.total,
                namaPengikut: newFollowers
            };
        });
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

            {/* --- SECTION PERSONIL PELAKSANA --- */}
            <div className="border border-blue-50 bg-blue-50/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Personil Pelaksana</h3>
                        <p className="text-xs text-gray-500">Pilih Pegawai Utama dan Pengikut dalam satu daftar</p>
                    </div>
                    <div className="flex items-center gap-2">
                         {formData.namaPengikut?.length > 0 && (
                            <button
                                type="button"
                                onClick={() => handleSyncFollowers()}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-full border border-emerald-200 transition-colors uppercase tracking-wider"
                            >
                                <RefreshCw size={10} /> Samakan Semua
                            </button>
                         )}
                         <div className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full uppercase tracking-wider">
                            Total: {(formData.idPegawai ? 1 : 0) + (formData.namaPengikut?.length || 0)} Orang
                         </div>
                    </div>
                </div>

                <div className="relative">
                    <select
                        value=""
                        onChange={(e) => handleAddParticipant(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white font-medium text-gray-800"
                    >
                        <option value="">+ Tambah Pegawai ke Daftar...</option>
                        {pegawaiList.map((p) => {
                            const isSelected = formData.idPegawai === p.id || formData.namaPengikut?.some(item => (typeof item === 'string' ? item === p.id : item.id === p.id));
                            return (
                                <option
                                    key={p.id}
                                    value={p.id}
                                    disabled={isSelected}
                                >
                                    {p.nama || p.displayName}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* --- Daftar Cards --- */}
                <div className="space-y-4">
                    {/* 1. Card Pegawai Utama */}
                    {formData.idPegawai && (
                        <div className="p-4 bg-white border-2 border-blue-200 rounded-xl shadow-sm space-y-3 relative ring-4 ring-blue-500/5">
                            <div className="absolute -top-3 left-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 uppercase tracking-tighter">
                                <Sparkles size={12} /> Pegawai Utama (Pelaksana)
                            </div>
                            
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-base font-bold text-gray-900">
                                    {(pegawaiList.find(p => p.id === formData.idPegawai))?.nama || formData.nama}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveParticipant('utama')}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 uppercase"
                                >
                                    Hapus
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tgl Berangkat</label>
                                    <input
                                        type="date"
                                        name="tanggalBerangkat"
                                        value={formData.tanggalBerangkat}
                                        onChange={handleChange}
                                        className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tgl Kembali</label>
                                    <input
                                        type="date"
                                        name="tanggalKembali"
                                        value={formData.tanggalKembali}
                                        onChange={handleChange}
                                        className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harian (Rp)</label>
                                    <input
                                        type="number"
                                        name="uangHarian"
                                        value={formData.uangHarian}
                                        onChange={handleChange}
                                        className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Transport (Rp)</label>
                                    <input
                                        type="number"
                                        name="transport"
                                        value={formData.transport}
                                        onChange={handleChange}
                                        className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-1">
                                <div className="text-[11px] font-medium text-gray-600 bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100">
                                    Subtotal Utama: <span className="text-blue-700 font-bold">Rp {Number(formData.total || 0).toLocaleString('id-ID')}</span> ({formData.hari || 0} Hari)
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Cards Pengikut */}
                    {formData.namaPengikut?.map((item, index) => {
                        const id = typeof item === 'string' ? item : item.id;
                        const pegawai = pegawaiList.find(p => p.id === id);
                        
                        const updateFollowerField = (field, value) => {
                            setFormData(prev => {
                                const newList = [...prev.namaPengikut];
                                newList[index] = { ...newList[index], [field]: value };
                                return { ...prev, namaPengikut: newList };
                            });
                        };

                        return (
                            <div key={id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold">{index + 1}</div>
                                        <span className="text-sm font-bold text-gray-800">
                                            {pegawai?.nama || pegawai?.displayName}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleSetUtama(index)}
                                            className="text-[10px] bg-gray-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 px-2 py-0.5 rounded border border-gray-200 hover:border-blue-200 transition-colors"
                                        >
                                            Jadikan Utama
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSyncFollowers(index)}
                                            className="text-[10px] bg-gray-50 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 px-2 py-0.5 rounded border border-gray-200 hover:border-emerald-200 transition-colors flex items-center gap-1"
                                            title="Samakan data dengan Pegawai Utama"
                                        >
                                            <Copy size={10} /> Samakan Utama
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveParticipant('pengikut', index)}
                                        className="text-xs font-bold text-red-500 hover:text-red-700 uppercase"
                                    >
                                        Hapus
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tgl Berangkat</label>
                                        <input
                                            type="date"
                                            value={item.tglBerangkat || ''}
                                            onChange={(e) => updateFollowerField('tglBerangkat', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tgl Kembali</label>
                                        <input
                                            type="date"
                                            value={item.tglKembali || ''}
                                            onChange={(e) => updateFollowerField('tglKembali', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harian (Rp)</label>
                                        <input
                                            type="number"
                                            value={item.uangHarian || 0}
                                            onChange={(e) => updateFollowerField('uangHarian', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Transport (Rp)</label>
                                        <input
                                            type="number"
                                            value={item.transport || 0}
                                            onChange={(e) => updateFollowerField('transport', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <div className="text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                        Subtotal Pengikut: <span className="text-blue-600 font-bold">Rp {Number(item.total || 0).toLocaleString('id-ID')}</span> ({item.hari || 0} Hari)
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {(!formData.idPegawai && (!formData.namaPengikut || formData.namaPengikut.length === 0)) && (
                        <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
                            <p className="text-sm text-gray-400">Belum ada personil yang ditambahkan.</p>
                            <p className="text-[10px] text-gray-300 mt-1">Gunakan dropdown di atas untuk memilih pegawai.</p>
                        </div>
                    )}
                </div>
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
