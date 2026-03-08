"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, User, LogOut } from "lucide-react";
import { auth, db } from "@/services/firebases";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { clearAuthCache } from "@/hooks/useInactivityLogout";

export default function Topbar({ user, role = "User" }) {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [openProfile, setOpenProfile] = useState(false);

    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    // Real-time notifications listener
    useEffect(() => {
        const q = query(
            collection(db, "notifications"),
            orderBy("createdAt", "desc"),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, []);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(e) {
            if (notificationRef.current && !notificationRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setOpenProfile(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = () => {
        setShowNotifications(!showNotifications);
        setUnreadCount(0);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            clearAuthCache();
            router.replace("/login");
        } catch (err) {
            console.error("Logout gagal", err);
            toast.error("Logout Gagal");
        }
    };

    return (
        <header className="h-16 bg-white flex items-center px-6 shadow-sm">
            <div className="flex-1">
                {/* Placeholder for breadcrumbs or search if needed later */}
            </div>

            <div className="flex items-center gap-4 relative">
                {/* Notification Bell */}
                <div ref={notificationRef} className="relative">
                    <button
                        onClick={handleMarkAsRead}
                        className="p-2 rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 text-sm">Notifikasi Terbaru</h3>
                                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">Aktivitas</span>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bell size={20} className="text-gray-300" />
                                        </div>
                                        <p className="text-sm text-gray-400">Belum ada notifikasi baru</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-default group">
                                            <div className="flex gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'pegawai' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {notif.type === 'pegawai' ? <User size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-gray-800 leading-tight mb-1">{notif.title}</p>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed mb-1.5">{notif.message}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-400 font-medium">Oleh: {notif.userName}</span>
                                                        <span className="text-[10px] text-gray-300">•</span>
                                                        <span className="text-[10px] text-gray-400">
                                                            {notif.createdAt?.toDate ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(notif.createdAt.toDate()) : 'Baru saja'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div ref={profileRef} className="relative flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setOpenProfile(!openProfile)}
                        className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center focus:outline-none"
                        aria-expanded={openProfile}
                    >
                        <User size={16} className="text-white" />
                    </button>

                    {openProfile && (
                        <div className="absolute right-0 mt-12 w-56 bg-white rounded shadow z-20 border border-gray-100 focus:outline-none">
                            <div className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold">
                                    {user?.displayName?.charAt(0) || "U"}
                                </div>
                                <div>
                                    <div className="font-semibold text-black truncate max-w-[140px]">{user?.displayName || "Nama Pengguna"}</div>
                                    <div className="text-sm text-gray-500 truncate max-w-[140px]">{user?.email || "user@example.com"}</div>
                                </div>
                            </div>
                            <div className="px-4 py-2 border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left text-red-600 font-semibold hover:bg-red-50 p-2 rounded focus:outline-none flex items-center gap-2"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
