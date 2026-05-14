"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Sparkles, Zap, Calendar, Bot, Send, ArrowRight, Pen, Paperclip, PrinterIcon, Flame, PartyPopperIcon, CloverIcon, FlagTriangleLeft, PrinterCheck, Database, History } from "lucide-react";
import { db } from "@/services/firebases";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

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
                    ...doc.data(),
                    id: doc.id  // must come AFTER spread — prevents stored id:"" from overriding
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
            Bell: <Bell size={13} className="text-amber-400" />,
            Sparkles: <Sparkles size={13} className="text-violet-400" />,
            Zap: <Zap size={13} className="text-lime-400" />,
            PrinterCheck: <PrinterCheck size={13} className="text-emerald-400" />,
            Database: <Database size={13} className="text-sky-400" />,
            CloverIcon: <CloverIcon size={13} className="text-blue-400" />,
            PartyPopperIcon: <PartyPopperIcon size={13} className="text-orange-400" />,
            Flame: <Flame size={13} className="text-rose-400" />,
            Bot: <Bot size={13} className="text-indigo-400" />,
            Send: <Send size={13} className="text-blue-400" />,
            Calendar: <Calendar size={13} className="text-amber-400" />,
            Pen: <Pen size={13} className="text-slate-400" />,
            Paperclip: <Paperclip size={13} className="text-blue-400" />,
            PrinterIcon: <PrinterIcon size={13} className="text-emerald-400" />,
            FlagTriangleLeft: <FlagTriangleLeft size={13} className="text-blue-400" />,
            History: <History size={13} className="text-blue-400" />,
        };
        return iconMap[iconName] || <Zap size={13} className="text-blue-400" />;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                /* Backdrop */
                <motion.div
                    key="glass-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
                >
                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20, mass: 1 }}
                        className="relative w-full max-w-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl"
                        style={{
                            background: "linear-gradient(145deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.06) 100%)",
                            backdropFilter: "blur(30px) saturate(150%)",
                            WebkitBackdropFilter: "blur(30px) saturate(150%)",
                            border: "1px solid rgba(255,255,255,0.18)",
                        }}
                    >
                        {/* Inner highlight line at top */}
                        <div
                            className="absolute top-0 left-6 right-6 h-px rounded-full"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)" }}
                        />

                        {/* ─────── HEADER ─────── */}
                        <div className="relative px-7 pt-7 pb-6 overflow-hidden">
                            {/* Header glass layer */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(59,130,246,0.14) 60%, transparent 100%)",
                                }}
                            />
                            {/* Soft orb top-right */}
                            <div
                                className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
                                style={{ background: "radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)", filter: "blur(24px)" }}
                            />

                            <div className="relative z-10 flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Icon badge */}
                                    <motion.div
                                        animate={{ y: [0, -3, 0] }}
                                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="relative"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                            style={{
                                                background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)",
                                                border: "1px solid rgba(255,255,255,0.25)",
                                                boxShadow: "0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
                                            }}
                                        >
                                            <Sparkles className="text-white" size={20} />
                                        </div>
                                        {/* Glow under icon */}
                                        <div
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full"
                                            style={{ background: "rgba(139,92,246,0.5)", filter: "blur(6px)" }}
                                        />
                                    </motion.div>

                                    <div>
                                        <h2 className="text-[20px] font-extrabold tracking-tight text-white leading-none">
                                            What's a New ?
                                        </h2>
                                        <div className="flex items-center gap-2 mt-2">
                                            {/* Version pill */}
                                            <div
                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                                                style={{
                                                    background: "rgba(255,255,255,0.1)",
                                                    border: "1px solid rgba(255,255,255,0.15)",
                                                    backdropFilter: "blur(10px)",
                                                }}
                                            >
                                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                                                    {latestUpdate.version || "v3.0"}
                                                </span>
                                            </div>
                                            {/* Date pill */}
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                                                <Calendar size={9} className="text-white/50" />
                                                <span className="text-[9px] font-semibold text-white/50">
                                                    {latestUpdate.date || "Terbaru"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Close button */}
                                <motion.button
                                    onClick={handleClose}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.85 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    className="flex items-center justify-center w-9 h-9 rounded-2xl"
                                    style={{
                                        background: "rgba(255,255,255,0.1)",
                                        border: "1px solid rgba(255,255,255,0.16)",
                                    }}
                                >
                                    <X size={15} className="text-white/70" />
                                </motion.button>
                            </div>

                            {/* AI badge */}
                            <div className="relative z-10 mt-4 flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg"
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                }}
                            >
                                <Bot size={11} className="text-indigo-300" />
                                <span className="text-[9px] font-bold text-indigo-200/80 tracking-widest uppercase">Powered by Gemini AI 2.5 Flash</span>
                            </div>
                        </div>

                        {/* ─────── SCROLLABLE CONTENT ─────── */}
                        <div
                            className="max-h-[340px] overflow-y-auto px-6 pb-2 pt-1 liquid-glass-scroll"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.12) transparent" }}
                        >
                            <div className="space-y-3 pb-4">
                                {/* Latest update label */}
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <div
                                        className="h-3 w-px rounded-full"
                                        style={{ background: "linear-gradient(to bottom, rgba(139,92,246,0.9), rgba(59,130,246,0.5))" }}
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em]"
                                        style={{ color: "rgba(220,225,255,0.9)" }}>
                                        Fitur &amp; Pembaruan
                                    </span>
                                </div>

                                {/* Latest update items */}
                                <div className="space-y-2">
                                    {latestUpdate.items?.map((item, idx) => (
                                        <GlassUpdateItem
                                            key={`latest-item-${idx}`}
                                            icon={getIcon(item.icon)}
                                            text={item.text}
                                            index={idx}
                                        />
                                    ))}
                                </div>

                                {/* History section */}
                                {otherUpdates.length > 0 && (
                                    <div className="space-y-4 pt-4 mt-2">
                                        <div
                                            className="h-px w-full"
                                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
                                        />
                                        <div className="flex items-center gap-2 px-1">
                                            <History size={11} className="text-white/55" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/55">
                                                Riwayat Update
                                            </span>
                                        </div>

                                        {otherUpdates.map((update, updateIdx) => (
                                            <div key={`history-update-${updateIdx}`} className="space-y-2">
                                                {/* Version header */}
                                                <div className="flex items-center justify-between px-1">
                                                    <span
                                                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                                                        style={{
                                                            background: "rgba(255,255,255,0.12)",
                                                            border: "1px solid rgba(255,255,255,0.18)",
                                                            color: "rgba(220,230,255,0.95)",
                                                        }}
                                                    >
                                                        {update.version}
                                                    </span>
                                                    <span className="text-[9px] font-medium text-white/55">{update.date}</span>
                                                </div>
                                                {/* History items */}
                                                <div className="space-y-1.5 pl-2 border-l border-white/[0.06]">
                                                    {update.items?.map((item, idx) => (
                                                        <div key={`history-${updateIdx}-item-${idx}`} className="flex gap-2.5 items-start">
                                                            <div className="mt-1.5 w-1 h-1 rounded-full shrink-0 bg-white/40" />
                                                            <p className="text-[10px] text-white/70 font-medium leading-relaxed">{item.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─────── FOOTER ─────── */}
                        <div
                            className="px-6 py-5 flex items-center justify-between"
                            style={{
                                background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 100%)",
                                borderTop: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            {/* Status dot + version */}
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                    style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }}
                                />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">
                                    {latestUpdate.version || "v3.0.0.stable"}
                                </span>
                            </div>

                            {/* Liquid glass close button */}
                            <motion.button
                                onClick={handleClose}
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="group relative flex items-center gap-2 px-6 py-2.5 rounded-2xl overflow-hidden text-xs font-bold text-white shadow-sm"
                                style={{
                                    background: "rgba(255, 255, 255, 0.08)",
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    border: "1px solid rgba(255, 255, 255, 0.15)",
                                    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                }}
                            >
                                <span className="relative z-10">Tutup</span>
                                <ArrowRight size={13} className="relative z-10 transition-transform group-hover:translate-x-0.5 opacity-80" />
                            </motion.button>
                        </div>

                        {/* Bottom inner highlight */}
                        <div
                            className="absolute bottom-0 left-8 right-8 h-px rounded-full pointer-events-none"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
                        />
                    </motion.div>
                </motion.div>
            )}

            <style jsx global>{`
                .liquid-glass-scroll::-webkit-scrollbar {
                    width: 3px;
                }
                .liquid-glass-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .liquid-glass-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.12);
                    border-radius: 10px;
                }
                .liquid-glass-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.22);
                }
            `}</style>
        </AnimatePresence>
    );
}

function GlassUpdateItem({ icon, text, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{
                scale: 1.015,
                boxShadow: "0 4px 20px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            className="flex gap-3.5 items-center px-4 py-3 rounded-2xl transition-all cursor-default"
            style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(10px)",
            }}
        >
            {/* Icon glass chip */}
            <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 100%)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
            >
                {icon}
            </div>
            <p className="text-[12px] font-semibold leading-snug" style={{ color: "rgba(245,248,255,0.97)" }}>
                {text}
            </p>
        </motion.div>
    );
}
