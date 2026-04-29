"use client";

import React from "react";
import { X, Receipt, Sparkles } from "lucide-react";
import KwitansiForm from "./KwitansiForm";

export default function KwitansiModal({ 
  isOpen, 
  onClose, 
  pegawaiList, 
  kodeRekeningOptions, 
  onSubmit, 
  isSubmitting, 
  editingData,
  isAdmin = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
      <div
        className="bg-white rounded-[1.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
      >
        {/* Header - Simple Blue */}
        <div className="relative bg-blue-600 px-6 py-4 text-white shrink-0">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-9 h-9 rounded-lg flex items-center justify-center border border-white/20 shadow-inner">
                <Receipt className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold leading-none mb-1">
                  {editingData ? "Edit Kwitansi" : "Kwitansi Baru"}
                </h2>
                <p className="text-blue-100/70 text-[10px] font-medium flex items-center gap-1.5">
                  Isi informasi pengeluaran dengan lengkap
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Content Area - Compact Padding */}
        <div className="px-4 py-3 overflow-y-auto custom-scrollbar bg-gray-50/20">
          <KwitansiForm
            pegawaiList={pegawaiList}
            kodeRekeningOptions={kodeRekeningOptions}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            editingData={editingData}
            onCancel={onClose}
            isAdmin={isAdmin}
          />
        </div>

      </div> 
    </div>
  );
}
