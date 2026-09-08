"use client";

import { User, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function UserProfileCard({ isOpen, employeeName, userEmail, role, onLogout }) {
  const initial = employeeName?.charAt(0)?.toUpperCase() || "U";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -15 }}
          transition={{
            type: "spring",
            stiffness: 450,
            damping: 18,
            mass: 0.8
          }}
          className="profile-popover absolute right-0 top-full z-50 mt-3 w-[min(22rem,95vw)] max-w-[360px] origin-top-right overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-[10px]"
        >
          {/* Profile Header */}
          <div className="profile-header relative border-b border-slate-200/70 bg-white/70 px-5 py-5 backdrop-blur-[6px]">
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/0 to-transparent" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-lg font-bold text-white shadow-md">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">{employeeName || "Nama Pengguna"}</p>
                <p className="mt-1 truncate text-xs text-slate-600">{userEmail || "user@example.com"}</p>
                {role && (
                  <p className="profile-role mt-2 inline-block rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                    {role === "Admin" ? "Administrator" : "Pengguna"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <div className="px-4 py-3">
            <button
              onClick={onLogout}
              className="profile-logout flex w-full items-center gap-3 rounded-[18px] border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-sm font-semibold text-rose-700 transition duration-200 hover:bg-rose-100/80 backdrop-blur-[4px]"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
