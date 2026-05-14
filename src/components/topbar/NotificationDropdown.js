"use client";

import NotificationItem from "./NotificationItem";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function NotificationDropdown({ isOpen, notifications, unreadCount, onMarkAsRead }) {
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
          className="absolute right-0 top-full z-50 mt-3 w-[min(26rem,95vw)] max-w-[420px] origin-top-right overflow-hidden rounded-[26px] border border-slate-200/70 bg-white/80 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-[10px]"
        >
          <div className="relative border-b border-slate-200/70 bg-white/70 px-5 py-4 backdrop-blur-[6px]">
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/60 to-transparent" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-950">Notifikasi Terbaru</h3>
                <p className="mt-1 text-xs text-slate-600">Aktivitas dan notifikasi untuk dashboard Anda.</p>
              </div>
              <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">Aktivitas</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAsRead}
                className="mt-3 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Mark all read ({unreadCount})
              </button>
            )}
          </div>

          <div className="max-h-[380px] space-y-3 overflow-y-auto custom-scrollbar px-4 py-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-slate-200/70 bg-slate-50/70 py-8 text-center backdrop-blur-[4px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-600">
                  <Bell size={24} />
                </div>
                <p className="text-xs font-semibold text-slate-900">Tidak ada notifikasi baru</p>
                <p className="max-w-xs text-xs text-slate-600">Semua aktivitas baru akan muncul di sini.</p>
              </div>
            ) : (
              notifications.map((notif) => <NotificationItem key={notif.id} notification={notif} />)
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
