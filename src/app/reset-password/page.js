"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/services/firebases";
import toast from "react-hot-toast";
import Link from "next/link";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  {/* Fungsi Reset Password */ }
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Link reset password telah dikirim ke email Anda");
      setTimeout(() => router.replace("/login"), 100);
    } catch {
      toast.error("Email tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-500 via-yellow-400 to-blue-800 p-6">
      <form onSubmit={handleReset} className="w-full max-w-sm sm:max-w-md space-y-4 bg-white p-6 rounded-xl shadow">
        {/* Header dan Tombol Kembali ke Login */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Reset Password</h2>
          <button type="button" onClick={() => router.replace("/login")} className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300" aria-label="Kembali ke login">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {/* Input Email */}
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Masukkan email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3 w-full rounded text-gray-900 placeholder-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Tombol Kirim Link Reset */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          {loading ? "Loading..." : "Kirim Link Reset"}
        </button>
      </form>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
