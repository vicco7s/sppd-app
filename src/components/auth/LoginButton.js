"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginButton({ loading, children }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={!loading ? { scale: 1.02 } : {}}
      whileTap={!loading ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="relative w-full group overflow-hidden rounded-xl py-3.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-500 to-yellow-700 transition-opacity duration-300 group-hover:opacity-90"></div>
      
      {/* Subtle Inner Highlight */}
      <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none"></div>
      
      {/* Soft Shadow */}
      <div className="absolute -inset-1 bg-blue-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      <div className="relative flex items-center justify-center gap-2 text-[15px] font-semibold text-white drop-shadow-sm">
        {loading && <Loader2 size={18} className="animate-spin" />}
        {children}
      </div>
    </motion.button>
  );
}
