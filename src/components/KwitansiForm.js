"use client";

import React, { useEffect, useState, useRef } from "react";
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
  PenBox,
  Search,
  Trash2
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

const BANK_OPTIONS = [
  "BANK KALSEL",
  "BANK KALSEL SYARIAH",
  "BANK BRI",
  "BANK BNI",
  "BANK MANDIRI",
  "BANK BCA",
  "BANK TABUNGAN NEGARA (BTN)",
];

export default function KwitansiForm({
  pegawaiList,
  kodeRekeningOptions,
  onSubmit,
  isSubmitting,
  editingData = null,
  onCancel,
  isAdmin = false,
  onDeleteAccountOption
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [customAccount, setCustomAccount] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermAccount, setSearchTermAccount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenAccount, setIsOpenAccount] = useState(false);
  const [isOpenBank, setIsOpenBank] = useState(false);
  const [searchTermBank, setSearchTermBank] = useState("");
  const dropdownRef = useRef(null);
  const dropdownRefAccount = useRef(null);
  const dropdownRefBank = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (dropdownRefAccount.current && !dropdownRefAccount.current.contains(event.target)) {
        setIsOpenAccount(false);
      }
      if (dropdownRefBank.current && !dropdownRefBank.current.contains(event.target)) {
        setIsOpenBank(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPegawai = pegawaiList.filter((pegawai) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      pegawai.nama?.toLowerCase().includes(searchLower) ||
      pegawai.rek?.toLowerCase().includes(searchLower)
    );
  });

  const filteredAccount = kodeRekeningOptions.filter((option) => {
    const searchLower = searchTermAccount.toLowerCase();
    const kode = option.kodeRekening?.toLowerCase() || "";
    const nama = (option.namaRekeningBelanja || option.nama || option.name || "").toLowerCase();
    return kode.includes(searchLower) || nama.includes(searchLower);
  });

  const filteredBanks = BANK_OPTIONS.filter((bank) =>
    bank.toLowerCase().includes(searchTermBank.toLowerCase())
  );

  const selectedPegawai = pegawaiList.find((p) => p.id === formData.pegawaiId);
  const selectedAccount = kodeRekeningOptions.find((o) => o.id === formData.accountOptionId);

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
              </div>
              <div className="relative" ref={dropdownRefAccount}>
                <button
                  type="button"
                  disabled={customAccount}
                  onClick={() => setIsOpenAccount(!isOpenAccount)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 hover:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <span className={`truncate mr-2 ${!selectedAccount ? "text-gray-400" : ""}`}>
                    {selectedAccount 
                      ? (selectedAccount.kodeRekening 
                        ? `${selectedAccount.kodeRekening} - ${selectedAccount.namaRekeningBelanja || selectedAccount.nama || ""}`
                        : selectedAccount.nama || selectedAccount.namaRekeningBelanja || "")
                      : "-- Pilih kode rekening belanja --"}
                  </span>
                  <ChevronRight size={16} className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpenAccount ? "-rotate-90" : "rotate-90"}`} />
                </button>

                {isOpenAccount && !customAccount && (
                  <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="sticky top-0 border-b border-gray-50 bg-gray-50/50 p-2 backdrop-blur-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          placeholder="Cari kode atau nama rekening..."
                          value={searchTermAccount}
                          onChange={(e) => setSearchTermAccount(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                      {filteredAccount.length > 0 ? (
                        filteredAccount.map((option) => (
                          <div key={option.id} className="group/item flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleAccountChange({ target: { value: option.id } });
                                setIsOpenAccount(false);
                                setSearchTermAccount("");
                              }}
                              className={`flex-1 flex flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-blue-50/50 ${
                                formData.accountOptionId === option.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                              }`}
                            >
                              <span className="text-xs font-bold">{option.kodeRekening || "N/A"}</span>
                              <span className="text-[10px] text-gray-500 line-clamp-1">
                                {option.namaRekeningBelanja || option.nama || option.name || "Tanpa Nama"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAccountOption(option.id);
                              }}
                              className="opacity-0 group-hover/item:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all mr-1"
                              title="Hapus Referensi"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-xs font-medium text-gray-400">Kode rekening tidak ditemukan</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 hover:border-gray-300"
                  >
                    <span className={!selectedPegawai ? "text-gray-400" : ""}>
                      {selectedPegawai 
                        ? `${selectedPegawai.nama} ${selectedPegawai.rek ? `(${selectedPegawai.rek})` : ""}` 
                        : "-- Pilih pegawai --"}
                    </span>
                    <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "-rotate-90" : "rotate-90"}`} />
                  </button>

                  {isOpen && (
                    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <div className="sticky top-0 border-b border-gray-50 bg-gray-50/50 p-2 backdrop-blur-sm">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input
                            type="text"
                            placeholder="Cari nama atau rekening..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredPegawai.length > 0 ? (
                          filteredPegawai.map((pegawai) => (
                            <button
                              key={pegawai.id}
                              type="button"
                              onClick={() => {
                                handlePegawaiChange({ target: { value: pegawai.id } });
                                setIsOpen(false);
                                setSearchTerm("");
                              }}
                              className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-indigo-50/50 ${
                                formData.pegawaiId === pegawai.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700"
                              }`}
                            >
                              <span className="text-sm font-semibold">{pegawai.nama}</span>
                              {pegawai.rek && (
                                <span className="text-[10px] text-gray-400">{pegawai.rek} {pegawai.bank ? `• ${pegawai.bank}` : ""}</span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <p className="text-xs font-medium text-gray-400">Pegawai tidak ditemukan</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
              <div className="relative" ref={dropdownRefBank}>
                <button
                  type="button"
                  onClick={() => setIsOpenBank(!isOpenBank)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 hover:border-gray-300"
                >
                  <div className={`shrink-0 ${formData.namaBank ? "text-violet-500" : "text-gray-400"}`}>
                    <Landmark size={14} />
                  </div>
                  <span className={`flex-1 text-left truncate ${!formData.namaBank ? "text-gray-400" : ""}`}>
                    {formData.namaBank || "Pilih atau cari bank..."}
                  </span>
                  <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${isOpenBank ? "-rotate-90" : "rotate-90"}`} />
                </button>

                {isOpenBank && (
                  <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="sticky top-0 border-b border-gray-50 bg-gray-50/50 p-2 backdrop-blur-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="text"
                          placeholder="Cari nama bank..."
                          value={searchTermBank}
                          onChange={(e) => setSearchTermBank(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1 custom-scrollbar">
                      {filteredBanks.length > 0 ? (
                        filteredBanks.map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => {
                              handleChange({ target: { name: "namaBank", value: bank } });
                              setIsOpenBank(false);
                              setSearchTermBank("");
                            }}
                            className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-violet-50/50 ${
                              formData.namaBank === bank ? "bg-violet-50 text-violet-700 font-semibold" : "text-gray-700"
                            }`}
                          >
                            {bank}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-xs font-medium text-gray-400">Bank tidak ditemukan</p>
                          <button
                            type="button"
                            onClick={() => {
                              handleChange({ target: { name: "namaBank", value: searchTermBank.toUpperCase() } });
                              setIsOpenBank(false);
                              setSearchTermBank("");
                            }}
                            className="mt-2 text-[10px] font-bold text-violet-600 hover:underline"
                          >
                            Gunakan "{searchTermBank}"
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
