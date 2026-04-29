"use client";

import React, { useEffect, useState } from "react";
import { 
  Briefcase, 
  User, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Info, 
  ChevronRight,
  Plus,
  X,
  Landmark,
  PenBox
} from "lucide-react";

const initialFormData = {
  accountOptionId: "",
  program: "",
  kegiatan: "",
  subKegiatan: "",
  kodeRekening: "",
  namaRekeningBelanja: "",
  pegawaiId: "",
  namaRekening: "",
  nomorRekening: "",
  namaBank: "",
  nominal: "",
  tanggal: "",
  keperluan: "", // Add keperluan
};

export default function KwitansiForm({
  pegawaiList,
  kodeRekeningOptions,
  onSubmit,
  isSubmitting,
  editingData = null,
  onCancel,
  isAdmin = false
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [customAccount, setCustomAccount] = useState(false);

  useEffect(() => {
    if (editingData) {
      setFormData(editingData);
    } else {
      setFormData(initialFormData);
    }
  }, [editingData]);

  useEffect(() => {
    if (formData.pegawaiId) {
      const selected = pegawaiList.find((pegawai) => pegawai.id === formData.pegawaiId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          namaRekening: selected.nama || prev.namaRekening,
          nomorRekening: selected.rek || prev.nomorRekening,
          namaBank: selected.bank || prev.namaBank, // Also auto-fill bank if available
        }));
      }
    }
  }, [formData.pegawaiId, pegawaiList]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePegawaiChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, pegawaiId: value }));
  };

  const handleAccountChange = (event) => {
    const value = event.target.value;
    if (value === "__custom") {
      setCustomAccount(true);
      setFormData((prev) => ({
        ...prev,
        accountOptionId: "",
        program: "",
        kegiatan: "",
        subKegiatan: "",
        kodeRekening: "",
        namaRekeningBelanja: "",
      }));
      return;
    }

    setCustomAccount(false);
    const selected = kodeRekeningOptions.find((option) => option.id === value);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        accountOptionId: selected.id,
        program: selected.program || selected.namaProgram || selected.nameProgram || "",
        kegiatan: selected.kegiatan || selected.namaKegiatan || selected.nameKegiatan || "",
        subKegiatan: selected.subKegiatan || selected.namaSubKegiatan || selected.nameSubKegiatan || "",
        kodeRekening: selected.kodeRekening || selected.nama || selected.value || "",
        namaRekeningBelanja: selected.namaRekeningBelanja || selected.nama || selected.description || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        accountOptionId: "",
        program: "",
        kegiatan: "",
        subKegiatan: "",
        kodeRekening: "",
        namaRekeningBelanja: "",
      }));
    }
  };


  const internalSubmit = async (event) => {
    event.preventDefault();

    const success = await onSubmit(formData);
    if (success) {
      if (!editingData) {
        setFormData(initialFormData);
      }
      setCustomAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={internalSubmit} className="space-y-6">
        {/* Section 1: Data Rekening Belanja */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
            <div className="p-1 bg-blue-50 rounded-md">
              <Briefcase className="text-blue-600" size={14} />
            </div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Rekening Belanja</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Pilih Kode Rekening</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAccount((prev) => !prev);
                      if (!customAccount) {
                        setFormData((prev) => ({
                          ...prev,
                          accountOptionId: "",
                          program: "",
                          kegiatan: "",
                          subKegiatan: "",
                          kodeRekening: "",
                          namaRekeningBelanja: "",
                        }));
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                      customAccount 
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20" 
                        : "bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {customAccount ? <X size={12} /> : <Plus size={12} />}
                    {customAccount ? "Batal Manual" : "Input Manual"}
                  </button>
                )}
              </div>
              <div className="relative group">
                <select
                  name="accountOptionId"
                  value={formData.accountOptionId}
                  onChange={handleAccountChange}
                  disabled={customAccount}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 group-hover:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">-- Pilih kode rekening belanja --</option>
                  {kodeRekeningOptions.map((option) => {
                    const label = option.kodeRekening
                      ? `${option.kodeRekening} - ${option.namaRekeningBelanja || option.nama || option.name || ""}`
                      : option.nama || option.name || option.value || "Data rekening";
                    return (
                      <option key={option.id} value={option.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
              {kodeRekeningOptions.length === 0 && !customAccount && (
                <div className="flex items-center gap-1.5 px-1 pt-1">
                  <Info size={12} className="text-amber-500" />
                  <p className="text-[10px] font-medium text-amber-600 italic">Data referensi kosong. Silakan gunakan tombol "Input Manual" di atas.</p>
                </div>
              )}
            </div>
          </div>

          {customAccount && (
            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase ml-1">Program</span>
                  <input
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    placeholder="Contoh: Program Dukungan Manajemen"
                    className="w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase ml-1">Kegiatan</span>
                  <input
                    name="kegiatan"
                    value={formData.kegiatan}
                    onChange={handleChange}
                    placeholder="Masukkan kegiatan"
                    className="w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase ml-1">Sub Kegiatan</span>
                  <input
                    name="subKegiatan"
                    value={formData.subKegiatan}
                    onChange={handleChange}
                    placeholder="Masukkan sub kegiatan"
                    className="w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase ml-1">Kode Rekening</span>
                  <input
                    name="kodeRekening"
                    value={formData.kodeRekening}
                    onChange={handleChange}
                    placeholder="Contoh: 5.1.02.04.01.0003"
                    className="w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase ml-1">Nama Rekening Belanja</span>
                  <input
                    name="namaRekeningBelanja"
                    value={formData.namaRekeningBelanja}
                    onChange={handleChange}
                    placeholder="Contoh: Belanja Perjalanan Dinas Paket Meeting Dalam Kota"
                    className="w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Informasi Penerima */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
            <div className="p-1 bg-indigo-50 rounded-md">
              <User className="text-indigo-600" size={14} />
            </div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Informasi Penerima</h4>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Pilih Rekening Pegawai</span>
                <div className="relative group">
                  <select
                    name="pegawaiId"
                    value={formData.pegawaiId}
                    onChange={handlePegawaiChange}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 group-hover:border-gray-300"
                  >
                    <option value="">-- Pilih pegawai --</option>
                    {pegawaiList.map((pegawai) => (
                      <option key={pegawai.id} value={pegawai.id}>
                        {pegawai.nama} {pegawai.rek ? `(${pegawai.rek})` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase ml-1">Nama di Rekening</span>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-400 transition-colors">
                    <User size={14} />
                  </div>
                  <input
                    name="namaRekening"
                    value={formData.namaRekening}
                    onChange={handleChange}
                    placeholder={!formData.pegawaiId ? "Pilih pegawai..." : ""}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-all cursor-default"
                    readOnly
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase ml-1">Nomor Rekening</span>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-400 transition-colors">
                    <CreditCard size={14} />
                  </div>
                  <input
                    name="nomorRekening"
                    value={formData.nomorRekening}
                    onChange={handleChange}
                    placeholder={!formData.pegawaiId ? "Pilih pegawai..." : ""}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-all cursor-default"
                    readOnly
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Detail Transaksi */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
            <div className="p-1 bg-violet-50 rounded-md">
              <DollarSign className="text-violet-600" size={14} />
            </div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Detail Transaksi</h4>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nama Bank</span>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors">
                  <Landmark size={14} />
                </div>
                <input
                  name="namaBank"
                  list="bank-list"
                  value={formData.namaBank}
                  onChange={handleChange}
                  placeholder="Pilih atau ketik bank..."
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 group-hover:border-gray-300"
                />
              </div>
              <datalist id="bank-list">
                <option value="BANK KALSEL" />
                <option value="BANK KALSEL SYARIAH" />
                <option value="BANK BRI" />
                <option value="BANK BNI" />
                <option value="BANK MANDIRI" />
                <option value="BANK BCA" />
                <option value="BANK TABUNGAN NEGARA (BTN)" />
              </datalist>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase ml-1">Nominal (Rp)</span>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                  Rp
                </div>
                <input
                  name="nominal"
                  value={formData.nominal}
                  onChange={handleChange}
                  placeholder="0"
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 font-bold outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase ml-1">Tanggal Kwitansi</span>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Calendar size={14} />
                </div>
                <input
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  type="date"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />
              </div>
            </label>
          </div>

          {/* New Field: Keperluan */}
          <div className="grid grid-cols-1">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase ml-1">Keperluan / Perihal</span>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-violet-500 transition-colors">
                  <PenBox size={14} />
                </div>
                <textarea
                  name="keperluan"
                  value={formData.keperluan}
                  onChange={handleChange}
                  placeholder="Contoh: Pembayaran Biaya Perjalanan Dinas Dalam Kota..."
                  rows="3"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 group-hover:border-gray-300 resize-none"
                />
              </div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 sm:flex-row sm:items-center sm:justify-end">
          {editingData ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all active:scale-95"
            >
              Batalkan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setFormData(initialFormData)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all active:scale-95"
            >
              Reset
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/10 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                {editingData ? "Perbarui Kwitansi" : "Simpan Kwitansi"}
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
