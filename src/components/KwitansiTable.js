"use client";

import React from "react";
import { Trash2, Plus, X, Pencil, Printer } from "lucide-react";
import { generateKwitansiPDF } from "../lib/pdf/kwitansi/kwitansi";

export default function KwitansiTable({ items, loading, onDelete, onEdit, onToggleForm, showForm }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header Table */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <h3 className="text-lg font-bold text-gray-800">Daftar Kwitansi</h3>
        <button
          onClick={onToggleForm}
          className="relative group overflow-hidden inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 bg-gradient-to-br from-blue-600/90 to-blue-700/90 backdrop-blur-lg border border-white/20 shadow-lg shadow-blue-500/30 text-white hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 active:shadow-inner"
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

      <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">No</th>
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
            items.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-b text-sm text-gray-700">{index + 1}</td>
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
    </div>
  );
}
