"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Sparkles, Zap, Calendar, Bot, Send, ArrowRight, PenBox, Pen, PenLineIcon, CloudSyncIcon, PaperclipIcon, PrinterIcon, Paperclip, Flame, PartyPopperIcon, CloverIcon, FlagTriangleLeft, PrinterCheck, Database } from "lucide-react";

export default function UpdateNotificationModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsOpen(true), 1100);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
            <div
                className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-full max-w-[400px] overflow-hidden transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
            >
                {/* Modern Header - No outer border */}
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-7 text-white overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-24 h-24 bg-blue-400/20 rounded-full blur-xl" />

                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex flex-col gap-3">
                            <div className="bg-white/20 backdrop-blur-xl w-10 h-10 rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                <Sparkles className="text-white animate-pulse" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold tracking-tight leading-none mb-1">What's New?</h2>
                                <div className="flex flex-col gap-1.5 mt-2">
                                    <div className="flex items-center gap-1.5 bg-black/10 backdrop-blur-md px-2.5 py-1 rounded-lg w-fit border border-white/5">
                                        <Bot size={11} className="text-blue-200" />
                                        <span className="text-[10px] font-bold text-blue-50 tracking-wide uppercase">Gemini AI 2.5 Flash</span>
                                    </div>
                                    <p className="text-blue-100/70 text-[10px] font-semibold flex items-center gap-1.5 ml-0.5">
                                        <Calendar size={11} />
                                        Last Update: 30 April 2026
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-xl text-white/80 hover:text-white transition-all group"
                        >
                            <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>
                </div>

                {/* Simplified Content Area */}
                <div className="p-7 bg-white">
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-3 bg-blue-600 rounded-full" />
                            <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Fitur Baru & Perbaikan</span>
                        </div>

                        <div className="grid gap-4">
                            <UpdateItem
                                icon={<PrinterCheck className="text-green-500" size={14} />}
                                text="Print kwitansi dalam peningkatan adminitrasi"
                            />
                            <UpdateItem
                                icon={<Database className="text-yellow-600" size={14} />}
                                text="Menambahkan mekanisme fallback di mana jika pengurutan data gagal karena alasan teknis, sistem tetap akan menampilkan data apa adanya daripada membiarkan dropdown kosong"
                            />
                            <UpdateItem
                                icon={<CloverIcon className="text-blue-500" size={14} />}
                                text="Sekarang daftar kode rekening dari koleksi koderekening akan muncul dengan benar di dropdown"
                            />
                            <UpdateItem
                                icon={<PartyPopperIcon className="text-orange-700" size={14} />}
                                text="Menambah Fitur Kwitansi sebagai pengganti Surat Pertanggungjawaban"
                            />
                            
                        </div>
                    </div>
                </div>

                {/* Clean Footer */}
                <div className="px-7 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center gap-1.5 opacity-40">
                        <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black tracking-tighter text-gray-900 uppercase">v3.0.0.stable</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="group flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-bold text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                    >
                        <span>Tutup</span>
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

function UpdateItem({ icon, text }) {
    return (
        <div className="flex gap-4 group items-center p-0.5">
            <div className="bg-gray-50 w-8 h-8 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors shrink-0">
                {icon}
            </div>
            <p className="text-[12px] text-gray-700 font-semibold group-hover:text-gray-900 transition-colors">
                {text}
            </p>
        </div>
    );
}
