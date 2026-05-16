import React from "react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export default function UserSidebar({
    activeTab, setActiveTab,
    openPerjadinLuar, setOpenPerjadinLuar
}) {
    return (
        <aside className="w-64 bg-white shadow-lg h-screen sticky top-0 p-4 text-gray-800 flex flex-col shrink-0">
            <div className="mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full" />
                <div>
                    <div className="font-bold text-gray-900">Dashboard</div>
                    <div className="text-sm text-gray-500">User</div>
                </div>
            </div>

            <nav className="space-y-2 text-sm mb-4">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    Overview
                </button>

                <button
                    onClick={() => setActiveTab("pegawai")}
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${activeTab === 'pegawai' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    Pegawai
                </button>

                {/* Administrasi & Perjadin */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenPerjadinLuar(!openPerjadinLuar)}
                        aria-expanded={openPerjadinLuar}
                        className={`w-full text-left flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-0 ${openPerjadinLuar ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        <span>Administrasi & Perjadin</span>
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
                                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'kwitansi' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        Kwitansi
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("perjadin-umum-dalam-kota")}
                                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === 'perjadin-umum-dalam-kota' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
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

            <div className="mt-auto pt-6 border-t border-gray-100 -mx-4 px-4 space-y-1">
                <button className="block w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Settings</button>
                <button className="block w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">Help & Support</button>
            </div>
        </aside>
    );
}
