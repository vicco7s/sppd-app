"use client";

import { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/services/firebases";
import toast from "react-hot-toast";

/**
 * Utility to clear all auth-related cache and storage
 */
export const clearAuthCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies if any (optional, usually handled by Firebase)
    document.cookie.split(";").forEach((c) => {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
};

/**
 * Hook to automatically logout user after a period of inactivity
 * @param {number} timeoutMs - Timeout in milliseconds (default 30 minutes)
 */
export const useInactivityLogout = (timeoutMs = 1800000) => {
    const timerRef = useRef(null);

    const handleLogout = async (reason = "inactivity") => {
        try {
            // Logout from Firebase
            await signOut(auth);

            // Clear browser storage
            clearAuthCache();

            // Inform user
            const message = reason === "inactivity"
                ? "Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit."
                : "Sesi Anda telah berakhir. Silakan login kembali.";

            toast.error(message, {
                duration: 5000,
                id: "auto-logout-toast"
            });

            // Redirect to login
            window.location.href = "/login";
        } catch (error) {
            console.error("Error during auto-logout:", error);
        }
    };

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);

        // Update last activity in localStorage
        localStorage.setItem("lastActivity", Date.now().toString());

        timerRef.current = setTimeout(() => handleLogout("inactivity"), timeoutMs);
    };

    useEffect(() => {
        // 1. Initial Check on Mount (handles browser reopen/refresh)
        const checkSession = () => {
            const lastActivity = localStorage.getItem("lastActivity");
            if (lastActivity) {
                const diff = Date.now() - parseInt(lastActivity, 10);
                if (diff >= timeoutMs) {
                    handleLogout("expired");
                    return true;
                }
            }
            return false;
        };

        if (checkSession()) return;

        // 2. Setup Activity Listeners
        const activityEvents = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click"
        ];

        const listener = () => resetTimer();

        // Initialize timer
        resetTimer();

        // Add listeners
        activityEvents.forEach(event => {
            window.addEventListener(event, listener);
        });

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            activityEvents.forEach(event => {
                window.removeEventListener(event, listener);
            });
        };
    }, [timeoutMs]);
};
