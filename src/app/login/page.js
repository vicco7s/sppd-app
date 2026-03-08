"use client";

import { Eye, EyeOff, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/services/firebases";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";


export default function LoginPage() {
  const [show, setShow] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true); // Start as true to check auth first
  const [error, setError] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is already signed in, check role and redirect
        try {
          const userDoc = await getDoc(doc(db, "user", user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            router.replace(role === "admin" ? "/dashbord/dashadmin" : "/dashbord/dashuser");
          } else {
            router.replace("/dashbord/dashuser");
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);


  {/* Fungsi Submit Login */ }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.role === "admin") {
          router.replace("/dashbord/dashadmin");
        } else {
          router.replace("/dashbord/dashuser");
        }
      } else {
        router.replace("/dashbord/dashuser");
      }
    } catch (err) {
      toast.error("Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-500 via-yellow-400 to-blue-800 p-6">
      <div className="relative w-full max-w-md rounded-3xl bg-white/60 backdrop-blur-md shadow-2xl border border-white/30 p-6">
        <button aria-label="close" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-gray-600">=</button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Log in</h2>

        {/* Form Login */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="nip text-black">Email </label>
            <div className="flex items-center bg-white rounded-full px-4 py-3 shadow-sm">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 outline-none bg-transparent placeholder-gray-400 text-gray-800" />
            </div>
          </div>

          <div>
            <label className="pass text-black">Password</label>
            <div className="flex items-center bg-white rounded-full px-4 py-3 shadow-sm">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 outline-none bg-transparent placeholder-gray-400 text-gray-800" />
              <button type="button" onClick={() => setShow(!show)} className="ml-2 text-gray-600">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>


          {/* Button Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-full py-3 font-medium text-white bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {loading ? "Loading..." : "Login"}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.replace("/reset-password")}
              className="text-sm text-blue-800"
            >
              Lupa Password?
            </button>
          </div>

        </form>

        <div className="mt-8 p-4 bg-blue-100/40 rounded-2xl border border-blue-200/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2 text-blue-900">
            <Bell size={16} className="text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-semibold">Update Terbaru 09 Maret 2026</span>
          </div>
          <ul className="text-[11px] text-blue-900/80 space-y-1.5 list-disc list-inside">
            <li className="leading-tight font-medium">Penambahan Notifikasi Aktivitas User & Admin pada icon Bell</li>
            <li className="leading-tight font-medium">Penyesuaian Tampilan Dashboard Admin</li>
            <li className="leading-tight font-medium">Penyesuaian Tampilan Dashboard User</li>
            <li className="leading-tight font-medium">Fitur Cetak PDF Nota Dinas (Format F4)</li>
            <li className="leading-tight font-medium">Dasar SPT Otomatis berdasarkan Arahan Camat</li>
            <li className="leading-tight font-medium">Format PDF: Rata Kanan-Kiri & Indentasi Paragraf</li>
          </ul>
        </div>

        {/* Sign up link */}
        <div className="mt-6 text-center text-sm text-gray-700">Belum Punya Akun ? <a href="#" className="font-semibold text-blue-800">Sign up</a></div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

      </div>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>

  );

}