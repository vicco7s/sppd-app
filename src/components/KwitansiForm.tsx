"use client";

import React, { useEffect, useState, useRef, type FormEvent } from "react";
import {
  Briefcase, User, CreditCard, DollarSign, Calendar, Info,
  ChevronRight, Plus, X, Landmark, PenBox, Search, Trash2,
  Sparkles, WandSparkles,
} from "lucide-react";
import type { Pegawai } from "@/types/index";
import {
  generateKeperluanSuggestions,
  fetchRecentKeperluan,
  perjadinKeperluan,
} from "@/lib/ai/generateKeperluan";

// ─── Types ──────────────────────────────────────────────────────────

interface KodeRekeningOption {
  id: string;
  kodeRekening?: string;
  namaRekeningBelanja?: string;
  nama?: string;
  name?: string;
  description?: string;
  program?: string;
  kegiatan?: string;
  subKegiatan?: string;
  namaProgram?: string;
  namaKegiatan?: string;
  namaSubKegiatan?: string;
  nameProgram?: string;
  nameKegiatan?: string;
  nameSubKegiatan?: string;
  createdAt?: unknown;
}

interface FormData {
  accountOptionId: string;
  program: string;
  kegiatan: string;
  subKegiatan: string;
  kodeRekening: string;
  namaRekeningBelanja: string;
  pegawaiId: string;
  namaRekening: string;
  nomorRekening: string;
  namaBank: string;
  nominal: string;
  tanggal: string;
  keperluan: string;
  ppn: number;
  pph22: boolean;
  pph23: boolean;
}

interface KwitansiFormProps {
  pegawaiList: Pegawai[];
  kodeRekeningOptions: KodeRekeningOption[];
  onSubmit: (data: Record<string, unknown>) => Promise<boolean>;
  isSubmitting: boolean;
  editingData: Record<string, unknown> | null;
  onCancel: () => void;
  isAdmin?: boolean;
  onDeleteAccountOption: (id: string) => void;
}

// ─── Constants ──────────────────────────────────────────────────────

const INITIAL_FORM_DATA: FormData = {
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
  keperluan: "",
  ppn: 0,
  pph22: false,
  pph23: false,
};

// ─── Helpers ────────────────────────────────────────────────────────

/** Safely read a string field from an object supporting multiple key aliases */
function pickString(
  obj: Record<string, unknown> | undefined | null,
  ...keys: string[]
): string {
  if (!obj) return "";
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  return "";
}

// ─── Component ──────────────────────────────────────────────────────

export default function KwitansiForm({
  pegawaiList,
  kodeRekeningOptions,
  onSubmit,
  isSubmitting,
  editingData = null,
  onCancel,
  isAdmin = false,
  onDeleteAccountOption,
}: KwitansiFormProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [customAccount, setCustomAccount] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermAccount, setSearchTermAccount] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenAccount, setIsOpenAccount] = useState(false);
  const [isGeneratingKeperluan, setIsGeneratingKeperluan] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRefAccount = useRef<HTMLDivElement>(null);

  // ── Close dropdown on outside click ──────────────────────────────

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (dropdownRefAccount.current && !dropdownRefAccount.current.contains(event.target as Node)) {
        setIsOpenAccount(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Derived data ─────────────────────────────────────────────────

  const filteredPegawai = pegawaiList.filter((pegawai) => {
    const q = searchTerm.toLowerCase();
    return (
      pegawai.nama?.toLowerCase().includes(q) ||
      pegawai.rek?.toLowerCase().includes(q)
    );
  });

  const filteredAccount = kodeRekeningOptions.filter((option) => {
    const q = searchTermAccount.toLowerCase();
    const kode = option.kodeRekening?.toLowerCase() || "";
    const nama = (option.namaRekeningBelanja || option.nama || option.name || "").toLowerCase();
    return kode.includes(q) || nama.includes(q);
  });

  const selectedPegawai = pegawaiList.find((p) => p.id === formData.pegawaiId);
  const selectedAccount = kodeRekeningOptions.find((o) => o.id === formData.accountOptionId);

  // ── Effects ──────────────────────────────────────────────────────

  useEffect(() => {
    if (editingData) {
      setFormData(editingData as unknown as FormData);
    } else {
      setFormData(INITIAL_FORM_DATA);
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
          namaBank: selected.bank || prev.namaBank,
        }));
      }
    }
  }, [formData.pegawaiId, pegawaiList]);

  useEffect(() => {
    if (isPerjadinAccount()) {
      setFormData((prev) => ({ ...prev, ppn: 0, pph22: false, pph23: false }));
    }
  }, [formData.kodeRekening, formData.namaRekeningBelanja]);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePegawaiChange = (value: string) => {
    setFormData((prev) => ({ ...prev, pegawaiId: value }));
  };

  const handleGenerateKeperluan = async () => {
    setIsGeneratingKeperluan(true);
    setAiSuggestions([]);
    try {
      const recentHistory = await fetchRecentKeperluan();
      const suggestions = await generateKeperluanSuggestions(formData, recentHistory);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error("AI Generate Error:", err);
      setAiSuggestions([perjadinKeperluan(formData)]);
    } finally {
      setIsGeneratingKeperluan(false);
    }
  };

  const handleAccountChange = (value: string) => {
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
      const s = selected as unknown as Record<string, unknown>;
      setFormData((prev) => ({
        ...prev,
        accountOptionId: selected.id,
        program: pickString(s, "program", "namaProgram", "nameProgram"),
        kegiatan: pickString(s, "kegiatan", "namaKegiatan", "nameKegiatan"),
        subKegiatan: pickString(s, "subKegiatan", "namaSubKegiatan", "nameSubKegiatan"),
        kodeRekening: pickString(s, "kodeRekening", "nama", "value"),
        namaRekeningBelanja: pickString(s, "namaRekeningBelanja", "nama", "description"),
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

  const isPerjadinAccount = (): boolean => {
    const name = formData.namaRekeningBelanja?.toLowerCase() || "";
    const code = formData.kodeRekening?.toLowerCase() || "";
    return name.includes("perjalanan dinas") || code.includes("5.1.02.04.01");
  };

  const internalSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await onSubmit(formData as unknown as Record<string, unknown>);
    if (success) {
      if (!editingData) setFormData(INITIAL_FORM_DATA);
      setCustomAccount(false);
    }
  };

  // ── Tax helpers ──────────────────────────────────────────────────

  const taxPPN = formData.ppn > 0 ? Number(formData.nominal) * formData.ppn / 100 : 0;
  const taxPPH22 = formData.pph22 ? Number(formData.nominal) * 0.015 : 0;
  const taxPPH23 = formData.pph23 ? Number(formData.nominal) * 0.02 : 0;
  const totalTax = taxPPN + taxPPH22 + taxPPH23;

  // ── Render helpers ───────────────────────────────────────────────

  const renderInput = (
    name: string,
    label: string,
    opts?: {
      type?: string;
      placeholder?: string;
      icon?: React.ReactNode;
      readOnly?: boolean;
      className?: string;
      required?: boolean;
    }
  ) => (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-gray-500 uppercase ml-1">{label}</span>
      <div className="relative group">
        {opts?.icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-violet-500 transition-colors">
            {opts.icon}
          </div>
        )}
        <input
          name={name}
          value={String(formData[name as keyof FormData] ?? "")}
          onChange={handleChange}
          type={opts?.type || "text"}
          placeholder={opts?.placeholder}
          readOnly={opts?.readOnly}
          required={opts?.required}
          className={
            opts?.className ||
            `w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 ${opts?.readOnly ? "bg-gray-50/30 cursor-default" : ""}`
          }
        />
      </div>
    </label>
  );

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <form onSubmit={internalSubmit} className="space-y-6">

        {/* ─── Section 1: Rekening Belanja ──────────────────────── */}
        <div className="space-y-3">
          <SectionHeader icon={<Briefcase className="text-blue-600" size={14} />} title="Rekening Belanja" />

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
                      accountOptionId: "", program: "", kegiatan: "",
                      subKegiatan: "", kodeRekening: "", namaRekeningBelanja: "",
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

            {/* Account Dropdown */}
            <SearchableDropdown
              ref={dropdownRefAccount}
              isOpen={isOpenAccount && !customAccount}
              setIsOpen={setIsOpenAccount}
              disabled={customAccount}
              searchTerm={searchTermAccount}
              setSearchTerm={setSearchTermAccount}
              placeholder="-- Pilih kode rekening belanja --"
              searchPlaceholder="Cari kode atau nama rekening..."
              selectedLabel={
                selectedAccount
                  ? selectedAccount.kodeRekening
                    ? `${selectedAccount.kodeRekening} - ${selectedAccount.namaRekeningBelanja || selectedAccount.nama || ""}`
                    : selectedAccount.nama || selectedAccount.namaRekeningBelanja || ""
                  : ""
              }
            >
              {filteredAccount.length > 0 ? (
                filteredAccount.map((option) => (
                  <div key={option.id} className="group/item flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleAccountChange(option.id);
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
                      onClick={(e) => { e.stopPropagation(); onDeleteAccountOption(option.id); }}
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
            </SearchableDropdown>

            {kodeRekeningOptions.length === 0 && !customAccount && (
              <div className="flex items-center gap-1.5 px-1 pt-1">
                <Info size={12} className="text-amber-500" />
                <p className="text-[10px] font-medium text-amber-600 italic">
                  Data referensi kosong. Silakan gunakan tombol &quot;Input Manual&quot; di atas.
                </p>
              </div>
            )}
          </div>

          {/* Custom Account Fields */}
          {customAccount && (
            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {renderInput("program", "Program", { placeholder: "Contoh: Program Dukungan Manajemen", className: "w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" })}
                {renderInput("kegiatan", "Kegiatan", { placeholder: "Masukkan kegiatan", className: "w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" })}
                {renderInput("subKegiatan", "Sub Kegiatan", { placeholder: "Masukkan sub kegiatan", className: "w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" })}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {renderInput("kodeRekening", "Kode Rekening", { placeholder: "Contoh: 5.1.02.04.01.0003", className: "w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" })}
                {renderInput("namaRekeningBelanja", "Nama Rekening Belanja", { placeholder: "Contoh: Belanja Perjalanan Dinas Paket Meeting Dalam Kota", className: "w-full rounded-xl border border-white bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Section 2: Informasi Penerima ─────────────────────── */}
        <div className="space-y-3 pt-1">
          <SectionHeader icon={<User className="text-indigo-600" size={14} />} title="Informasi Penerima" />

          {/* Pegawai Dropdown */}
          <label className="block space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Pilih Rekening Pegawai</span>
            <SearchableDropdown
              ref={dropdownRef}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="-- Pilih pegawai --"
              searchPlaceholder="Cari nama atau rekening..."
              selectedLabel={selectedPegawai
                ? `${selectedPegawai.nama} ${selectedPegawai.rek ? `(${selectedPegawai.rek})` : ""}`
                : ""}
              color="indigo"
            >
              {filteredPegawai.length > 0 ? (
                filteredPegawai.map((pegawai) => (
                  <button
                    key={pegawai.id}
                    type="button"
                    onClick={() => {
                      handlePegawaiChange(pegawai.id);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-indigo-50/50 ${
                      formData.pegawaiId === pegawai.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700"
                    }`}
                  >
                    <span className="text-sm font-semibold">{pegawai.nama}</span>
                    {pegawai.rek && (
                      <span className="text-[10px] text-gray-400">{String(pegawai.rek)} {pegawai.bank ? `• ${String(pegawai.bank)}` : ""}</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs font-medium text-gray-400">Pegawai tidak ditemukan</p>
                </div>
              )}
            </SearchableDropdown>
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderInput("namaRekening", "Nama di Rekening", {
              icon: <User size={14} />,
              placeholder: !formData.pegawaiId ? "Pilih pegawai..." : "",
              readOnly: true,
              className: "w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-all cursor-default",
            })}
            {renderInput("nomorRekening", "Nomor Rekening", {
              icon: <CreditCard size={14} />,
              placeholder: !formData.pegawaiId ? "Pilih pegawai..." : "",
              readOnly: true,
              className: "w-full rounded-xl border border-gray-200 bg-gray-50/30 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-all cursor-default",
            })}
          </div>
        </div>

        {/* ─── Section 3: Detail Transaksi ───────────────────────── */}
        <div className="space-y-3 pt-1">
          <SectionHeader icon={<DollarSign className="text-violet-600" size={14} />} title="Detail Transaksi" />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {renderInput("namaBank", "Nama Bank", {
              icon: <Landmark size={14} />,
              placeholder: "Terisi otomatis dari data pegawai",
            })}
            {renderInput("nominal", "Nominal (Rp)", {
              type: "number",
              icon: <span className="font-bold">Rp</span>,
              placeholder: "0",
              className: "w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 font-bold outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10",
            })}

            {/* Tax Section */}
            {Number(formData.nominal) >= 2000000 && (
              isPerjadinAccount() ? (
                <div className="col-span-full bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3 animate-in fade-in duration-300">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Info className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-0.5">Bebas Pajak</h4>
                    <p className="text-[10px] text-blue-700 leading-relaxed">
                      Akun <span className="font-bold underline">Perjalanan Dinas</span> tidak dikenakan potongan PPN/PPh
                    </p>
                  </div>
                </div>
              ) : (
                <div className="col-span-full bg-violet-50/50 rounded-2xl p-5 border border-violet-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 pb-2 border-b border-violet-100">
                    <div className="p-1 bg-violet-100 rounded-md">
                      <Sparkles className="text-violet-600" size={14} />
                    </div>
                    <h4 className="text-[11px] font-bold text-violet-900 uppercase tracking-widest">Potongan Pajak</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TaxToggle
                      label="PPN"
                      options={[
                        { value: 0, label: "Tanpa PPN" },
                        { value: 11, label: "11%" },
                        { value: 12, label: "12%" },
                      ]}
                      selected={formData.ppn}
                      onSelect={(val) => setFormData((prev) => ({ ...prev, ppn: val }))}
                    />
                    <TaxCheckbox
                      label="PPH 22"
                      active={formData.pph22}
                      onToggle={() => setFormData((prev) => ({ ...prev, pph22: !prev.pph22 }))}
                      rate="1.5%"
                    />
                    <TaxCheckbox
                      label="PPH 23"
                      active={formData.pph23}
                      onToggle={() => setFormData((prev) => ({ ...prev, pph23: !prev.pph23 }))}
                      rate="2%"
                    />
                  </div>

                  <TaxSummary nominal={Number(formData.nominal)} ppn={taxPPN} pph22={taxPPH22} pph23={taxPPH23} total={totalTax} />
                </div>
              )
            )}

            {renderInput("tanggal", "Tanggal Kwitansi", {
              type: "date",
              icon: <Calendar size={14} />,
              className: "w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10",
            })}
          </div>

          {/* ─── Keperluan ────────────────────────────────────────── */}
          <div className="grid grid-cols-1">
            <label className="block space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Keperluan / Perihal</span>
                <button
                  type="button"
                  onClick={handleGenerateKeperluan}
                  disabled={isGeneratingKeperluan}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border bg-white text-violet-600 border-violet-200 hover:border-violet-400 hover:bg-violet-50 disabled:opacity-50"
                >
                  {isGeneratingKeperluan ? (
                    <>
                      <span className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <WandSparkles size={12} />
                      Buat dengan AI
                    </>
                  )}
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-violet-500 transition-colors">
                  <PenBox size={14} />
                </div>
                <textarea
                  name="keperluan"
                  value={formData.keperluan}
                  onChange={handleChange}
                  placeholder='Ketik manual atau klik "Buat dengan AI" untuk generate otomatis'
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 group-hover:border-gray-300 resize-none"
                />
              </div>
            </label>

            {aiSuggestions.length > 0 && (
              <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <span className="text-[10px] font-bold text-violet-500 uppercase ml-1">Pilih saran AI:</span>
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, keperluan: suggestion }));
                      setAiSuggestions([]);
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2 text-xs transition-all border ${
                      formData.keperluan === suggestion
                        ? "bg-violet-100 border-violet-300 text-violet-800"
                        : "bg-violet-50/50 border-violet-100 text-gray-700 hover:bg-violet-100 hover:border-violet-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={12} className="text-violet-500 shrink-0" />
                      <span>{suggestion}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Submit Actions ────────────────────────────────────── */}
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
              onClick={() => setFormData(INITIAL_FORM_DATA)}
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

// ─── Sub-components ─────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100">
      <div className="p-1 bg-blue-50 rounded-md">{icon}</div>
      <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
    </div>
  );
}

// ─── Searchable Dropdown ─────────────────────────────────────────────

interface DropdownProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  disabled?: boolean;
  searchTerm?: string;
  setSearchTerm?: (v: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  selectedLabel: string;
  color?: "blue" | "indigo";
  children: React.ReactNode;
}

const SearchableDropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ isOpen, setIsOpen, disabled, searchTerm, setSearchTerm, placeholder, searchPlaceholder, selectedLabel, color = "blue", children }, ref) => {
    const focusColor = color === "indigo" ? "indigo" : "blue";

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-${focusColor}-500 focus:ring-4 focus:ring-${focusColor}-500/5 hover:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400`}
        >
          <span className={`truncate mr-2 ${!selectedLabel ? "text-gray-400" : ""}`}>
            {selectedLabel || placeholder}
          </span>
          <ChevronRight size={16} className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "-rotate-90" : "rotate-90"}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {setSearchTerm && (
              <div className="sticky top-0 border-b border-gray-50 bg-gray-50/50 p-2 backdrop-blur-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder || "Cari..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-${focusColor}-500 focus:ring-4 focus:ring-${focusColor}-500/5`}
                    autoFocus
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }
);
SearchableDropdown.displayName = "SearchableDropdown";

// ─── Tax Toggle ─────────────────────────────────────────────────────

function TaxToggle({ label, options, selected, onSelect }: {
  label: string;
  options: { value: number; label: string }[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-gray-500 uppercase">Pajak {label}</span>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              selected === opt.value
                ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20"
                : "bg-white text-gray-500 border-gray-200 hover:border-violet-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tax Checkbox ───────────────────────────────────────────────────

function TaxCheckbox({ label, active, onToggle, rate }: {
  label: string;
  active: boolean;
  onToggle: () => void;
  rate: string;
}) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-gray-500 uppercase">Pajak {label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-2 ${
          active
            ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20"
            : "bg-white text-gray-500 border-gray-200 hover:border-violet-400"
        }`}
      >
        {active ? `${label} (${rate}) Aktif` : `Aktifkan ${label} (${rate})`}
      </button>
    </div>
  );
}

// ─── Tax Summary ────────────────────────────────────────────────────

function TaxSummary({ nominal, ppn, pph22, pph23, total }: {
  nominal: number;
  ppn: number;
  pph22: number;
  pph23: number;
  total: number;
}) {
  const fmt = (v: number) => `Rp ${v.toLocaleString("id-ID")}`;
  return (
    <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 border-t border-violet-100">
      {ppn > 0 && <div className="text-[10px] text-gray-600">PPN: <span className="font-bold text-violet-700">{fmt(ppn)}</span></div>}
      {pph22 > 0 && <div className="text-[10px] text-gray-600">PPH 22 (1.5%): <span className="font-bold text-violet-700">{fmt(pph22)}</span></div>}
      {pph23 > 0 && <div className="text-[10px] text-gray-600">PPH 23 (2%): <span className="font-bold text-violet-700">{fmt(pph23)}</span></div>}
      <div className="text-[10px] text-gray-900 ml-auto">
        Total Potongan: <span className="font-bold text-red-600">{fmt(total)}</span>
      </div>
    </div>
  );
}
