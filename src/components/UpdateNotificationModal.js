"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Sparkles, Zap, Calendar, Bot, Send, ArrowRight, Pen, Paperclip, PrinterIcon, Flame, PartyPopperIcon, CloverIcon, FlagTriangleLeft, PrinterCheck, Database, History, BrainCircuit, Notebook } from "lucide-react";
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
            Brain: <BrainCircuit size={13} className="text-red-500" />,
            Notebook: <Notebook size={13} className="text-zinc-600" />,
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
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                >
                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20, mass: 1 }}
                        className="relative w-full max-w-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                        {/* Inner highlight line at top */}
                        <div
                            className="absolute inset-x-8 top-0 h-1 rounded-b-full bg-blue-600"
                        />

                        {/* ─────── HEADER ─────── */}
                        <div className="relative px-7 pt-7 pb-6 overflow-hidden">
                            {/* Header glass layer */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: "linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(255,255,255,0) 75%)",
                                }}
                            />
                            {/* Soft orb top-right */}
                            <div
                                className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
                                style={{ background: "radial-gradient(circle, rgba(147,197,253,0.18) 0%, transparent 70%)", filter: "blur(24px)" }}
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
                                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20"
                                            style={{
                                                background: "#002fb1",
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
                                        <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                                            What&apos;s New?
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
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                                    {latestUpdate.version || "v3.0"}
                                                </span>
                                            </div>
                                            {/* Date pill */}
                                            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "#002fb1" }}>
                                                <Calendar size={10} className="text-slate-400 text-white" />
                                                <span className="text-[10px] font-medium text-slate-500 text-white">
                                                    {latestUpdate.date || "Terbaru"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Close button */}
                                <motion.button
                                    onClick={handleClose}
                                    aria-label="Tutup pembaruan"
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.85 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
                                    style={{
                                        background: "#fafafa",
                                    }}
                                >
                                    <X size={16} />
                                </motion.button>
                            </div>

                            {/* AI badge */}
                            <div className="relative z-10 mt-5 flex w-fit items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5"
                                style={{
                                    background: "#f1f5f9",
                                }}
                            >
                                <Bot size={12} className="text-indigo-600" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">New AI Gemini 3.1 Flash Lite and GLM 4.7 Flash</span>
                            </div>
                        </div>

                        {/* ─────── SCROLLABLE CONTENT ─────── */}
                        <div
                            className="max-h-[340px] overflow-y-auto px-6 pb-2 pt-1 liquid-glass-scroll"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
                        >
                            <div className="space-y-3 pb-4">
                                {/* Latest update label */}
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <div className="h-3 w-1 rounded-full bg-indigo-600" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
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
                                            style={{ background: "linear-gradient(90deg, transparent, rgba(8, 8, 8, 0.49), transparent)" }}
                                        />
                                        <div className="flex items-center gap-2 px-1">
                                            <History size={11} className="text-white/55" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-black/55">
                                                Riwayat Update
                                            </span>
                                        </div>

                                        {otherUpdates.map((update, updateIdx) => (
                                            <div key={`history-update-${updateIdx}`} className="space-y-2">
                                                {/* Version header */}
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                                                        {update.version}
                                                    </span>
                                                    <span className="text-[9px] font-medium text-slate-400">{update.date}</span>
                                                </div>
                                                {/* History items */}
                                                <div className="space-y-1.5 border-l border-slate-200 pl-2">
                                                    {update.items?.map((item, idx) => (
                                                        <div key={`history-${updateIdx}-item-${idx}`} className="flex gap-2.5 items-start">
                                                            <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                                                            <p className="text-[10px] font-medium leading-relaxed text-slate-500">{item.text}</p>
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
                            className="flex items-center justify-between border-t border-slate-100 px-6 py-4"
                        >
                            {/* Status dot + version */}
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                    style={{ boxShadow: "0 0 6px #34d399" }}
                                />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                    {latestUpdate.version || "v3.0.0.stable"} Beta
                                </span>
                            </div>

                            {/* Liquid glass close button */}
                            <motion.button
                                onClick={handleClose}
                                aria-label="Tutup pembaruan"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                                style={{
                                    background: "#002fb1",
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
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .liquid-glass-scroll::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
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
            className="flex cursor-default items-center gap-3.5 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-blue-200 hover:bg-blue-50/40"
            style={{
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
        >
            {/* Icon glass chip */}
            <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50"
                style={{
                    border: "1px solid #dbeafe",
                }}
            >
                {icon}
            </div>
            <p className="text-[12px] font-semibold leading-snug text-slate-700">
                {text}
            </p>
        </motion.div>
    );
}
