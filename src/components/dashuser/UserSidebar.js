import React from "react";
import Image from "next/image";
import { BriefcaseBusiness, ChevronRight, HelpCircle, LayoutDashboard, Menu, Settings, Users, WalletCards, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useState } from "react";

export default function UserSidebar({
    activeTab, setActiveTab,
    openPerjadinLuar, setOpenPerjadinLuar
}) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="fixed left-7 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-md md:hidden"
                aria-label="Buka menu navigasi"
            >
                <Menu size={20} />
            </button>

            {isMobileOpen && (
                <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
                    aria-label="Tutup menu navigasi"
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[min(18rem,calc(100vw-2rem))] shrink-0 flex-col rounded-r-3xl border-r border-slate-200 bg-[#fbfcff] p-5 text-slate-700 shadow-xl transition-transform duration-300 md:sticky md:top-3 md:my-3 md:h-[calc(100vh-1.5rem)] md:rounded-3xl md:z-auto md:w-64 md:translate-x-0 md:shadow-sm ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="mb-8 flex items-center gap-3 px-2">
                <Image src="/assets/logo/Gimini_logo_AI.png" alt="Logo Kabupaten Tapin" width={40} height={40} className="h-10 w-10 object-contain" />
                <div>
                    <div className="font-bold tracking-tight text-slate-900">SPPD App</div>
                    <div className="text-xs text-slate-400">User workspace</div>
                </div>
                <button type="button" onClick={() => setIsMobileOpen(false)} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 md:hidden" aria-label="Tutup menu navigasi">
                    <X size={18} />
                </button>
            </div>

            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">General</p>
            <nav className="mb-4 space-y-1.5 text-sm">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                    <LayoutDashboard size={17} /> Overview
                </button>

                <button
                    onClick={() => setActiveTab("pegawai")}
                    className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 ${activeTab === 'pegawai' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                    <Users size={17} /> Pegawai
                </button>

                {/* Administrasi & Perjadin */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenPerjadinLuar(!openPerjadinLuar)}
                        aria-expanded={openPerjadinLuar}
                        className={`w-full text-left flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-all duration-300 focus:outline-none focus:ring-0 ${openPerjadinLuar ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <span className="flex items-center gap-3"><BriefcaseBusiness size={17} />Administrasi & Perjadin</span>
                        <motion.span 
                            animate={{ rotate: openPerjadinLuar ? 90 : 0 }} 
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="text-sm"
                        >
                            <ChevronRight size={18} />
                        </motion.span>
                    </button>
                    
                    <AnimatePresence>
                        {openPerjadinLuar && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -5 }}
                                animate={{ 
                                    opacity: 1, 
                                    height: "auto", 
                                    y: 0,
                                    transition: { type: "spring", stiffness: 300, damping: 20 }
                                }}
                                exit={{ 
                                    opacity: 0, 
                                    height: 0, 
                                    y: -5,
                                    transition: { duration: 0.2, ease: "easeInOut" }
                                }}
                                className="overflow-hidden origin-top"
                            >
                                <ul className="mt-1 ml-4 pl-2 border-l-2 border-gray-100 space-y-1 py-1">
                                    <button
                                        onClick={() => setActiveTab("kwitansi")}
                                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'kwitansi' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        Kwitansi
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("perjadin-umum-dalam-kota")}
                                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'perjadin-umum-dalam-kota' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        Perjadin Dalam Kota
                                    </button>
                                    <li onClick={() => toast.success("Coming Soon!")} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-500 hover:bg-gray-50 cursor-pointer focus:outline-none">Perjadin Luar Dalam Provinsi</li>
                                    <li onClick={() => toast.success("Coming Soon!")} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-500 hover:bg-gray-50 cursor-pointer focus:outline-none">Perjadin Luar Antar Provinsi</li>
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </nav>

            <p className="mb-2 mt-auto px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Support</p>
            <div className="space-y-1.5 border-t border-slate-200 pt-3">
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900"><Settings size={17} />Settings</button>
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900"><HelpCircle size={17} />Help & Support</button>
            </div>
            </aside>
        </>
    );
}
