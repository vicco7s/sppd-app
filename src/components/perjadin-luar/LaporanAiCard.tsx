"use client";

import React, { useState } from "react";
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Sparkles, Loader2, FileCheck2 } from "lucide-react";
import toast from "react-hot-toast";
import { PerjadinLuarFormData } from "@/lib/validations/perjadinLuarSchema";

interface Props {
  control: Control<PerjadinLuarFormData>;
  watch: UseFormWatch<PerjadinLuarFormData>;
  setValue: UseFormSetValue<PerjadinLuarFormData>;
}

export default function LaporanAiCard({ control, watch, setValue }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const perihal = watch("perihalSurat");
  const maksud = watch("maksudPerjalanan");
  const tempat = watch("tempatTujuan");
  const tglBerangkat = watch("tanggalBerangkat");
  const tglKembali = watch("tanggalKembali");
  const pelaksanaList = watch("pelaksanaList");

  const handleGenerateLaporan = async () => {
    if (!maksud && !perihal) {
      toast.error("Harap isi perihal surat atau maksud perjalanan terlebih dahulu!");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Gemini 3.5 Flash Lite sedang menyusun draf laporan...");

    try {
      const pesertaNames = (pelaksanaList || []).map((p) => p.nama).filter(Boolean);

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-laporan",
          perihal: perihal || "-",
          maksud: maksud || "-",
          tempat: tempat || "-",
          tanggalBerangkat: tglBerangkat || "-",
          tanggalKembali: tglKembali || "-",
          peserta: pesertaNames,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyusun laporan.");
      }

      const data = json.data;
      if (data.kegiatan) setValue("laporan.kegiatan", data.kegiatan);
      if (data.hasil) setValue("laporan.hasil", data.hasil);
      if (data.kesimpulanSaran) setValue("laporan.kesimpulanSaran", data.kesimpulanSaran);
      if (data.penutup) setValue("laporan.penutup", data.penutup);

      toast.success("Draf laporan berhasil dibuat oleh Gemini!", { id: toastId });
    } catch (err: any) {
      console.error("Generate Laporan Error:", err);
      toast.error(err.message || "Gagal membuat laporan dengan AI", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <FileCheck2 size={18} className="text-blue-600" />
            Laporan Hasil Perjalanan Dinas Luar Daerah (Screenshot 3)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan resmi memuat Pendahuluan (Perbup Tapin No 01/2024), Dasar Hukum, serta 4 poin substansi di bawah ini.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateLaporan}
          disabled={isGenerating}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition ${
            isGenerating
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Menyusun Draf Laporan...
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Generate Laporan (Gemini AI)
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kolom 1: Kegiatan yang dilaksanakan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            B. Kegiatan yang Dilaksanakan
          </label>
          <textarea
            rows={5}
            {...control.register("laporan.kegiatan")}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
            placeholder="- Mengikuti pembukaan acara...&#10;- Menerima materi penatausahaan APBD..."
          />
        </div>

        {/* Kolom 2: Hasil yang dicapai */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            C. Hasil yang Dicapai
          </label>
          <textarea
            rows={5}
            {...control.register("laporan.hasil")}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
            placeholder="- Tersusunnya pemahaman teknis mengenai tata kelola APBD...&#10;- Diperoleh panduan regulasi terbaru..."
          />
        </div>

        {/* Kolom 3: Kesimpulan dan Saran */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            D. Kesimpulan dan Saran
          </label>
          <textarea
            rows={4}
            {...control.register("laporan.kesimpulanSaran")}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
            placeholder="- Kesimpulan: Kegiatan berjalan lancar dan relevan...&#10;- Saran: Perlunya diseminasi internal di Kecamatan Salam Babaris..."
          />
        </div>

        {/* Kolom 4: Penutup */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            E. Penutup
          </label>
          <textarea
            rows={4}
            {...control.register("laporan.penutup")}
            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
            placeholder="Demikian laporan perjalanan dinas ini disusun sebagai bentuk pertanggungjawaban..."
          />
        </div>
      </div>
    </div>
  );
}
