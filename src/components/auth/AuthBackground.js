"use client";

export default function AuthBackground({ children }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#FAFAFA]">
      {/* Base gradient - very soft, desaturated yellow to slate blue */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #b16400ff 0%, #fdfdfd 100%)",
        }}
      />

      {/* Ambient soft light — top left warm (desaturated yellow) */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-50 blur-[120px] pointer-events-none mix-blend-multiply"
        style={{ background: "#fef0c3" }}
      />

      {/* Ambient soft light — bottom right cool (desaturated blue) */}
      <div
        className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-50 blur-[120px] pointer-events-none mix-blend-multiply"
        style={{ background: "#dbeafe" }}
      />
      
      {/* Additional subtle accent to connect the colors smoothly */}
      <div
        className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full opacity-30 blur-[100px] pointer-events-none"
        style={{ background: "#bfdbfe" }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
