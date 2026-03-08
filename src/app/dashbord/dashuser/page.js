"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, ChevronRight, LogOut, User, Edit, Trash2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/services/firebases";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, deleteDoc, doc, query, orderBy, getDoc, onSnapshot, limit, serverTimestamp, addDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { generateSPPD } from "@/lib/pdf/perjadinkota/page";
import { generateNotaDinas } from "@/lib/pdf/perjadinkota/nota";
import { useInactivityLogout, clearAuthCache } from "@/hooks/useInactivityLogout";
import Topbar from "@/components/Topbar";

export default function DashuserPage() {
  useInactivityLogout(1800000); // 30 minutes auto logout
  const [openPerjadin, setOpenPerjadin] = useState(false);
  const [openPerjadinLuar, setOpenPerjadinLuar] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // State to manage active content in main area
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [perjadinList, setPerjadinList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activePrintMenu, setActivePrintMenu] = useState(null);
  const printMenuRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Better security: verify if admin is trying to access user dash
        try {
          const userDoc = await getDoc(doc(db, "user", u.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            if (role === "admin") {
              router.replace("/dashbord/dashadmin");
            }
          }
        } catch (err) {
          console.error("Auth verify error:", err);
        }
      } else {
        router.replace("/login");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch Data Perjadin
  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === "perjadin-umum-dalam-kota") {
        setLoading(true);
        try {
          const q = query(collection(db, "perjadinkota"), orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPerjadinList(data);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Gagal mengambil data perjadin");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await deleteDoc(doc(db, "perjadinkota", id));
        setPerjadinList(prev => prev.filter(item => item.id !== id));
        toast.success("Data berhasil dihapus");
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Gagal menghapus data");
      }
    }
  };

  const handlePrint = async (item, type = 'spj') => {
    try {
      if (type === 'nota') {
        if (!item.dari && !item.isinota) {
          toast.error("Data 'Dari' atau 'Isi Nota' masih kosong. Pastikan sudah diisi di form!");
          return;
        }
        toast.loading("Generating Nota Dinas PDF...", { id: "nota-loading" });
        await generateNotaDinas(item);
        toast.dismiss("nota-loading");
        toast.success("Nota Dinas PDF berhasil dibuat!");
      } else {
        toast.loading("Generating SPPD PDF...", { id: "sppd-loading" });
        await generateSPPD(item);
        toast.dismiss("sppd-loading");
        toast.success("SPPD PDF berhasil dibuat!");
      }
      setActivePrintMenu(null);
    } catch (error) {
      toast.dismiss("sppd-loading");
      toast.dismiss("nota-loading");
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat PDF");
    }
  };


  {/* Fungsi Print Menu */ }

  useEffect(() => {
    function handleClickOutside(e) {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target)) {
        setActivePrintMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(perjadinList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = perjadinList.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow h-screen p-4 text-gray-800 flex flex-col">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full" />
          <div>
            <div className="font-bold text-gray-900">Dashboard</div>
            <div className="text-sm text-gray-500">User</div>
          </div>
        </div>

        <nav className="space-y-3 text-sm mb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-100 ${activeTab === 'overview' ? 'bg-gray-100 font-semibold' : 'text-gray-800'}`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab("perjadin-umum-dalam-kota")}
            className={`w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-100 ${activeTab === 'perjadin-umum-dalam-kota' ? 'bg-gray-100 font-semibold' : 'text-gray-800'}`}
          >
            Perjadin Dalam Kota
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenPerjadinLuar(!openPerjadinLuar)}
              aria-expanded={openPerjadinLuar}
              className="w-full text-left flex items-center justify-between gap-3 p-2 rounded hover:bg-gray-100 text-gray-900 focus:outline-none focus:ring-0"
            >
              <span>Perjadin Luar Kota</span>
              <span className="text-sm">{openPerjadinLuar ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
            </button>

            {openPerjadinLuar && (
              <ul className="mt-2 bg-white border border-transparent rounded shadow-sm">
                <li className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm focus:outline-none">Perjadin Luar Dalam Provinsi</li>
                <li className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm focus:outline-none">Perjadin Luar Antar Provinsi</li>
              </ul>
            )}
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 -mx-4 px-4">
          <a className="block w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-sm text-gray-700">Settings</a>
          <a className="block w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-sm text-gray-700">Help & Support</a>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar user={user} role="User" />

        {/* Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === "overview" && (
              <div className="col-span-1">
                <div className="p-9 bg-white rounded shadow h-20 flex items-center justify-center text-gray-800">
                  <p>Selamat Datang</p>
                </div>
              </div>
            )}

            {/* Content for "Perjadin Umum Dalam Kota" */}
            {activeTab === "perjadin-umum-dalam-kota" && (
              <div className="bg-white p-6 rounded shadow text-gray-800">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold text-gray-900">List Data Perjadin Umum Dalam Kota</h2>
                  <button
                    onClick={() => router.push("/dashbord/dashuser/Perjadin/create")}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition shadow-sm font-medium"
                  >
                    <span className="text-lg">+</span> Tambah Perjadin Baru
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">No</th>
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
                            <td className="px-4 py-3 border-b text-sm text-gray-700">{item.no}</td>
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
                                <button
                                  onClick={() => router.push(`/dashbord/dashuser/Perjadin/edit/${item.id}`)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActivePrintMenu(activePrintMenu === item.id ? null : item.id);
                                    }}
                                    className="text-green-600 hover:text-green-800 p-1 transition-colors"
                                    title="Print"
                                  >
                                    <Printer size={16} />
                                  </button>

                                  {activePrintMenu === item.id && (
                                    <div
                                      ref={printMenuRef}
                                      className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
                                    >
                                      <div className="p-2 space-y-1 bg-white">
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                                          Opsi Cetak
                                        </div>
                                        {/* Hanya muncul jika data NOTA ada */}
                                        {(item.isinota || item.dari) && (
                                          <button
                                            onClick={() => handlePrint(item, 'nota')}
                                            className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all flex items-center gap-3 group"
                                          >
                                            <div className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-110 transition-transform" />
                                            <span>Print Nota Dinas</span>
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handlePrint(item, 'spj')}
                                          className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all flex items-center gap-3 group"
                                        >
                                          <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-110 transition-transform" />
                                          <span>Print SPJ Perjadin</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
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
                {perjadinList.length > itemsPerPage && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded text-sm font-medium ${currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
