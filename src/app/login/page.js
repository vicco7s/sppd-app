"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [show, setShow] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    router.push('/dashbord/dashuser');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-500 via-yellow-400 to-blue-800 p-6">
        <div className="relative w-full max-w-md rounded-3xl bg-white/60 backdrop-blur-md shadow-2xl border border-white/30 p-6">
            <button aria-label="close" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-gray-600">=</button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Log in</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="nip text-black">Nip/Nik</label>
            <div className="flex items-center bg-white rounded-full px-4 py-3 shadow-sm">
              <input type="email" placeholder="Nik/Nip" className="flex-1 outline-none bg-transparent placeholder-gray-400 text-gray-800" />
            </div>
          </div>

          <div>
            <label className="pass text-black">Password</label>
            <div className="flex items-center bg-white rounded-full px-4 py-3 shadow-sm">
              <input type={show ? "text" : "password"} placeholder="Password" className="flex-1 outline-none bg-transparent placeholder-gray-400 text-gray-800" />
              <button type="button" onClick={() => setShow(!show)} className="ml-2 text-gray-600">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>

          <div className="text-center">
            <a href="#" className="text-sm text-blue-800">Forgot your password?</a>
          </div>

          <button type="submit" className="w-full mt-2 rounded-full py-3 font-medium text-white bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg">Login</button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-700">Already have an account? <a href="#" className="font-semibold text-blue-800">Sign up</a></div>
      </div>
    </div>
  );
}