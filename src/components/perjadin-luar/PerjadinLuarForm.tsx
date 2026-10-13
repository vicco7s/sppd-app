"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  Calendar,
  MapPin,
  Car,
  Building,
  UserCheck,
  CheckCircle,
  Save,
  ArrowLeft,
  BedDouble,
  DollarSign,
  UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";
import { Pegawai } from "@/types";
import {
  perjadinLuarSchema,
  PerjadinLuarFormData,
} from "@/lib/validations/perjadinLuarSchema";
import UploadDocAiModal from "./UploadDocAiModal";
import PelaksanaFieldArray from "./PelaksanaFieldArray";
import LaporanAiCard from "./LaporanAiCard";
import { tarifTransport, kelipatanTransport, buildUangHarian } from "@/lib/perjadinLuar/tarifPerbub";

interface Props {
  initialData?: any;
  pegawaiList: Pegawai[];
  onSubmit: (data: PerjadinLuarFormData, files: { undanganFile?: File; tiketFile?: File; hotelFile?: File }) => Promise<void>;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export default function PerjadinLuarForm({
  initialData,
  pegawaiList,
  onSubmit,
  isSubmitting,
  isEdit = false,
}: Props) {
  const [undanganFile, setUndanganFile] = useState<File | undefined>();
  const [tiketFile, setTiketFile] = useState<File | undefined>();
  const [hotelFile, setHotelFile] = useState<File | undefined>();

  const defaultValues: PerjadinLuarFormData = {
    no: 1,
    noSpt: "800.1.11.1/1/ST/2026",
    tanggalSpt: "",
    noSpd: "000.2.2.4/1/SPD/2026",
    tanggalSpd: "",
    suratDari: "",
    tanggalSurat: "",
    perihalSurat: "",
    maksudPerjalanan: "",
    tempatBerangkat: "",
    tempatTujuan: "",
    tanggalBerangkat: "",
    tanggalKembali: "",
    lamaHari: 1,
    lamaMalam: 0,
    alatAngkutan: "",
    kotaTujuan: "Banjarmasin",
    pulangPergi: true,
    pembebananSkpd: "",
    kodeRekening: "",
    namaPejabatTtd: "",
    jabatanPejabatTtd: "",
    pangkatPejabatTtd: "",
    nipPejabatTtd: "",
    tanpaPenginapan: false,
    pelaksanaList: [],
    laporan: {
      kegiatan: "",
      hasil: "",
      kesimpulanSaran: "",
      penutup: "",
    },
    pengeluaranRiil: [],
    status: "Menunggu",
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PerjadinLuarFormData>({
    resolver: zodResolver(perjadinLuarSchema) as any,
    defaultValues: initialData || defaultValues,
  });

  const tanpaPenginapan = watch("tanpaPenginapan");
  const tanggalBerangkat = watch("tanggalBerangkat");
  const tanggalKembali = watch("tanggalKembali");
  const kotaTujuan = watch("kotaTujuan");
  const pulangPergi = watch("pulangPergi");
  const lamaHari = watch("lamaHari");

  // Hitung lama hari & malam otomatis jika tanggal berangkat & kembali berubah
  useEffect(() => {
    if (tanggalBerangkat && tanggalKembali) {
      const start = new Date(tanggalBerangkat);
      const end = new Date(tanggalKembali);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;
      if (diffDays > 0) {
        setValue("lamaHari", diffDays);
        setValue("lamaMalam", Math.max(0, diffDays - 1));
      }
    }
  }, [tanggalBerangkat, tanggalKembali, setValue]);

  // Auto-fill tarif transport semua pelaksana sesuai kota tujuan & opsi pulang-pergi (Perbub)
  useEffect(() => {
    const tarif = tarifTransport(kotaTujuan);
    const mult = kelipatanTransport(pulangPergi);
    const list = watch("pelaksanaList") || [];
    list.forEach((_, idx) => {
      setValue(`pelaksanaList.${idx}.transport.tarif`, tarif);
      setValue(`pelaksanaList.${idx}.transport.volume`, `${mult} Kali`);
      setValue(`pelaksanaList.${idx}.transport.total`, tarif * mult);
    });
  }, [kotaTujuan, pulangPergi, setValue, watch]);

  // Auto-fill uang harian semua pelaksana: hari berangkat & pulang penuh, sisanya 1/4 (Perbub)
  useEffect(() => {
    const rows = buildUangHarian(Number(lamaHari) || 0);
    const list = watch("pelaksanaList") || [];
    list.forEach((_, idx) => setValue(`pelaksanaList.${idx}.uangHarian` as any, rows as any, { shouldDirty: true }));
  }, [lamaHari, setValue, watch]);

  // Sync perubahan toggle tanpa penginapan ke seluruh pelaksana (sub-total dihitung otomatis di kartu)
  useEffect(() => {
    const list = watch("pelaksanaList");
    if (list && list.length > 0) {
      list.forEach((pelaksana, idx) => {
        setValue(`pelaksanaList.${idx}.penginapan.isTanpaPenginapan`, tanpaPenginapan);
        setValue(`pelaksanaList.${idx}.penginapan.persen`, tanpaPenginapan ? 30 : 100);
        setValue(
          `pelaksanaList.${idx}.penginapan.keterangan`,
          tanpaPenginapan ? "Tanpa Menginap Di Hotel Berbayar" : "Hotel Berbayar"
        );
      });
    }
  }, [tanpaPenginapan, setValue, watch]);

  // Callback saat AI mengekstrak data dari dokumen
  const handleAiExtractedData = (data: any) => {
    if (!data) return;
    if (data.suratDari) setValue("suratDari", data.suratDari);
    if (data.tanggalSurat) setValue("tanggalSurat", data.tanggalSurat);
    if (data.perihalSurat) setValue("perihalSurat", data.perihalSurat);
    if (data.maksudPerjalanan) setValue("maksudPerjalanan", data.maksudPerjalanan);
    if (data.tempatTujuan) setValue("tempatTujuan", data.tempatTujuan);
    if (data.tanggalBerangkat) setValue("tanggalBerangkat", data.tanggalBerangkat);
    if (data.tanggalKembali) setValue("tanggalKembali", data.tanggalKembali);
    if (data.lamaHari) setValue("lamaHari", data.lamaHari);
    if (data.lamaMalam !== undefined) setValue("lamaMalam", data.lamaMalam);
  };

  const handleFormSubmit = async (data: PerjadinLuarFormData) => {
    try {
      await onSubmit(data, { undanganFile, tiketFile, hotelFile });
    } catch (err: any) {
      console.error("Submit Error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* 1. OCR / AI Autofill Header Section */}
      <UploadDocAiModal
        onExtractedData={handleAiExtractedData}
        onFileSelected={(f) => setUndanganFile(f)}
      />

      {/* 2. Surat Tugas & SPPD Metadata */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2 flex items-center gap-2">
          <FileText size={17} className="text-blue-600" />
          Nomor Dokumen & Dasar Penugasan (Screenshot 1 & 2)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nomor *</label>
            <input
              type="number"
              {...register("no", {
                onChange: (event) => {
                  const nomor = event.target.value;
                  setValue("noSpt", nomor ? `800.1.11.1/${nomor}/ST/2026` : "");
                  setValue("noSpd", nomor ? `000.2.2.4/${nomor}/SPD/2026` : "");
                },
              })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
              min="1"
            />
            {errors.no && <p className="text-red-500 mt-0.5">{errors.no.message}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nomor Surat Tugas (ST) *</label>
            <input
              type="text"
              {...register("noSpt")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="800.1.11.1/ 111 /ST/2026"
            />
            {errors.noSpt && <p className="text-red-500 mt-0.5">{errors.noSpt.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tanggal ST *</label>
            <input
              type="date"
              {...register("tanggalSpt")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tanggal SPPD *</label>
            <input
              type="date"
              {...register("tanggalSpd")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nomor SPPD *</label>
            <input
              type="text"
              {...register("noSpd")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="000.2.2.4/11/SPD/2026"
            />
            {errors.noSpd && <p className="text-red-500 mt-0.5">{errors.noSpd.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2">
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Dasar Surat / Instansi Pengirim *</label>
            <input
              type="text"
              {...register("suratDari")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="Surat dari BKAD Tapin Nomor: 900.1.3/548/BKAD-PBH/V/2026..."
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Perihal Undangan *</label>
            <input
              type="text"
              {...register("perihalSurat")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="Undangan FGD Pengelolaan TKD"
            />
          </div>
        </div>
      </div>

      {/* 3. Maksud, Jadwal & Tempat Tujuan */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2 flex items-center gap-2">
          <MapPin size={17} className="text-blue-600" />
          Tujuan, Waktu & Moda Transportasi
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Maksud Perjalanan Dinas (Untuk) *</label>
          <textarea
            rows={3}
            {...register("maksudPerjalanan")}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-1 focus:ring-blue-500"
            placeholder="Dalam rangka kegiatan Focus Group Discussion (FGD) Pengelolaan TKD..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tempat Berangkat</label>
            <input
              type="text"
              {...register("tempatBerangkat")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tempat Tujuan *</label>
            <input
              type="text"
              {...register("tempatTujuan")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="Hotel Aria Barito Banjarmasin"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tanggal Berangkat *</label>
            <input
              type="date"
              {...register("tanggalBerangkat")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tanggal Kembali *</label>
            <input
              type="date"
              {...register("tanggalKembali")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lama Berangkat (Hari)</label>
            <input
              type="number"
              {...register("lamaHari")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lama Menginap (Malam)</label>
            <input
              type="number"
              {...register("lamaMalam")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alat Angkutan</label>
            <input
              type="text"
              {...register("alatAngkutan")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
              placeholder="Kendaraan Umum"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kota Tujuan (Tarif Transport)</label>
            <select
              {...register("kotaTujuan")}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="Banjarmasin">Banjarmasin (Rp 189.000)</option>
              <option value="Banjarbaru">Banjarbaru (Rp 106.000)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transport</label>
            <select
              {...register("pulangPergi", { setValueAs: (v) => v === "true" || v === true })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="true">Pulang Pergi (2 Kali)</option>
              <option value="false">Sekali Jalan (1 Kali)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Toggle Kondisional: Tanpa Penginapan */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-sm flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm mt-0.5">
          <BedDouble size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("tanpaPenginapan")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
            <span className="text-sm font-bold text-slate-900">
              Toggle: Tanpa Penginapan Di Hotel Berbayar (Tarif 30%)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {tanpaPenginapan ? (
              <span className="text-amber-900 font-medium">
                AKTIF: Dokumen <strong>Surat Pernyataan Tidak Menginap</strong> akan otomatis di-generate untuk setiap pelaksana, dan biaya penginapan dihitung 30% dari tarif standar per malam (Rp 209.100/malam).
              </span>
            ) : (
              <span className="text-slate-600">
                NON-AKTIF: Menginap di hotel berbayar penuh (100%). Dokumen Surat Pernyataan Tidak Menginap TIDAK akan di-generate.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 5. Dynamic Pelaksana Perjalanan Dinas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <PelaksanaFieldArray
          control={control}
          watch={watch}
          setValue={setValue}
          pegawaiList={pegawaiList}
          tanpaPenginapan={tanpaPenginapan}
          pulangPergi={pulangPergi}
        />
      </div>

      {/* 6. Laporan AI (Screenshot 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <LaporanAiCard control={control} watch={watch} setValue={setValue} />
      </div>

      {/* 7. Upload File Pendukung (Undangan, Tiket, Bukti Hotel) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b pb-2 flex items-center gap-2">
          <UploadCloud size={17} className="text-blue-600" />
          Lampiran Berkas Pendukung (Undangan, Tiket, Bukti Hotel)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Surat Undangan (PDF/Gambar)</label>
            <input
              type="file"
              onChange={(e) => setUndanganFile(e.target.files?.[0])}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tiket / Bukti Transport</label>
            <input
              type="file"
              onChange={(e) => setTiketFile(e.target.files?.[0])}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bukti Hotel / Penginapan</label>
            <input
              type="file"
              onChange={(e) => setHotelFile(e.target.files?.[0])}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      </div>

      {/* 8. Tombol Aksi */}
      <div className="flex items-center justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-md transition active:scale-95 disabled:opacity-50"
        >
          <Save size={16} />
          {isSubmitting ? "Menyimpan Data..." : isEdit ? "Perbarui Data Perjadin" : "Simpan Pengajuan Perjadin"}
        </button>
      </div>
    </form>
  );
}
