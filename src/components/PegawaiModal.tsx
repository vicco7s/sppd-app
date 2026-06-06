"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Pegawai } from "@/types/index";

interface PegawaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Record<string, unknown>) => Promise<void>;
  pegawaiData: Pegawai | null | undefined;
  isSaving?: boolean;
}

interface FormData {
  nip: string;
  nama: string;
  jabatan: string;
  pangkat: string;
  rek: string;
  bank: string;
  tgllahir: string;
}

const BANK_OPTIONS = [
  { value: "Bank Kalsel", label: "Bank Kalsel" },
  { value: "Bank Kalsel Syariah", label: "Bank Kalsel Syariah" },
  { value: "Bank Rakyat Indonesia (BRI)", label: "Bank Rakyat Indonesia (BRI)" },
  { value: "Bank BNI", label: "Bank BNI" },
  { value: "Bank Mandiri", label: "Bank Mandiri" },
  { value: "Bank BTN", label: "Bank BTN" },
  { value: "Bank BSI", label: "Bank BSI" },
];

export default function PegawaiModal({ isOpen, onClose, onSave, pegawaiData = null, isSaving = false }: PegawaiModalProps) {
  const [formData, setFormData] = useState<FormData>({
    nip: "",
    nama: "",
    jabatan: "",
    pangkat: "",
    rek: "",
    bank: "",
    tgllahir: ""
  });

  useEffect(() => {
    if (pegawaiData) {
      // If editing, populate form with existing data
      let formattedDate = "";
      if (pegawaiData.tgllahir) {
        const tgllahir = pegawaiData.tgllahir;
        const date = tgllahir && typeof tgllahir === "object" && "toDate" in tgllahir
          ? (tgllahir as { toDate: () => Date }).toDate()
          : new Date(tgllahir as string | number);
        formattedDate = date.toISOString().split('T')[0];
      }

      setFormData({
        nip: pegawaiData.nip || "",
        nama: pegawaiData.nama || "",
        jabatan: pegawaiData.jabatan || "",
        pangkat: pegawaiData.pangkat || "",
        rek: (pegawaiData as Record<string, unknown>).rek as string || "",
        bank: (pegawaiData as Record<string, unknown>).bank as string || "",
        tgllahir: formattedDate
      });
    } else {
      // If adding, reset form
      setFormData({
        nip: "",
        nama: "",
        jabatan: "",
        pangkat: "",
        rek: "",
        bank: "",
        tgllahir: ""
      });
    }
  }, [pegawaiData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData as unknown as Record<string, unknown>);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 my-auto">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center text-gray-800 sticky top-0 z-10">
          <h3 className="font-bold text-lg text-white">
            {pegawaiData ? "Edit Data Pegawai" : "Tambah Pegawai Baru"}
          </h3>
          <button onClick={onClose} aria-label="Tutup" className="hover:bg-blue-700 p-1 rounded-full text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
            <input
              type="text"
              required
              placeholder="Contoh: 1980... atau -"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              placeholder="Nama Lengkap & Gelar"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kepala Seksi ..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all"
              value={formData.jabatan}
              onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pangkat/Golongan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Penata / III.c"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all"
              value={formData.pangkat}
              onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
            <input
              type="text"
              required
              placeholder="Nomor Rekening Bank"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all"
              value={formData.rek}
              onChange={(e) => setFormData({ ...formData, rek: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
            <select
              required
              title="Pilih Nama Bank"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all bg-white"
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
            >
              <option value="" disabled>Pilih Bank</option>
              {BANK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
            <input
              type="date"
              required
              title="Tanggal Lahir"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-all"
              value={formData.tgllahir}
              onChange={(e) => setFormData({ ...formData, tgllahir: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 bg-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-200"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Menyimpan...
                </span>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
