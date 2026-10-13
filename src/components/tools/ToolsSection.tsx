"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, Check, Landmark, MapPin, Plus, Printer, Trash2, Wrench, X } from "lucide-react";
import { generateVisumPDF, type VisumData, type VisumLeg } from "@/lib/pdf/visum";

const LOCATION_STORAGE_KEY = "sppd-visum-locations";
const DEFAULT_LOCATIONS = ["Salam Babaris", "Banjarmasin", "Rantau"];

const createInitialData = (): VisumData => ({
  asal: "Salam Babaris",
  tujuan: "",
  tanggalBerangkat: "",
  tanggalTiba: "",
  legs: [],
  tibaAkhir: "Salam Babaris",
  tanggalTibaAkhir: "",
  kepalaNama: "Kus Henratmo, S.Sos.",
  kepalaJabatan: "Penata Tingkat I (III/d)",
  kepalaNip: "19770413 201001 1 011",
});

export default function ToolsSection() {
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState<VisumData>(createInitialData);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [newLocation, setNewLocation] = useState("");
  const [error, setError] = useState("");

  const openVisumForm = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) {
        setLocations(Array.from(new Set([...DEFAULT_LOCATIONS, ...stored.filter((item): item is string => typeof item === "string")])));
      }
    } catch {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    }
    setShowForm(true);
  };

  const updateLeg = (index: number, key: keyof VisumLeg, value: string) => {
    setData((current) => ({
      ...current,
      legs: current.legs.map((leg, legIndex) => legIndex === index ? { ...leg, [key]: value } : leg),
    }));
  };

  const addLeg = () => {
    if (data.legs.length >= 3) return;
    setData((current) => ({
      ...current,
      legs: [...current.legs, { tibaDi: "", tanggalTiba: "", berangkatDari: "", ke: "", tanggalBerangkat: "" }],
    }));
  };

  const removeLeg = (index: number) => {
    setData((current) => ({ ...current, legs: current.legs.filter((_, legIndex) => legIndex !== index) }));
  };

  const addLocation = () => {
    const value = newLocation.trim();
    if (!value) return;
    const next = locations.some((item) => item.toLowerCase() === value.toLowerCase()) ? locations : [...locations, value];
    setLocations(next);
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(next));
    setNewLocation("");
  };

  const printVisum = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data.asal.trim() || !data.tujuan.trim() || !data.tanggalBerangkat || !data.tanggalTiba) {
      setError("Asal, tujuan, tanggal berangkat, dan tanggal tiba wajib diisi.");
      return;
    }
    setError("");
    generateVisumPDF(data);
  };

  const locationField = (label: string, value: string, onChange: (value: string) => void) => (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        list="visum-location-options"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Pilih atau ketik lokasi"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );

  const dateField = (label: string, value: string, onChange: (value: string) => void) => (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Tools</h1>
      </header>

      {!showForm && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={openVisumForm}
            className="group flex min-h-36 flex-col items-start justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Landmark size={20} /></span>
            <span>
              <span className="block text-base font-semibold text-slate-900">Create Visum</span>
              <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Printer size={13} /> Isi form dan print visum</span>
            </span>
          </button>
          <div className="flex min-h-36 flex-col items-start justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-left text-slate-400">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-500"><Wrench size={19} /></span>
            <span>
              <span className="block text-base font-semibold">Coming Soon</span>
              <span className="mt-1 block text-xs">Tools lainnya</span>
            </span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="visum-modal-title" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <header className="flex shrink-0 items-center justify-between bg-blue-600 px-5 py-4 text-white sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15"><Landmark size={20} /></span>
                <div>
                  <h2 id="visum-modal-title" className="text-lg font-bold">Create Visum</h2>
                  <p className="text-xs text-blue-100">Isi perjalanan lalu cetak lembar visum</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Tutup form visum" className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white"><X size={20} /></button>
            </header>

            <form onSubmit={printVisum} className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">

          <datalist id="visum-location-options">
            {locations.map((location) => <option key={location} value={location} />)}
          </datalist>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><MapPin size={15} className="text-indigo-600" /> Perjalanan</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {locationField("Asal berangkat", data.asal, (asal) => setData((current) => ({ ...current, asal })))}
              {locationField("Tujuan", data.tujuan, (tujuan) => setData((current) => ({ ...current, tujuan })))}
              {dateField("Tanggal berangkat", data.tanggalBerangkat, (tanggalBerangkat) => setData((current) => ({ ...current, tanggalBerangkat })))}
              {dateField("Tanggal tiba", data.tanggalTiba, (tanggalTiba) => setData((current) => ({ ...current, tanggalTiba })))}
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Persinggahan</h3>
                <p className="mt-1 text-xs text-slate-500">Opsional, untuk mengisi bagian III-V pada PDF.</p>
              </div>
              <button type="button" onClick={addLeg} disabled={data.legs.length >= 3} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-40">
                <Plus size={14} /> Tambah {data.legs.length < 3 ? "" : "(maks. 3)"}
              </button>
            </div>
            {data.legs.map((leg, index) => (
              <div key={index} className="space-y-3 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Bagian { ["III", "IV", "V"][index] }</span>
                  <button type="button" onClick={() => removeLeg(index)} aria-label={`Hapus persinggahan ${index + 1}`} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                {locationField("Tiba di", leg.tibaDi, (value) => updateLeg(index, "tibaDi", value))}
                {dateField("Tanggal tiba", leg.tanggalTiba, (value) => updateLeg(index, "tanggalTiba", value))}
                {locationField("Berangkat dari", leg.berangkatDari, (value) => updateLeg(index, "berangkatDari", value))}
                {locationField("Ke", leg.ke, (value) => updateLeg(index, "ke", value))}
                {dateField("Tanggal berangkat", leg.tanggalBerangkat, (value) => updateLeg(index, "tanggalBerangkat", value))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-end">
            <label className="block flex-1 space-y-1.5">
              <span className="text-xs font-semibold text-slate-600">Tambah lokasi ke dropdown</span>
              <input value={newLocation} onChange={(event) => setNewLocation(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLocation(); } }} placeholder="Nama kota atau tempat" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            </label>
            <button type="button" onClick={addLocation} disabled={!newLocation.trim()} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              <Plus size={15} /> Tambah lokasi
            </button>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <Printer size={16} /> Print Visum
            </button>
          </div>
          {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          {locations.length > DEFAULT_LOCATIONS.length && <p className="flex items-center gap-1 text-[11px] text-emerald-700"><Check size={12} /> Lokasi tambahan tersimpan di browser ini.</p>}
          <p className="flex items-center gap-1 text-[11px] text-slate-400"><CalendarDays size={12} /> PDF dicetak dalam format F4, satu halaman.</p>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}