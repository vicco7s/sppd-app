"use client";

import React, { useState, useRef, useEffect } from "react";
import { useFieldArray, useWatch, Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Plus, UserCheck, Search, ChevronDown, Trash2, Copy } from "lucide-react";
import { Pegawai } from "@/types";
import { PerjadinLuarFormData } from "@/lib/validations/perjadinLuarSchema";
import { tarifTransport, kelipatanTransport, buildUangHarian, PENGINAPAN_STANDAR, PERSEN_TANPA_MENGINAP } from "@/lib/perjadinLuar/tarifPerbub";

interface TransportBiaya {
  volume?: string;
  tarif?: number;
  total?: number;
  keterangan?: string;
}

interface UangHarianItem {
  uraian?: string;
  hari?: number;
  tarif?: number;
  total?: number;
}

interface PenginapanBiaya {
  malam?: number;
  tarifStandar?: number;
  isTanpaPenginapan?: boolean;
  persen?: number;
  total?: number;
  keterangan?: string;
}

interface BiayaLainItem {
  uraian?: string;
  volume?: string;
  tarif?: number;
  total?: number;
  keterangan?: string;
}

interface PelaksanaRow {
  idPegawai?: string | number;
  nama?: string;
  nip?: string;
  pangkat?: string;
  jabatan?: string;
  tanggalLahir?: string;
  noRekening?: string;
  transport?: TransportBiaya;
  uangHarian?: UangHarianItem[];
  penginapan?: PenginapanBiaya;
  biayaLain?: BiayaLainItem[];
  totalBiaya?: number;
}

interface Props {
  control: Control<PerjadinLuarFormData>;
  watch: UseFormWatch<PerjadinLuarFormData>;
  setValue: UseFormSetValue<PerjadinLuarFormData>;
  pegawaiList: Pegawai[];
  tanpaPenginapan: boolean;
  pulangPergi: boolean;
}


export default function PelaksanaFieldArray({
  control,
  watch,
  setValue,
  pegawaiList,
  tanpaPenginapan,
  pulangPergi,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "pelaksanaList",
  });

  // useWatch memicu re-render saat nilai berubah (watch() biasa tidak reaktif bila dipakai sebagai dependency)
  const pelaksanaList = (useWatch({ control, name: "pelaksanaList" }) || []) as any[];

  const rp = (n?: number) => "Rp " + new Intl.NumberFormat("id-ID").format(Number(n) || 0);

  const copyMainCostsToFollowers = () => {
    const main = pelaksanaList[0];
    if (!main) return;

    pelaksanaList.slice(1).forEach((_, offset) => {
      const index = offset + 1;
      setValue(`pelaksanaList.${index}.transport`, structuredClone(main.transport), { shouldDirty: true });
      setValue(`pelaksanaList.${index}.uangHarian`, structuredClone(main.uangHarian), { shouldDirty: true });
      setValue(`pelaksanaList.${index}.penginapan`, structuredClone(main.penginapan), { shouldDirty: true });
      setValue(`pelaksanaList.${index}.biayaLain`, structuredClone(main.biayaLain || []), { shouldDirty: true });
    });
  };

  const addUh = (index: number) => {
    const list = watch(`pelaksanaList.${index}.uangHarian`) || [];
    setValue(`pelaksanaList.${index}.uangHarian` as any, [...list, { uraian: "Uang Harian", hari: 1, tarif: 0, total: 0 }] as any, { shouldDirty: true });
  };
  const removeUh = (index: number, i: number) => {
    const list = watch(`pelaksanaList.${index}.uangHarian`) || [];
    setValue(`pelaksanaList.${index}.uangHarian` as any, list.filter((_, idx) => idx !== i) as any, { shouldDirty: true });
  };
  const addBl = (index: number) => {
    const list = watch(`pelaksanaList.${index}.biayaLain`) || [];
    setValue(`pelaksanaList.${index}.biayaLain` as any, [...list, { uraian: "Biaya Lain", volume: "1 Kali", tarif: 0, total: 0, keterangan: "-" }] as any, { shouldDirty: true });
  };
  const removeBl = (index: number, i: number) => {
    const list = watch(`pelaksanaList.${index}.biayaLain`) || [];
    setValue(`pelaksanaList.${index}.biayaLain` as any, list.filter((_, idx) => idx !== i) as any, { shouldDirty: true });
  };

  // Auto-hitung sub-total & total biaya per pelaksana
  useEffect(() => {
    const list = pelaksanaList || [];
    list.forEach((row, index) => {
      const t = row?.transport || ({} as any);
      const tTotal = (Number(t.tarif) || 0) * kelipatanTransport(pulangPergi); // PP x2, sekali jalan x1
      if ((t.total || 0) !== tTotal) setValue(`pelaksanaList.${index}.transport.total` as any, tTotal);

      const uh = row?.uangHarian || [];
      const uhNew = uh.map((u: any) => ({ ...u, total: (Number(u.hari) || 0) * (Number(u.tarif) || 0) }));
      const uhChanged = uhNew.some((u: any, i: number) => (u.total || 0) !== (uh[i]?.total || 0));
      if (uhChanged) setValue(`pelaksanaList.${index}.uangHarian` as any, uhNew as any);

      const p = row?.penginapan || ({} as any);
      const persen = Number(p.persen) || 0;
      const pTotal = Math.round((Number(p.tarifStandar) || 0) * (persen / 100) * (Number(p.malam) || 0));
      if ((p.total || 0) !== pTotal) setValue(`pelaksanaList.${index}.penginapan.total` as any, pTotal);

      const bl = row?.biayaLain || [];
      const blNew = bl.map((b: any) => ({ ...b, total: Number(b.tarif) || 0 }));
      const blChanged = blNew.some((b: any, i: number) => (b.total || 0) !== (bl[i]?.total || 0));
      if (blChanged) setValue(`pelaksanaList.${index}.biayaLain` as any, blNew as any);

      const grand =
        tTotal +
        uhNew.reduce((a: number, c: any) => a + (Number(c.total) || 0), 0) +
        pTotal +
        blNew.reduce((a: number, c: any) => a + (Number(c.total) || 0), 0);
      if (grand !== (row?.totalBiaya || 0)) setValue(`pelaksanaList.${index}.totalBiaya` as any, grand);
    });
  }, [pelaksanaList, pulangPergi, setValue]);


  // Add via searchable dropdown (like PersonilSection dalam kota)
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setIsPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addedIds = fields.map((f: any) => f.idPegawai).filter(Boolean);
  const filteredForPicker = pegawaiList.filter((p) => {
    if (addedIds.includes(p.id)) return false;
    const q = pickerSearch.toLowerCase();
    return (p.nama || "").toLowerCase().includes(q) || (p.nip || "").toLowerCase().includes(q);
  });

  const handleAddFromDropdown = (peg: Pegawai) => {
    let tglLahirStr = "-";
    if (peg.tgllahir) {
      if (typeof peg.tgllahir === "string") tglLahirStr = peg.tgllahir;
      else if ((peg.tgllahir as any).toDate) tglLahirStr = (peg.tgllahir as any).toDate().toISOString().split("T")[0];
      else if (peg.tgllahir instanceof Date) tglLahirStr = peg.tgllahir.toISOString().split("T")[0];
    }
    append({
      idPegawai: peg.id,
      nama: peg.nama || "",
      nip: peg.nip || "-",
      pangkat: peg.pangkat || "-",
      jabatan: peg.jabatan || "-",
      tanggalLahir: tglLahirStr,
      noRekening: peg.rek || "-",
      transport: { volume: `${kelipatanTransport(pulangPergi)} Kali`, tarif: tarifTransport(watch("kotaTujuan")), total: tarifTransport(watch("kotaTujuan")) * kelipatanTransport(pulangPergi), keterangan: "Transport Berangkat Ke" },
      uangHarian: buildUangHarian(Number(watch("lamaHari")) || 1),
      penginapan: {
        malam: Number(watch("lamaMalam")) || 0,
        tarifStandar: PENGINAPAN_STANDAR,
        isTanpaPenginapan: tanpaPenginapan,
        persen: PERSEN_TANPA_MENGINAP,
        total: 0,
        keterangan: tanpaPenginapan ? "Tanpa Menginap Di Hotel Berbayar" : "Hotel Berbayar",
      },
      biayaLain: [],
      totalBiaya: 0,
    });
    setIsPickerOpen(false);
    setPickerSearch("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <UserCheck size={18} className="text-blue-600" />
            Personil Pelaksana
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Pilih Pegawai Utama dan Pengikut dari master data</p>
        </div>
        <div className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full uppercase tracking-wider">
          Total: {fields.length} Orang
        </div>
      </div>

      {fields.length > 1 && (
        <button
          type="button"
          onClick={copyMainCostsToFollowers}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
        >
          <Copy size={14} /> Samakan Rincian Biaya dengan Pegawai Utama
        </button>
      )}

      {/* Dropdown picker — like PersonilSection */}
      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setIsPickerOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border-2 border-blue-100 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:border-blue-200 transition"
        >
          <span className="flex items-center gap-2 text-slate-400">
            <Plus size={15} className="text-blue-500" /> Tambah Pegawai ke Daftar...
          </span>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isPickerOpen ? "rotate-180" : ""}`} />
        </button>

        {isPickerOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-2xl border border-blue-100 bg-white shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-slate-100 bg-blue-50/50">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Cari nama atau NIP..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto p-1">
              {filteredForPicker.length > 0 ? (
                filteredForPicker.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddFromDropdown(p)}
                    className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-xs hover:bg-blue-50/70 transition"
                  >
                    <span className="font-semibold text-slate-800">{p.nama}</span>
                    <span className="text-[10px] text-slate-400">{p.jabatan || "-"}{p.nip ? ` · NIP: ${p.nip}` : ""}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-xs text-slate-400">
                  {addedIds.length === pegawaiList.length ? "Semua pegawai sudah ditambahkan" : "Pegawai tidak ditemukan"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {fields.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <p className="text-sm text-slate-400">Belum ada personil yang ditambahkan.</p>
            <p className="text-[10px] text-slate-300 mt-1">Gunakan dropdown di atas untuk memilih pegawai.</p>
          </div>
        )}

        {fields.map((field, index) => {
          const row = pelaksanaList[index];
          // Nilai total dihitung langsung dari input (realtime), efek hanya menyimpan ke form
          const tTotal = (Number(row?.transport?.tarif) || 0) * kelipatanTransport(pulangPergi);
          const uhList = (row?.uangHarian || []).map((u: UangHarianItem) => ({
            ...u,
            total: (Number(u.hari) || 0) * (Number(u.tarif) || 0),
          }));
          const pPersen = Number(row?.penginapan?.persen) || 0;
          const pTotal = Math.round((Number(row?.penginapan?.tarifStandar) || 0) * (pPersen / 100) * (Number(row?.penginapan?.malam) || 0));
          const biayaLainList = (row?.biayaLain || []).map((b: BiayaLainItem) => ({
            ...b,
            total: Number(b.tarif) || 0,
          }));
          const currentTotal =
            tTotal +
            uhList.reduce((a: number, c: UangHarianItem & { total?: number }) => a + (Number(c.total) || 0), 0) +
            pTotal +
            biayaLainList.reduce((a: number, c: BiayaLainItem & { total?: number }) => a + (Number(c.total) || 0), 0);
          const isUtama = index === 0;
          return (
            <div
              key={field.id}
              className={`rounded-xl border-2 p-4 relative transition ${isUtama ? "border-blue-200 bg-white ring-4 ring-blue-500/5" : "border-slate-200 bg-slate-50/60"}`}
            >
              {/* Badge Utama / Pengikut */}
              <div className="absolute -top-3 left-4">
                {isUtama ? (
                  <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm uppercase tracking-tight">
                    ✦ Pegawai Utama (Pelaksana)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-slate-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-tight">
                    Pengikut #{index}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end mb-3">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 uppercase transition"
                >
                  Hapus
                </button>
              </div>

              {/* Editable fields — customizable jika data tidak sesuai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    {...control.register(`pelaksanaList.${index}.nama`)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                    placeholder="Nama Lengkap"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Pangkat / Golongan</label>
                  <input
                    type="text"
                    {...control.register(`pelaksanaList.${index}.pangkat`)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                    placeholder="Penata Muda / IIIa"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Jabatan</label>
                  <input
                    type="text"
                    {...control.register(`pelaksanaList.${index}.jabatan`)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                    placeholder="Staf Pelaksana"
                  />
                </div>
              </div>

              {/* Rincian Biaya Perjalanan Dinas — dapat dikustom / auto sesuai Perbub */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Rincian Biaya</span>
                  <span className="text-[10px] text-slate-400">Ubah manual bila tidak sesuai Perbub</span>
                </div>

                {/* Transport */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-medium text-slate-600 mb-1 text-xs">Biaya Transport</label>
                    <input type="text" {...control.register(`pelaksanaList.${index}.transport.volume`)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="2 Kali" />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1 text-xs">Tarif (Rp)</label>
                    <input type="number" {...control.register(`pelaksanaList.${index}.transport.tarif`)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1 text-xs">Total (Rp)</label>
                    <input type="text" readOnly value={rp(tTotal)} className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs text-slate-600" />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1 text-xs">Keterangan</label>
                    <input type="text" {...control.register(`pelaksanaList.${index}.transport.keterangan`)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="PP ..." />
                  </div>
                </div>

                {/* Uang Harian */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">Uang Harian</span>
                    <button type="button" onClick={() => addUh(index)} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase">
                      <Plus size={12} /> Tambah
                    </button>
                  </div>
                  {uhList.map((u: UangHarianItem, i: number) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input type="text" {...control.register(`pelaksanaList.${index}.uangHarian.${i}.uraian`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="Uang Harian" />
                      <input type="number" {...control.register(`pelaksanaList.${index}.uangHarian.${i}.hari`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="Hari" />
                      <input type="number" {...control.register(`pelaksanaList.${index}.uangHarian.${i}.tarif`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="Tarif" />
                      <div className="flex items-center gap-1">
                        <input type="text" readOnly value={rp(u?.total)} className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs text-slate-600" />
                        <button type="button" onClick={() => removeUh(index, i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Penginapan */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1 text-xs">Penginapan (Malam)</label>
                    <input type="number" {...control.register(`pelaksanaList.${index}.penginapan.malam`)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1 text-xs">Tarif Standar (Rp)</label>
                    <input type="number" {...control.register(`pelaksanaList.${index}.penginapan.tarifStandar`)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1 text-xs">Persen (%)</label>
                    <input type="number" {...control.register(`pelaksanaList.${index}.penginapan.persen`)} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1 text-xs">Total (Rp)</label>
                    <input type="text" readOnly value={rp(pTotal)} className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs text-slate-600" />
                  </div>
                </div>

                {/* Jenis biaya lain (manual) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">Jenis Biaya Lain (isi manual)</span>
                    <button type="button" onClick={() => addBl(index)} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase">
                      <Plus size={12} /> Tambah
                    </button>
                  </div>
                  {biayaLainList.map((b: BiayaLainItem, i: number) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <input type="text" {...control.register(`pelaksanaList.${index}.biayaLain.${i}.uraian`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="Uraian biaya" />
                      <input type="text" {...control.register(`pelaksanaList.${index}.biayaLain.${i}.volume`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="Volume" />
                      <input type="number" {...control.register(`pelaksanaList.${index}.biayaLain.${i}.tarif`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="Tarif" />
                      <div className="flex items-center gap-1">
                        <input type="text" readOnly value={rp(b?.total)} className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs text-slate-600" />
                        <button type="button" onClick={() => removeBl(index, i)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                      <input type="text" {...control.register(`pelaksanaList.${index}.biayaLain.${i}.keterangan`)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" placeholder="Keterangan" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ringkasan biaya */}
              <div className="mt-3 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>Transport: <strong>{rp(tTotal)}</strong></span>
                  {tanpaPenginapan && (
                    <span>Penginapan: <strong>{rp(pTotal)} (30%)</strong></span>
                  )}
                </div>
                <span className="font-bold text-blue-700">
                  Total: {rp(currentTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
