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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Tambah Kwitansi
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
                      onClick={() => generateKwitansiPDF(item)}
                      className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition"
                      type="button"
                      title="Cetak Kwitansi"
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition"
                      type="button"
                      title="Edit Kwitansi"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
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
