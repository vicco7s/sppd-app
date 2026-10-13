"use client";

import React, { useState } from "react";
import { ArrowUp, ArrowDown, Edit, Trash2, Printer, Users, BedDouble } from "lucide-react";
import Pagination from "@/components/Pagination";
import { PerjadinLuarDoc } from "@/types/perjadinLuar";
import { generatePerjadinLuarPDF } from "@/lib/pdf/perjadinluar";
import toast from "react-hot-toast";

interface Props {
  loading: boolean;
  perjadinList: PerjadinLuarDoc[];
  router: any;
  handleDelete: (id: string) => Promise<void>;
  handleStatusChange: (id: string, status: string) => Promise<void>;
}

export default function PerjadinLuarList({
  loading,
  perjadinList,
  router,
  handleDelete,
  handleStatusChange,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 10;

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortedList = [...perjadinList].sort((a, b) => {
    const aNo = a.no || 0;
    const bNo = b.no || 0;
    return sortOrder === "desc" ? bNo - aNo : aNo - bNo;
  });

  const totalPages = Math.ceil(sortedList.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedList.slice(startIndex, startIndex + itemsPerPage);

  const handlePrint = async (item: PerjadinLuarDoc) => {
    try {
      toast.loading("Menyiapkan dokumen PDF...", { id: "print-pdf" });
      await generatePerjadinLuarPDF(item);
      toast.dismiss("print-pdf");
      toast.success("Dokumen PDF berhasil dibuka!");
    } catch (e: any) {
      toast.dismiss("print-pdf");
      toast.error("Gagal men-generate PDF: " + (e?.message || ""));
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-slate-800 flex-1 flex flex-col min-h-[calc(100vh-180px)]">
      <div className="flex flex-col gap-3 mb-6 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            List Data Perjadin Luar Dalam Provinsi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Format resmi SPT, SPPD, Laporan, Rincian Biaya & Tanda Terima, Daftar Riil, dan Pernyataan Tidak Menginap.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashbord/dashuser/perjadin-luar/create")}
          className="w-full justify-center bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-sm font-medium text-xs sm:w-auto"
        >
          <span className="text-base font-bold">+</span> Tambah Perjadin Luar Baru
        </button>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th
                className="px-4 py-3 border-b font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={toggleSort}
              >
                <div className="flex items-center gap-1">
                  No
                  {sortOrder === "desc" ? (
                    <ArrowDown size={14} className="text-blue-500" />
                  ) : (
                    <ArrowUp size={14} className="text-blue-500" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 border-b font-semibold text-slate-600">No SPT / SPPD</th>
              <th className="px-4 py-3 border-b font-semibold text-slate-600">Tujuan</th>
              <th className="px-4 py-3 border-b font-semibold text-slate-600">Jadwal Pelaksanaan</th>
              <th className="px-4 py-3 border-b font-semibold text-slate-600">Pelaksana</th>
              <th className="px-4 py-3 border-b font-semibold text-slate-600">Penginapan</th>
              <th className="px-4 py-3 border-b font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 border-b font-semibold text-slate-600 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400 italic border-b">
                  Memuat data Perjadin Luar...
                </td>
              </tr>
            ) : perjadinList.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400 italic border-b">
                  Belum ada data perjadin luar provinsi. Silakan buat pengajuan baru.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const pelaksanaCount = item.pelaksanaList?.length || 1;
                const namaUtama = item.pelaksanaList?.[0]?.nama || "-";

                return (
                  <tr key={item.id || index} className="hover:bg-slate-50 transition-colors border-b">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {sortOrder === "desc" ? sortedList.length - (startIndex + index) : startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{item.noSpt}</div>
                      <div className="text-[11px] text-slate-500">{item.noSpd}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{item.tempatTujuan}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.perihalSurat}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{item.tanggalBerangkat}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.lamaHari} Hari ({item.lamaMalam} Malam)
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{namaUtama}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Users size={12} /> {pelaksanaCount} Pelaksana
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.tanpaPenginapan ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                          <BedDouble size={11} /> 30% (Tanpa Hotel)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                          Hotel Berbayar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status || "Menunggu"}
                        onChange={(e) => handleStatusChange(item.id!, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium focus:outline-none cursor-pointer border-none transition-colors ${
                          item.status === "Selesai"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Ditolak"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <option value="Menunggu">Menunggu</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Ditolak">Ditolak</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrint(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Cetak Lengkap PDF"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => router.push(`/dashbord/dashuser/perjadin-luar/edit/${item.id}`)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edit Perjadin"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={sortedList.length}
          startIndex={startIndex}
        />
      </div>
    </div>
  );
}
