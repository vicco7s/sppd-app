"use client";

export default function LoginCard({ children }) {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="relative w-full bg-white p-0">
        {children}
      </div>
    </div>
  );
}
