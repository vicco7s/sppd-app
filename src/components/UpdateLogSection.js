"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/services/firebases";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Save, X, Info, Zap, Bell, Sparkles, PrinterCheck, Database, CloverIcon, PartyPopperIcon, Flame, Bot, Send, Calendar, Pen, Paperclip, PrinterIcon, CloudSyncIcon, FlagTriangleLeft, History, Brain, Notebook } from "lucide-react";

const ICON_OPTIONS = [
    { name: "Zap", icon: <Zap size={16} /> },
    { name: "Bell", icon: <Bell size={16} /> },
    { name: "Sparkles", icon: <Sparkles size={16} /> },
    { name: "PrinterCheck", icon: <PrinterCheck size={16} /> },
    { name: "Database", icon: <Database size={16} /> },
    { name: "CloverIcon", icon: <CloverIcon size={16} /> },
    { name: "PartyPopperIcon", icon: <PartyPopperIcon size={16} /> },
    { name: "Flame", icon: <Flame size={16} /> },
    { name: "Bot", icon: <Bot size={16} /> },
    { name: "Send", icon: <Send size={16} /> },
    { name: "Calendar", icon: <Calendar size={16} /> },
    { name: "Pen", icon: <Pen size={16} /> },
    { name: "Paperclip", icon: <Paperclip size={16} /> },
    { name: "PrinterIcon", icon: <PrinterIcon size={16} /> },
    { name: "CloudSyncIcon", icon: <CloudSyncIcon size={16} /> },
    { name: "FlagTriangleLeft", icon: <FlagTriangleLeft size={16} /> },
    { name: "History", icon: <History size={16} /> },
    { name: "Brain", icon: <Brain size={16} /> },
    { name: "Notebook", icon: <Notebook size={16} /> },
    
];

export default function UpdateLogSection() {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newUpdate, setNewUpdate] = useState({
        version: "",
        date: "",
        items: [{ text: "", icon: "Zap" }]
    });

    useEffect(() => {
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "appUpdates"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            setUpdates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching updates:", error);
            toast.error("Gagal mengambil riwayat update");
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setNewUpdate(prev => ({
            ...prev,
            items: [...prev.items, { text: "", icon: "Zap" }]
        }));
    };

    const handleRemoveItem = (index) => {
        setNewUpdate(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...newUpdate.items];
        newItems[index][field] = value;
        setNewUpdate(prev => ({ ...prev, items: newItems }));
    };

    const handleSaveUpdate = async () => {
        if (!newUpdate.version || !newUpdate.date || newUpdate.items.some(i => !i.text)) {
            toast.error("Harap isi semua field!");
            return;
        }

        try {
            await addDoc(collection(db, "appUpdates"), {
                ...newUpdate,
                createdAt: serverTimestamp()
            });
            toast.success("Update log berhasil disimpan!");
            setIsAdding(false);
            setNewUpdate({ version: "", date: "", items: [{ text: "", icon: "Zap" }] });
            fetchUpdates();
        } catch (error) {
            console.error("Error saving update:", error);
            toast.error("Gagal menyimpan update log");
        }
    };

    const handleDeleteUpdate = async (id) => {
        if (!window.confirm("Hapus riwayat update ini?")) return;
        try {
            await deleteDoc(doc(db, "appUpdates", id));
            toast.success("Berhasil dihapus");
            fetchUpdates();
        } catch (error) {
            console.error("Error deleting update:", error);
            toast.error("Gagal menghapus");
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm text-gray-800 border border-gray-100 sm:p-6">
            <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Manajemen Update Log</h2>
                    <p className="text-sm text-gray-500">Kelola riwayat pembaruan sistem yang akan tampil di modal pembaruan.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md font-medium text-sm"
                >
                    {isAdding ? <X size={18} /> : <Plus size={18} />}
                    {isAdding ? "Batal" : "Tambah Update Baru"}
                </button>
            </div>

            {isAdding && (
                <div className="mb-10 p-6 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Versi</label>
                            <input
                                type="text"
                                placeholder="Contoh: v3.1.0"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                value={newUpdate.version}
                                onChange={e => setNewUpdate({ ...newUpdate, version: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Tanggal Update</label>
                            <input
                                type="text"
                                placeholder="Contoh: 07 Mei 2026"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                value={newUpdate.date}
                                onChange={e => setNewUpdate({ ...newUpdate, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Item Perubahan</label>
                        {newUpdate.items.map((item, index) => (
                            <div key={index} className="flex flex-col gap-3 items-stretch sm:flex-row sm:items-start">
                                <select
                                    className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={item.icon}
                                    onChange={e => handleItemChange(index, "icon", e.target.value)}
                                >
                                    {ICON_OPTIONS.map(opt => (
                                        <option key={opt.name} value={opt.name}>{opt.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Deskripsi perubahan..."
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                    value={item.text}
                                    onChange={e => handleItemChange(index, "text", e.target.value)}
                                />
                                <button
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={handleAddItem}
                            className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1 mt-2"
                        >
                            <Plus size={14} /> Tambah Item Lainnya
                        </button>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={handleSaveUpdate}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg transition-all"
                        >
                            <Save size={18} /> Simpan Update Log
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Daftar Riwayat</h3>
                {loading ? (
                    <div className="text-center py-10 text-gray-400 italic">Memuat riwayat...</div>
                ) : updates.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">Belum ada riwayat update.</div>
                ) : (
                    <div className="grid gap-4">
                        {updates.map((update) => (
                            <div key={update.id} className="p-5 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-6">
                                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase">{update.version}</div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">{update.date}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{update.items?.length || 0} item perubahan</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteUpdate(update.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
