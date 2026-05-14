"use client";

export default function LoginInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  suffix,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-slate-600 ml-1"
      >
        {label}
      </label>
      <div
        className="relative flex items-center rounded-xl bg-white/60 border border-slate-200/60 
          transition-all duration-200 shadow-sm
          hover:bg-white/80 hover:border-slate-300/80
          focus-within:bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/50"
      >
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="flex-1 w-full bg-transparent text-[15px] text-slate-800 placeholder-slate-400/80 outline-none px-4 py-3 rounded-xl"
        />
        {suffix && (
          <div className="absolute right-3 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors duration-200">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}
