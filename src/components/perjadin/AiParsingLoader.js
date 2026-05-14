import React from 'react';
import { Sparkles } from 'lucide-react';

const AiParsingLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white/50 backdrop-blur-sm rounded-xl border border-indigo-100 animate-pulse">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <div className="relative bg-indigo-50 p-4 rounded-full">
          <Sparkles className="w-8 h-8 text-indigo-600 animate-spin-slow" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">AI sedang membaca dokumen...</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Mohon tunggu sebentar, kami sedang mengekstrak informasi penting untuk mengisi form otomatis.
        </p>
      </div>
      <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full animate-progress-indeterminate"></div>
      </div>
      
      <style jsx>{`
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%); width: 30%; }
          50% { transform: translateX(50%); width: 50%; }
          100% { transform: translateX(150%); width: 30%; }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 2s infinite linear;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AiParsingLoader;
