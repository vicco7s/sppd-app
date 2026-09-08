"use client";

import React, { useState } from "react";
import { Trash2, Plus, X, Pencil, Printer, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { generateKwitansiPDF } from "../lib/pdf/kwitansi/kwitansi";
import Pagination from "./Pagination";

export default function KwitansiTable({ items, loading, onDelete, onEdit, onToggleForm, showForm }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"
  const itemsPerPage = 10;

  // Sort items based on order
  const sortedItems = [...items].sort((a, b) => {
    // Assuming newest data has higher index or we use createdAt if available
    // But since items are passed as a list, we just reverse if needed
    // Default (items) is newest first (desc)
    return sortOrder === "desc" ? 0 : 0; // The actual data from parent is already sorted desc
  });

  // If sortOrder is "asc", we reverse the already desc-sorted items
  const displayItems = sortOrder === "asc" ? [...items].reverse() : items;

  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = displayItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    setCurrentPage(1);
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header Table */}
      <div className="flex flex-col gap-3 px-4 py-4 border-b bg-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h3 className="text-lg font-bold text-gray-800">Daftar Kwitansi</h3>
        <button
          onClick={onToggleForm}
          className="relative group w-full justify-center overflow-hidden inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 bg-gradient-to-br from-blue-600/90 to-blue-700/90 backdrop-blur-lg border border-white/20 shadow-lg shadow-blue-500/30 text-white hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 active:shadow-inner sm:w-auto"
        >
          {/* Water wave effect on hover */}
          <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-white rounded-[38%] animate-wave" />
          </div>
          
          {/* Liquid highlight highlight */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <Plus size={18} className="relative z-10 transition-transform duration-500 group-hover:rotate-180" />
          <span className="relative z-10">Tambah Kwitansi</span>
          
          {/* Click Ripple effect (via CSS active) */}
          <span className="absolute inset-0 rounded-xl bg-white/30 scale-0 transition-transform duration-500 group-active:scale-[2.5] opacity-0 group-active:opacity-100 pointer-events-none" />
        </button>
      </div>

      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-max text-left border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-4 py-3 border-b text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors group"
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
            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Nama Rekening Belanja</th>
            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Nama Rekening</th>
            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Nominal</th>
            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Tanggal</th>
            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="6" className="px-4 py-10 text-center text-gray-500 italic border-b">
                Memuat kwitansi...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-4 py-10 text-center text-gray-500 italic border-b">
                Belum ada kwitansi.
              </td>
            </tr>
          ) : (
            paginatedItems.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-b text-sm text-gray-700">
                  {sortOrder === "desc" 
                    ? items.length - (startIndex + index) 
                    : startIndex + index + 1
                  }
                </td>
                <td className="px-4 py-3 border-b text-sm text-gray-700">{item.namaRekeningBelanja || "-"}</td>
                <td className="px-4 py-3 border-b text-sm text-gray-700">{item.namaRekening || "-"}</td>
                <td className="px-4 py-3 border-b text-sm text-gray-700">{item.nominal?.toLocaleString?.() || item.nominal || "-"}</td>
                <td className="px-4 py-3 border-b text-sm text-gray-700">{item.tanggal || "-"}</td>
                <td className="px-4 py-3 border-b text-sm text-center">
                  <div className="flex items-center justify-center gap-2">
                    
                    <button
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition"
                      type="button"
                      title="Edit Kwitansi"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => generateKwitansiPDF(item)}
                      className="inline-flex items-center justify-center rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition"
                      type="button"
                      title="Cetak Kwitansi"
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="inline-flex items-center justify-center rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
                      type="button"
                      title="Hapus Kwitansi"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {loading ? <div className="rounded-xl border border-slate-200 px-4 py-10 text-center text-sm italic text-slate-500">Memuat kwitansi...</div> : items.length === 0 ? <div className="rounded-xl border border-slate-200 px-4 py-10 text-center text-sm italic text-slate-500">Belum ada kwitansi.</div> : paginatedItems.map((item, index) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{item.namaRekeningBelanja || "-"}</p><p className="mt-1 truncate text-xs text-slate-500">{item.namaRekening || "-"}</p></div><span className="shrink-0 rounded-full bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">#{sortOrder === "desc" ? items.length - (startIndex + index) : startIndex + index + 1}</span></div><div className="mt-3 flex justify-between gap-3 text-xs"><span className="text-slate-400">Nominal</span><strong className="text-slate-700">{item.nominal?.toLocaleString?.() || item.nominal || "-"}</strong></div><div className="mt-1 flex justify-between gap-3 text-xs"><span className="text-slate-400">Tanggal</span><span className="text-slate-700">{item.tanggal || "-"}</span></div><div className="mt-4 flex gap-2 border-t border-slate-200 pt-3"><button onClick={() => onEdit(item)} className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-white" title="Edit Kwitansi"><Pencil size={15} className="mx-auto" /></button><button onClick={() => generateKwitansiPDF(item)} className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-white" title="Cetak Kwitansi"><Printer size={15} className="mx-auto" /></button><button onClick={() => onDelete(item.id)} className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-white" title="Hapus Kwitansi"><Trash2 size={15} className="mx-auto" /></button></div></article>
        ))}
      </div>
      {/* Pagination Controls */}
      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={displayItems.length}
          startIndex={startIndex}
        />
      )}
    </div>
  );
}
