"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, User, LogOut, FileText, Plus, RefreshCw, CheckCircle, PlaneLanding, PlaneTakeoffIcon } from "lucide-react";
import { auth, db } from "@/services/firebases";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot, getDocs, where, writeBatch, doc } from "firebase/firestore";
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

    // Auto-cleanup old notifications (older than 30 days) - Admin Only
    useEffect(() => {
        const cleanupOldNotifs = async () => {
            // Run only once per day locally per user to keep DB clean
            const lastCleanup = localStorage.getItem("last_notif_cleanup");
            const today = new Date().toDateString();
            if (lastCleanup === today) return;

            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const q = query(
                    collection(db, "notifications"),
                    where("createdAt", "<", thirtyDaysAgo)
                );

                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const batch = writeBatch(db);
                    snapshot.docs.forEach((doc) => {
                        batch.delete(doc.ref);
                    });
                    await batch.commit();
                    console.log(`Auto-Cleanup: Deleted ${snapshot.size} old notifications.`);
                }
                localStorage.setItem("last_notif_cleanup", today);
            } catch (err) {
                console.error("Cleanup error:", err);
            }
        };

        // Delay cleanup slightly to prioritize initial load
        const timer = setTimeout(cleanupOldNotifs, 5000);
        return () => clearTimeout(timer);
    }, [role]);

    // Real-time notifications listener
    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, "notifications"),
            orderBy("createdAt", "desc"),
            limit(15)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Check if current user has read this notif
                    isRead: data.readBy?.includes(user.uid) || false
                };
            });
            setNotifications(notifs);
            const count = notifs.filter(n => !n.isRead).length;
            setUnreadCount(count);
        });

        return () => unsubscribe();
    }, [user?.uid]);

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

    const handleMarkAsRead = async () => {
        const becomesVisible = !showNotifications;
        setShowNotifications(becomesVisible);

        if (becomesVisible && unreadCount > 0 && user?.uid) {
            const unreadNotifs = notifications.filter(n => !n.isRead);
            if (unreadNotifs.length > 0) {
                try {
                    const { arrayUnion } = await import("firebase/firestore");
                    const batch = writeBatch(db);
                    unreadNotifs.forEach((notif) => {
                        const notifRef = doc(db, "notifications", notif.id);
                        batch.update(notifRef, {
                            readBy: arrayUnion(user.uid)
                        });
                    });
                    await batch.commit();
                } catch (err) {
                    console.error("Failed to mark notifications as read:", err);
                }
            }
        }
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

    const getNotifIcon = (type) => {
        switch (type) {
            case 'perjadin': return <FileText size={14} />;
            case 'pegawai': return <User size={14} />;
            case 'update': return <RefreshCw size={14} />;
            case 'status': return <CheckCircle size={14} />;
            case 'create': return <PlaneTakeoffIcon size={14} />;
            default: return <Bell size={14} />;
        }
    };

    const getNotifColor = (type) => {
        switch (type) {
            case 'perjadin': return 'bg-blue-100 text-blue-600';
            case 'pegawai': return 'bg-green-100 text-green-600';
            case 'update': return 'bg-amber-100 text-amber-600';
            case 'status': return 'bg-purple-100 text-purple-600';
            case 'create': return 'bg-indigo-100 text-indigo-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <header className="h-16 bg-white flex items-center px-6 shadow-sm">
            <div className="flex-1">
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
                                <div className="flex gap-1">
                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase transition-all">Aktivitas</span>
                                </div>
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
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b border-gray-50 hover:bg-blue-50/10 transition-colors cursor-default group relative ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getNotifColor(notif.type)} relative`}>
                                                    {getNotifIcon(notif.type)}
                                                    {!notif.isRead && (
                                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-xs leading-tight mb-1 ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{notif.title}</p>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed mb-1.5 line-clamp-2">{notif.message}</p>
                                                    <div className="flex flex-col gap-0.5 mt-auto">
                                                        <span className="text-[10px] text-gray-400 font-medium truncate max-w-[180px]">
                                                            Oleh: {notif.userEmail || notif.userName}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400/80">
                                                            {notif.createdAt?.toDate ? new Intl.DateTimeFormat('id-ID', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }).format(notif.createdAt.toDate()) : 'Baru saja'}
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
