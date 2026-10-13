"use client";

import React, { useState, useRef } from "react";
import { Sparkles, Upload, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onExtractedData: (data: any) => void;
  onFileSelected?: (file: File) => void;
}

export default function UploadDocAiModal({ onExtractedData, onFileSelected }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:mime/type;base64,
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file?: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    setSelectedFileName(file.name);
    if (onFileSelected) onFileSelected(file);

    setIsProcessing(true);
    const toastId = toast.loading("Gemini 3.5 Flash Lite sedang membaca dokumen...");

    try {
      const base64 = await convertFileToBase64(file);
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "autofill",
          fileBase64: base64,
          mimeType: file.type || "application/pdf",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengekstrak data dari dokumen");
      }

      toast.success("Dokumen berhasil diekstrak oleh Gemini!", { id: toastId });
      onExtractedData(json.data);
    } catch (err: any) {
      console.error("AI Autofill Error:", err);
      toast.error(err.message || "Gagal memproses file dengan AI", { id: toastId });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isProcessing) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        if (!isProcessing) setIsDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) {
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
      className={`rounded-xl border p-4 shadow-sm transition-colors ${isDragging ? "border-blue-500 bg-blue-100" : "border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/60"}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Autofill Cerdas dengan Gemini 3.5 Flash Lite
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                AI Powered
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isDragging ? "Lepaskan file untuk mengisi formulir otomatis." : "Unggah atau jatuhkan surat undangan PDF/foto untuk mengisi formulir otomatis."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="hidden"
            id="upload-doc-ai"
          />
          <label
            htmlFor="upload-doc-ai"
            className={`w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition ${
              isProcessing
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Mengekstrak Data...
              </>
            ) : (
              <>
                <Upload size={15} />
                Pilih File Dokumen (PDF/Gambar)
              </>
            )}
          </label>
        </div>
      </div>

      {selectedFileName && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200">
          <FileText size={14} className="text-blue-500" />
          <span className="truncate">File terakhir: {selectedFileName}</span>
        </div>
      )}
    </div>
  );
}
