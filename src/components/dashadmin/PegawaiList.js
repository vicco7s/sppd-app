import React from "react";
import { ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";
import Pagination from "@/components/Pagination";

export default function PegawaiList({
    loading, pegawaiList, currentList, paginatedData,
    sortOrder, toggleSort, startIndex, 
    currentPage, totalPages, setCurrentPage, itemsPerPage,
    setSelectedPegawai, setIsModalOpen, handleDelete
}) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-800 flex-1 flex flex-col min-h-[calc(100vh-180px)]">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                <h2 className="text-xl font-bold text-gray-900">List Data Pegawai</h2>
                <button
                    onClick={() => {
                        setSelectedPegawai(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition shadow-sm font-medium"
                >
                    <span className="text-lg">+</span> Tambah Pegawai Baru
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
