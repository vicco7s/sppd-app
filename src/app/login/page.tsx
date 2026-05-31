"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/services/firebases";
import { signInWithEmailAndPassword, User as AuthUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
      <LoginCard>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            masuk ke akun anda
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
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

      <UpdateNotificationModal />
    </AuthBackground>
  );
}
