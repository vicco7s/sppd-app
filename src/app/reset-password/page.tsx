"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/services/firebases";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AuthBackground from "@/components/auth/AuthBackground";
import LoginCard from "@/components/auth/LoginCard";
import LoginInput from "@/components/auth/LoginInput";
import LoginButton from "@/components/auth/LoginButton";

export default function ResetPassword() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleReset = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Link reset password telah dikirim ke email Anda");
      setTimeout(() => router.replace("/login"), 1500);
    } catch (err: unknown) {
      setError("Email tidak ditemukan atau terjadi kesalahan.");
      toast.error("Email tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <LoginCard>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reset Password
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang password Anda.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleReset}>
          <LoginInput
                      id="email"
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      placeholder="nama@gmail.com"
                      required suffix={undefined}          />

          <div className="pt-2">
            <LoginButton loading={loading}>
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </LoginButton>
          </div>

          <div className="flex items-center justify-center mt-6">
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke Log in
            </button>
          </div>

          {/* {error && (
            <div className="mt-4 p-3 bg-red-50/50 border border-red-100 rounded-xl text-center">
              <p className="text-[13px] text-red-600 font-medium">{error}</p>
            </div>
          )} */}
        </form>
      </LoginCard>
    </AuthBackground>
  );
}