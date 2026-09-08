import React from "react";
import { ArrowUp, ArrowDown, Edit, Trash2, Plus } from "lucide-react";
import Pagination from "@/components/Pagination";

export default function UserPegawaiList({
    loading, pegawaiList, currentList, paginatedData,
    sortOrder, toggleSort, startIndex, 
    currentPage, totalPages, setCurrentPage, itemsPerPage,
    setSelectedPegawai, setIsModalOpen, handleDelete
}) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-800 flex-1 flex flex-col min-h-[calc(100vh-180px)]">
            <div className="flex flex-col gap-3 mb-6 border-b border-gray-50 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">List Data Pegawai</h2>
                <button
                    onClick={() => {
                        setSelectedPegawai(null);
                        setIsModalOpen(true);
                    }}
                    className="relative group w-full justify-center overflow-hidden inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 bg-gradient-to-br from-blue-600/90 to-blue-700/90 backdrop-blur-lg border border-white/20 shadow-lg shadow-blue-500/30 text-white hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 active:shadow-inner sm:w-auto"
                >
                    {/* Water wave effect on hover */}
                    <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-white rounded-[38%] animate-wave" />
                    </div>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Plus size={18} className="relative z-10 transition-transform duration-500 group-hover:rotate-180" />
                    <span className="relative z-10">Tambah Pegawai Baru</span>
                    {/* Click Ripple effect */}
                    <span className="absolute inset-0 rounded-xl bg-white/30 scale-0 transition-transform duration-500 group-active:scale-[2.5] opacity-0 group-active:opacity-100 pointer-events-none" />
                </button>
            </div>

            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th 
                                className="px-4 py-3 border-b text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors group"
                                onClick={toggleSort}
                            >
                                <div className="flex items-center gap-1">
                                    No
                                    {sortOrder === "desc" ? <ArrowDown size={14} className="text-blue-500" /> : <ArrowUp size={14} className="text-blue-500" />}
                                </div>
                            </th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">NIP</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Nama</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Jabatan</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Pangkat</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Rekening</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-10 text-center text-gray-500 italic border-b">
                                    Memuat data pegawai...
                                </td>
                            </tr>
                        ) : pegawaiList.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-10 text-center text-gray-500 italic border-b">
                                    Belum ada data pegawai. Silahkan tambah data baru.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">
                                        {sortOrder === "desc" ? currentList.length - (startIndex + index) : startIndex + index + 1}
                                    </td>
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">{item.nip}</td>
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">{item.nama}</td>
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">{item.jabatan}</td>
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">{item.pangkat}</td>
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">{item.rek}</td>
                                    <td className="px-4 py-3 border-b text-sm text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedPegawai(item);
                                                    setIsModalOpen(true);
                                                }}
                                                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, "pegawai")}
                                                className="inline-flex items-center justify-center rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
                                                title="Hapus"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="space-y-3 md:hidden">
                {loading ? <div className="rounded-xl border border-slate-200 px-4 py-10 text-center text-sm italic text-slate-500">Memuat data pegawai...</div> : pegawaiList.length === 0 ? <div className="rounded-xl border border-slate-200 px-4 py-10 text-center text-sm italic text-slate-500">Belum ada data pegawai.</div> : paginatedData.map((item, index) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{item.nama || "-"}</p><p className="mt-1 text-xs text-slate-500">NIP: {item.nip || "-"}</p></div><span className="shrink-0 rounded-full bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">#{sortOrder === "desc" ? currentList.length - (startIndex + index) : startIndex + index + 1}</span></div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs"><div><dt className="text-slate-400">Jabatan</dt><dd className="truncate font-medium text-slate-700">{item.jabatan || "-"}</dd></div><div><dt className="text-slate-400">Pangkat</dt><dd className="truncate font-medium text-slate-700">{item.pangkat || "-"}</dd></div><div><dt className="text-slate-400">Rekening</dt><dd className="truncate font-medium text-slate-700">{item.rek || "-"}</dd></div></dl>
                        <div className="mt-4 flex gap-2 border-t border-slate-200 pt-3"><button onClick={() => { setSelectedPegawai(item); setIsModalOpen(true); }} className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700" title="Edit"><Edit size={15} className="mx-auto" /></button><button onClick={() => handleDelete(item.id, "pegawai")} className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700" title="Hapus"><Trash2 size={15} className="mx-auto" /></button></div>
                    </article>
                ))}
            </div>

            {/* Pagination Controls */}
            {!loading && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={currentList.length}
                    startIndex={startIndex}
                />
            )}
        </div>
    );
}
