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
      <div className="grid w-full max-w-[1120px] grid-cols-1 overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="flex items-center px-7 py-10 sm:px-12 lg:px-16 lg:py-14">
          <LoginCard>
            <div className="mb-8">
              <div className="mb-10 flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                Version 4.1.1 Gemini x GLM
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Reset Password
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
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
                required
                suffix={undefined}
              />

              <div className="pt-2">
                <LoginButton loading={loading}>
                  {loading ? "Mengirim..." : "Kirim Link Reset"}
                </LoginButton>
              </div>

              <div className="mt-6 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => router.replace("/login")}
                  className="flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Log in
                </button>
              </div>
            </form>
          </LoginCard>
        </div>

        <div className="relative hidden min-h-[620px] overflow-hidden bg-slate-100 lg:block">
          <img
            src="https://i.pinimg.com/736x/f6/4b/ea/f64bea7dbdecea42e706d76486a90e0f.jpg"
            alt="Ilustrasi halaman reset password"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
          <div className="absolute bottom-10 left-10 max-w-sm text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              Coming Soon
            </p>
            <p className="mt-3 text-2xl font-semibold leading-tight">
              Version 5.0
            </p>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}