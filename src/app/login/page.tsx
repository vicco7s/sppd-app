"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/services/firebases";
import { signInWithEmailAndPassword, User as AuthUser } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { User as DbUser } from "@/types";

import UpdateNotificationModal from "@/components/UpdateNotificationModal";
import AuthBackground from "@/components/auth/AuthBackground";
import LoginCard from "@/components/auth/LoginCard";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: AuthUser | null) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "user", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as DbUser;
            if (userData.status === "inactive") {
              await auth.signOut();
              toast.error("Akun Anda telah dinonaktifkan. Silakan hubungi admin.");
              setLoading(false);
              return;
            }
            const role = userData.role;
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
  }, [router]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as DbUser;
        if (userData.status === "inactive") {
          await auth.signOut();
          toast.error("Akun Anda telah dinonaktifkan. Silakan hubungi admin.");
          setError("Akun Anda telah dinonaktifkan. Silakan hubungi admin.");
          return;
        }

        try {
          await addDoc(collection(db, "notifications"), {
            title: "Login",
            message: `${userData.name || user.email || "User"} login pada ${new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}.`,
            type: "login",
            userName: userData.name || user.email || "User",
            userEmail: user.email || "-",
            userUid: user.uid,
            createdAt: serverTimestamp(),
            isRead: false
          });
        } catch (loginErr) {
          console.error("Failed to record login activity:", loginErr);
        }

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
      setError("Email atau password yang Anda masukkan tidak valid.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <AuthBackground>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium text-sm">Memeriksa sesi...</p>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <div className="grid w-full max-w-[1120px] grid-cols-1 overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex items-center px-7 py-10 sm:px-12 lg:px-16 lg:py-14">
          <LoginCard>
            <div className="mb-8">
              <div className="mb-10 flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="h-2 w-2 rounded-full bg-yellow-600" />
                Version 4.2.0 Gemini x GLM AI
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Masuk ke akun Anda
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Selamat datang. Silakan masukkan Email dan Password Anda untuk Login.
              </p>
            </div>

            <LoginForm 
              onSubmit={handleLogin} 
              loading={isLoggingIn} 
              error={error}
              onForgotPassword={() => router.replace("/reset-password")}
            />
          </LoginCard>
        </div>

        <div className="relative hidden min-h-[620px] overflow-hidden bg-slate-100 lg:block">
          <img
            src="https://i.pinimg.com/1200x/f9/db/df/f9dbdf50e8c859e059b9d4e0d6c31124.jpg"
            alt="Ilustrasi halaman login"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
          <div className="absolute bottom-10 left-10 max-w-sm text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              Coming Soon...
            </p>
            <p className="mt-3 text-2xl font-semibold leading-tight">
              5.0 Solution
            </p>
          </div>
        </div>
      </div>

      <UpdateNotificationModal />
    </AuthBackground>
  );
}
