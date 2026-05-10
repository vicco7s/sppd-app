"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Sparkles, Zap, Calendar, Bot, Send, ArrowRight, PenBox, Pen, PenLineIcon, CloudSyncIcon, PaperclipIcon, PrinterIcon, Paperclip, Flame, PartyPopperIcon, CloverIcon, FlagTriangleLeft, PrinterCheck, Database, History } from "lucide-react";
import { db } from "@/services/firebases";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function UpdateNotificationModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const q = query(collection(db, "appUpdates"), orderBy("createdAt", "desc"), limit(5));
                const querySnapshot = await getDocs(q);
                const updatesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUpdates(updatesData);
            } catch (error) {
                console.error("Error fetching updates:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUpdates();
        const timer = setTimeout(() => setIsOpen(true), 1100);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen || loading || updates.length === 0) return null;

    const latestUpdate = updates[0];
    const otherUpdates = updates.slice(1);

    const getIcon = (iconName) => {
        const iconMap = {
            Bell: <Bell size={14} className="text-yellow-500" />,
            Sparkles: <Sparkles size={14} className="text-indigo-600" />,
            Zap: <Zap size={14} className="text-lime-500"/>,
            PrinterCheck: <PrinterCheck className="text-green-500" size={14} />,
            Database: <Database className="text-gray-500" size={14} />,
            CloverIcon: <CloverIcon className="text-blue-500" size={14} />,
            PartyPopperIcon: <PartyPopperIcon className="text-orange-700" size={14} />,
            Flame: <Flame size={14} className="text-red-500"/>,
            Bot: <Bot size={14} className="text-indigo-700"/>,
            Send: <Send size={14} className="text-indigo-600"/>,
            Calendar: <Calendar size={14} className="text-yellow-500"/>,
            Pen: <Pen size={14} className="text-gray-500"/>,
            Paperclip: <Paperclip size={14} className="text-blue-500"/>,
            PrinterIcon: <PrinterIcon size={14} className="text-green-500"/>,
            CloudSyncIcon: <CloudSyncIcon size={14} className="text-green-500"/>,
            FlagTriangleLeft: <FlagTriangleLeft size={14} className="text-blue-500"/>,
            History: <History size={14} className="text-blue-500"/>,
        };
        return iconMap[iconName] || <Zap size={14} />;
    };

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
                                        Last Update: {latestUpdate.date || "Terbaru"}
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
                <div className="p-7 bg-white max-h-[400px] overflow-y-auto custom-scrollbar">
                    <div className="space-y-8">
                        {/* Latest Update */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-3 bg-blue-600 rounded-full" />
                                <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Fitur & Pembaruan ({latestUpdate.version || "v3.0"})</span>
                            </div>

                            <div className="grid gap-4">
                                {latestUpdate.items?.map((item, idx) => (
                                    <UpdateItem
                                        key={idx}
                                        icon={getIcon(item.icon)}
                                        text={item.text}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* History / Previous Updates */}
                        {otherUpdates.length > 0 && (
                            <div className="space-y-6 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 mb-1">
                                    <History className="text-gray-400" size={14} />
                                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Riwayat Update</span>
                                </div>
                                
                                {otherUpdates.map((update) => (
                                    <div key={update.id} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{update.version}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{update.date}</span>
                                        </div>
                                        <div className="grid gap-3 pl-2 border-l-2 border-gray-50">
                                            {update.items?.map((item, idx) => (
                                                <div key={idx} className="flex gap-3 items-start">
                                                    <div className="mt-1 w-1 h-1 bg-gray-300 rounded-full shrink-0" />
                                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{item.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Clean Footer */}
                <div className="px-7 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center gap-1.5 opacity-40">
                        <div className="w-1.5 h-1.5 bg-green-700 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black tracking-tighter text-gray-900 uppercase">{latestUpdate.version || "v3.0.0.stable"}</span>
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
