"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Plus, Search, ChevronRight, RefreshCw, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const PersonilSection = ({ 
    formData, 
    setFormData, 
    pegawaiList, 
    calculateHari 
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const filteredPegawai = pegawaiList.filter((p) => {
        const name = (p.nama || p.displayName || "").toLowerCase();
        const nip = (p.nip || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || nip.includes(search);
    });

    const updateUtamaField = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
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

            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex w-full items-center justify-between rounded-xl border-2 border-blue-100 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-200"
                >
                    <span className="flex items-center gap-2">
                        <Plus size={16} className="text-blue-500" />
                        <span className="text-gray-400">Tambah Pegawai ke Daftar...</span>
                    </span>
                    <ChevronRight size={18} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "-rotate-90" : "rotate-90"}`} />
                </button>

                {isOpen && (
                    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="sticky top-0 border-b border-blue-50 bg-blue-50/50 p-2 backdrop-blur-sm">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau NIP..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-lg border border-blue-100 bg-white py-2.5 pl-9 pr-4 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                            {filteredPegawai.length > 0 ? (
                                filteredPegawai.map((p) => {
                                    const isSelected = formData.idPegawai === p.id || formData.namaPengikut?.some(item => (typeof item === 'string' ? item === p.id : item.id === p.id));
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            disabled={isSelected}
                                            onClick={() => {
                                                handleAddParticipant(p.id);
                                                setIsOpen(false);
                                                setSearchTerm("");
                                            }}
                                            className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors ${
                                                isSelected 
                                                    ? "bg-gray-50 text-gray-400 cursor-not-allowed" 
                                                    : "text-gray-700 hover:bg-blue-50/70"
                                            }`}
                                        >
                                            <span className="text-sm font-semibold">{p.nama || p.displayName}</span>
                                            {p.nip && <span className="text-[10px] text-gray-400">NIP: {p.nip}</span>}
                                            {isSelected && <span className="text-[9px] font-bold text-blue-500 uppercase mt-1">Sudah dalam daftar</span>}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-xs font-medium text-gray-400">Pegawai tidak ditemukan</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
                                    onChange={updateUtamaField}
                                    className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tgl Kembali</label>
                                <input
                                    type="date"
                                    name="tanggalKembali"
                                    value={formData.tanggalKembali}
                                    onChange={updateUtamaField}
                                    className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harian (Rp)</label>
                                <input
                                    type="number"
                                    name="uangHarian"
                                    value={formData.uangHarian}
                                    onChange={updateUtamaField}
                                    className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Transport (Rp)</label>
                                <input
                                    type="number"
                                    name="transport"
                                    value={formData.transport}
                                    onChange={updateUtamaField}
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
    );
};

export default PersonilSection;
