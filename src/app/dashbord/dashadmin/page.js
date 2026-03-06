"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, ChevronRight, LogOut, User, Edit, Trash2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/services/firebases";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, deleteDoc, doc, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { generateSPPD } from "@/lib/pdf/perjadinkota/page";
import PegawaiModal from "@/components/PegawaiModal";
import { updateDoc } from "firebase/firestore";

export default function DashuserPage() {
    const [openPerjadin, setOpenPerjadin] = useState(false);
    const [openPerjadinLuar, setOpenPerjadinLuar] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [activeTab, setActiveTab] = useState("overview"); // State to manage active content in main area
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [perjadinList, setPerjadinList] = useState([]);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Modal State for Pegawai
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPegawai, setSelectedPegawai] = useState(null); // null means "Add", object means "Edit"

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribeAuth();
    }, []);

    // Fetch Data (Perjadin or Pegawai)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === "perjadin-umum-dalam-kota") {
                    const q = query(collection(db, "perjadinkota"), orderBy("createdAt", "desc"));
                    const querySnapshot = await getDocs(q);
                    const data = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setPerjadinList(data);
                } else if (activeTab === "pegawai") {
                    const q = query(collection(db, "pegawai"), orderBy("nama", "asc"));
                    const querySnapshot = await getDocs(q);
                    const data = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setPegawaiList(data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error(`Gagal mengambil data ${activeTab === 'pegawai' ? 'pegawai' : 'perjadin'}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    const handleDelete = async (id, type = "perjadinkota") => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            try {
                await deleteDoc(doc(db, type, id));
                if (type === "pegawai") {
                    setPegawaiList(prev => prev.filter(item => item.id !== id));
                } else {
                    setPerjadinList(prev => prev.filter(item => item.id !== id));
                }
                toast.success("Data berhasil dihapus");
            } catch (error) {
                console.error("Error deleting document:", error);
                toast.error("Gagal menghapus data");
            }
        }
    };

    const handlePrint = async (item) => {
        try {
            toast.loading("Generating SPPD PDF...", { id: "sppd-loading" });
            await generateSPPD(item);
            toast.dismiss("sppd-loading");
            toast.success("SPPD PDF berhasil dibuat!");
        } catch (error) {
            toast.dismiss("sppd-loading");
            console.error("Error generating SPPD PDF:", error);
            toast.error("Gagal membuat SPPD PDF");
        }
    };

    const handleSavePegawai = async (formData) => {
        setIsSaving(true);
        try {
            const dataToStore = {
                ...formData,
                tgllahir: formData.tgllahir ? new Date(formData.tgllahir) : null
            };

            if (selectedPegawai) {
                // UPDATE
                await updateDoc(doc(db, "pegawai", selectedPegawai.id), dataToStore);
                setPegawaiList(prev => prev.map(item => item.id === selectedPegawai.id ? { ...item, ...formData, tgllahir: dataToStore.tgllahir } : item));
                toast.success("Data pegawai berhasil diperbarui");
            } else {
                // CREATE
                const docRef = await addDoc(collection(db, "pegawai"), {
                    ...dataToStore,
                    createdAt: serverTimestamp()
                });
                setPegawaiList(prev => [{ id: docRef.id, ...formData, tgllahir: dataToStore.tgllahir }, ...prev]);
                toast.success("Pegawai berhasil ditambahkan");
            }

            setIsModalOpen(false);
            setSelectedPegawai(null);
        } catch (error) {
            console.error("Error saving employee:", error);
            toast.error("Gagal menyimpan data pegawai");
        } finally {
            setIsSaving(false);
        }
    };

    {/* Fungsi untuk mengubah status */ }
    const handleStatusChange = async (itemId, newStatus) => {
        try {
            await updateDoc(doc(db, "perjadinkota", itemId), {
                status: newStatus
            });

            setPerjadinList(prev => prev.map(item =>
                item.id === itemId ? { ...item, status: newStatus } : item
            ));

            toast.success(`Status berhasil diperbarui`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Gagal memperbarui status");
        }
    };


    {/* Fungsi Dropdown profil */ }
    const profileRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {

            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setOpenProfile(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Pagination logic
    const currentList = activeTab === "pegawai" ? pegawaiList : perjadinList;
    const totalPages = Math.ceil(currentList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = currentList.slice(startIndex, endIndex);

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
                        <div className="text-sm text-gray-500">Admin</div>
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
                        onClick={() => setActiveTab("pegawai")}
                        className={`w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-100 ${activeTab === 'pegawai' ? 'bg-gray-100 font-semibold' : 'text-gray-800'}`}
                    >
                        Pegawai
                    </button>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setOpenPerjadin(!openPerjadin)}
                            aria-expanded={openPerjadin}
                            className="w-full text-left flex items-center justify-between gap-3 p-2 rounded hover:bg-gray-100 text-gray-700 focus:outline-none focus:ring-0"
                        >
                            <span>Perjadin Dalam Kota</span>
                            <span className="text-sm">{openPerjadin ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                        </button>

                        {openPerjadin && (
                            <ul className="mt-2 bg-white border border-transparent rounded shadow-sm">
                                <li
                                    onClick={() => setActiveTab("berkas-konsul")}
                                    className={`px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm focus:outline-none ${activeTab === 'berkas-konsul' ? 'bg-gray-100 font-semibold text-blue-600' : ''}`}
                                >
                                    Perjadin Berkas atau Konsul
                                </li>
                                <li
                                    onClick={() => setActiveTab("perjadin-umum-dalam-kota")}
                                    className={`px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm focus:outline-none ${activeTab === 'perjadin-umum-dalam-kota' ? 'bg-gray-100 font-semibold text-blue-600' : ''}`}
                                >
                                    Perjadin Umum Dalam Kota
                                </li>
                            </ul>
                        )}
                    </div>

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
                <header className="h-16 bg-white flex items-center px-6 shadow-sm">
                    <div className="flex-1">
                        {/* <input placeholder="Search or type a command" className="w-1/3 border rounded px-3 py-2 text-sm" /> */}
                    </div>
                    <div ref={profileRef} className="flex items-center gap-4 relative">
                        <button className="p-2 rounded-full text-black hover:bg-blue-600 hover:text-white"><Bell size={20} /></button>

                        {/* Profile dropdown */}
                        <button
                            type="button"
                            onClick={() => setOpenProfile(!openProfile)}
                            className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center focus:outline-none"
                            aria-expanded={openProfile}
                        >
                            <User size={16} className="text-white" />
                        </button>

                        {openProfile && (
                            <div className="absolute right-0 mt-12 w-56 bg-white rounded shadow z-20 border border-gray-100 focus:outline-none">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">U</div>
                                    <div>
                                        <div className="font-semibold text-black">{user?.displayName || "Nama Pengguna"}</div>
                                        <div className="text-sm text-gray-500">{user?.email || "user@example.com"}</div>
                                    </div>
                                </div>
                                <div className="px-4 py-2 border-t border-gray-100">
                                    <button
                                        onClick={async () => {
                                            try {
                                                await signOut(auth);
                                                router.push("/login");
                                            } catch (err) {
                                                console.error("Logout gagal", err);
                                                toast.error("Logout Gagal");
                                            }
                                        }}
                                        className="w-full text-left text-red-600 font-semibold hover:bg-red-50 p-2 rounded focus:outline-none flex items-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

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

                        {activeTab === "pegawai" && (
                            <div className="bg-white p-6 rounded shadow text-gray-800">
                                <div className="flex justify-between items-center mb-6 border-b pb-4">
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
                                                <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">No</th>
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
                                                        <td className="px-4 py-3 border-b text-sm text-gray-700">{startIndex + index + 1}</td>
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
                                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                                    title="Edit"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item.id, "pegawai")}
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
                                {currentList.length > itemsPerPage && (
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

                        {/* Content for "Perjadin Berkas atau Konsul" */}
                        {activeTab === "berkas-konsul" && (
                            <div className="bg-white p-6 rounded shadow text-gray-800">
                                <div className="flex justify-between items-center mb-6 border-b pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">List Data Perjadin Berkas atau Konsul</h2>
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
                                                <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Tujuan</th>
                                                <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Tanggal</th>
                                                <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Keperluan</th>
                                                <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Status</th>
                                                <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan="6" className="px-4 py-10 text-center text-gray-500 italic border-b">
                                                    Belum ada data perjadin. Silahkan tambah data baru.
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {currentList.length > itemsPerPage && (
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
                                                            <select
                                                                value={item.status || 'Menunggu'}
                                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                                className={`text-xs px-2 py-1 rounded-full font-medium focus:outline-none cursor-pointer border-none transition-colors ${item.status === 'Selesai'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : item.status === 'Ditolak'
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                    }`}
                                                            >
                                                                <option value="Menunggu">Menunggu</option>
                                                                <option value="Selesai">Success</option>
                                                                <option value="Ditolak">Tolak</option>
                                                            </select>
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
                                                                <button
                                                                    onClick={() => handlePrint(item)}
                                                                    className="text-green-600 hover:text-green-800 p-1"
                                                                    title="Print"
                                                                >
                                                                    <Printer size={16} />
                                                                </button>
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
                                {currentList.length > itemsPerPage && (
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
            {/* Pegawai Modal Component */}
            <PegawaiModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedPegawai(null);
                }}
                onSave={handleSavePegawai}
                pegawaiData={selectedPegawai}
                isSaving={isSaving}
            />
        </div>
    );
}
