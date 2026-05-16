import React from "react";
import { ArrowUp, ArrowDown, Edit, Trash2, Printer, Plus, FileText } from "lucide-react";
import Pagination from "@/components/Pagination";

export default function UserPerjadinKotaList({
    loading, perjadinList, currentList, paginatedData,
    sortOrder, toggleSort, startIndex, 
    currentPage, totalPages, setCurrentPage, itemsPerPage,
    handleViewFile, router, setPrintModalItem, handleDelete
}) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-800 flex-1 flex flex-col min-h-[calc(100vh-180px)]">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                <h2 className="text-xl font-bold text-gray-900">List Data Perjadin Umum Dalam Kota</h2>
                <button
                    onClick={() => router.push("/dashbord/dashuser/Perjadin/create")}
                    className="relative group overflow-hidden inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 bg-gradient-to-br from-blue-600/90 to-blue-700/90 backdrop-blur-lg border border-white/20 shadow-lg shadow-blue-500/30 text-white hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 active:shadow-inner"
                >
                    {/* Water wave effect on hover */}
                    <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-white rounded-[38%] animate-wave" />
                    </div>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Plus size={18} className="relative z-10 transition-transform duration-500 group-hover:rotate-180" />
                    <span className="relative z-10">Tambah Perjadin Baru</span>
                    {/* Click Ripple effect */}
                    <span className="absolute inset-0 rounded-xl bg-white/30 scale-0 transition-transform duration-500 group-active:scale-[2.5] opacity-0 group-active:opacity-100 pointer-events-none" />
                </button>
            </div>

            <div className="overflow-x-auto">
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
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">No SPT</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Tujuan</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Tanggal</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Keperluan</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-10 text-center text-gray-500 italic border-b">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : perjadinList.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-10 text-center text-gray-500 italic border-b">
                                    Belum ada data perjadin. Silahkan tambah data baru.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">
                                        {sortOrder === "desc" ? currentList.length - (startIndex + index) : startIndex + index + 1}
                                    </td>
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">{item.noSpt}</td>
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">{item.tujuan}</td>
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">{item.tanggalBerangkat}</td>
                                    <td className="px-4 py-3 border-b text-sm text-gray-700">{item.perihalSurat}</td>
                                    <td className="px-4 py-3 border-b text-sm">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.status === 'Selesai'
                                            ? 'bg-green-100 text-green-800'
                                            : item.status === 'Ditolak'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {item.status || 'Menunggu'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 border-b text-sm text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {item.suratPath && (
                                                <button
                                                    onClick={() => handleViewFile(item.suratPath)}
                                                    className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                                                    title="Lihat Dokumen (Secure)"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                            )}
                                            {(!item.status || item.status === 'Menunggu') ? (
                                                <button
                                                    onClick={() => router.push(`/dashbord/dashuser/Perjadin/edit/${item.id}`)}
                                                    className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            ) : (
                                                <div className="text-gray-300 p-1 cursor-not-allowed" title="Data sudah diproses, tidak bisa diedit">
                                                    <Edit size={16} className="opacity-50" />
                                                </div>
                                            )}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPrintModalItem(item);
                                                    }}
                                                    className="inline-flex items-center justify-center rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition"
                                                    title="Print"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(item.id)}
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
