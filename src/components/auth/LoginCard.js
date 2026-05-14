"use client";

export default function LoginCard({ children }) {
  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      {/* Subtle background shadow for depth */}
      <div className="absolute inset-0 bg-black/5 rounded-[2rem] blur-2xl transform translate-y-4"></div>
      
      {/* Main Card */}
      <div className="relative w-full rounded-[2rem] bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 p-8 sm:p-10 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
