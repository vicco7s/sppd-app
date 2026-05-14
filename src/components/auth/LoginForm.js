"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import LoginInput from "./LoginInput";
import LoginButton from "./LoginButton";

export default function LoginForm({ onSubmit, loading, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <LoginInput
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nama@gmail.com"
        required
      />

      <LoginInput
        id="password"
        label="Password"
        type={show ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
        suffix={
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="p-1.5 rounded-md hover:bg-slate-100/50 focus:outline-none transition-colors"
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />

      <div className="pt-2">
        <LoginButton loading={loading}>
          {loading ? "Memproses..." : "Log in"}
        </LoginButton>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-[13px] font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          Lupa Password?
        </button>
        <span className="text-[13px] text-slate-400">
          Belum punya akun?{" "}
          <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Sign up
          </a>
        </span>
      </div>
    </form>
  );
}
