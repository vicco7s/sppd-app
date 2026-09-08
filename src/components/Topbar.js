"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { auth, db } from "@/services/firebases";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot, getDocs, where, writeBatch, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { clearAuthCache } from "@/hooks/useInactivityLogout";
import NotificationDropdown from "@/components/topbar/NotificationDropdown";
import UserProfileCard from "@/components/topbar/UserProfileCard";
import { motion } from "framer-motion";

export default function Topbar({ user, role = "User" }) {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [openProfile, setOpenProfile] = useState(false);
    const [employeeName, setEmployeeName] = useState("");
    const [theme, setTheme] = useState("light");

    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const savedTheme = window.localStorage.getItem("dashboard-theme") || "light";
        setTheme(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        window.localStorage.setItem("dashboard-theme", nextTheme);
        document.documentElement.dataset.theme = nextTheme;
    };

    // Fetch employee name from pegawai collection based on idPegawai in user collection
    useEffect(() => {
        if (!user?.uid) return;

        const fetchEmployeeName = async () => {
            try {
                // 1. Get user document from 'user' collection using uid
                const userDocRef = doc(db, "user", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const idPegawai = userData.idPegawai;

                    if (idPegawai) {
                        // 2. Get employee document from 'pegawai' collection using idPegawai
                        const pegawaiDocRef = doc(db, "pegawai", idPegawai);
                        const pegawaiDocSnap = await getDoc(pegawaiDocRef);

                        if (pegawaiDocSnap.exists()) {
                            const pegawaiData = pegawaiDocSnap.data();
                            setEmployeeName(pegawaiData.nama || "");
                        } else {
                            console.log("Pegawai document not found for idPegawai:", idPegawai);
                            setEmployeeName(user.displayName || "User");
                        }
                    } else {
                        console.log("No idPegawai found for user:", user.uid);
                        setEmployeeName(user.displayName || "User");
                    }
                } else {
                    console.log("User document not found for uid:", user.uid);
                    setEmployeeName(user.displayName || "User");
                }
            } catch (err) {
                console.error("Failed to fetch employee name:", err);
            }
        };

        fetchEmployeeName();
    }, [user?.uid, user?.displayName]);

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
            }).filter((notif) => notif.type !== "login" && notif.title !== "Login");
            setNotifications(notifs);
            const count = notifs.filter(n => !n.isRead).length;
            setUnreadCount(count);
        }, (error) => {
            // Gracefully ignore permission-denied errors during logout
            if (error?.code === 'permission-denied') {
                console.log("Listener closed: User logged out or permissions changed");
                return;
            }
            console.error("Error listening to notifications:", error);
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

    return (
        <header className="sticky top-3 z-40 mx-3 flex min-h-16 items-center justify-end rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:mx-6 sm:px-6">
            {/* Mode dark & Light */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex h-10 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-slate-500 shadow-inner"
                    aria-label={theme === "dark" ? "Gunakan mode terang" : "Gunakan mode gelap"}
                >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${theme === "light" ? "bg-white text-amber-500 shadow-sm" : "text-slate-400"}`}>
                        <Sun size={16} />
                    </span>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${theme === "dark" ? "bg-slate-800 text-cyan-300 shadow-sm" : "text-slate-400"}`}>
                        <Moon size={16} />
                    </span>
                </button>
                {/* Notification Bell */}
                <div ref={notificationRef} className="relative">
                    <motion.button
                        onClick={handleMarkAsRead}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="relative rounded-full border border-slate-200/0 bg-white/0 p-2 text-slate-700 hover:bg-white/0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 backdrop-blur-[6px]"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white shadow-md">
                                {unreadCount}
                            </span>
                        )}
                    </motion.button>

                    <NotificationDropdown
                        isOpen={showNotifications}
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkAsRead={handleMarkAsRead}
                    />
                </div>

                {/* Profile Dropdown */}
                <div ref={profileRef} className="relative flex items-center gap-4">
                    <motion.button
                        type="button"
                        onClick={() => setOpenProfile(!openProfile)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                        aria-expanded={openProfile}
                    >
                        {employeeName?.charAt(0)?.toUpperCase() || (user?.displayName?.charAt(0)?.toUpperCase() || "U")}
                    </motion.button>

                    <UserProfileCard
                        isOpen={openProfile}
                        employeeName={employeeName}
                        userEmail={user?.email}
                        role={role}
                        onLogout={handleLogout}
                    />
                </div>
            </div>
        </header>
    );
}
