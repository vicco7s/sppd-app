"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/services/firebases";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, deleteDoc, doc, query, orderBy, addDoc, serverTimestamp} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { generateSPPD } from "@/lib/pdf/perjadinkota/page";
import { generateNotaDinas } from "@/lib/pdf/perjadinkota/nota";
import PegawaiModal from "@/components/PegawaiModal";
import { updateDoc, getDoc } from "firebase/firestore";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import Topbar from "@/components/Topbar";
import KwitansiSection from "@/components/KwitansiSection";
import UpdateLogSection from "@/components/UpdateLogSection";
import UserSection from "@/components/UserSection";
import { deleteFile } from "@/lib/supabase/deleteFile";
import { createSignedUrl } from "@/lib/supabase/createSignedUrl";
import AdminSidebar from "@/components/dashadmin/AdminSidebar";
import PegawaiList from "@/components/dashadmin/PegawaiList";
import PerjadinKotaList from "@/components/dashadmin/PerjadinKotaList";

export default function DashadminPage() {
    useInactivityLogout(1800000); // 30 minutes auto logout
    const [openPegawaiUser, setOpenPegawaiUser] = useState(false);
    const [openBendahara, setOpenBendahara] = useState(false);
    const [openPerjadinLuar, setOpenPerjadinLuar] = useState(false);
    const [activeTab, setActiveTab] = useState("overview"); // State to manage active content in main area
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [perjadinList, setPerjadinList] = useState([]);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState("desc");
    const itemsPerPage = 10;
    const [printModalItem, setPrintModalItem] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    // Modal State for Pegawai
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPegawai, setSelectedPegawai] = useState(null); // null means "Add", object means "Edit"

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                // Verify role and fetch full profile
                try {
                    const userDoc = await getDoc(doc(db, "user", u.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const role = userData.role;
                        if (role !== "admin") {
                            router.replace("/dashbord/dashuser");
                            return;
                        }

                        // Fetch Pegawai Name
                        if (userData.idPegawai) {
                            const pegDoc = await getDoc(doc(db, "pegawai", userData.idPegawai));
                            if (pegDoc.exists()) {
                                setUserProfile({ ...userData, name: pegDoc.data().nama });
                            } else {
                                setUserProfile({ ...userData, name: u.displayName || "Admin" });
                            }
                        } else {
                            setUserProfile({ ...userData, name: u.displayName || "Admin" });
                        }
                    } else {
                        router.replace("/login");
                    }
                } catch (err) {
                    console.error("Auth error:", err);
                    router.replace("/login");
                }
            } else {
                router.replace("/login");
            }
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

    // Reset page and sort when tab changes
    useEffect(() => {
        setCurrentPage(1);
        setSortOrder("desc");
    }, [activeTab]);

    const handleDelete = async (id, type = "perjadinkota") => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            try {
                // Jika menghapus perjadin, cek apakah ada file Supabase yang perlu dihapus
                if (type === "perjadinkota") {
                    const docSnap = await getDoc(doc(db, "perjadinkota", id));
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.suratPath) {
                            try {
                                await deleteFile(data.suratPath);
                            } catch (supabaseErr) {
                                console.error("Failed to delete Supabase file:", supabaseErr);
                                // Lanjutkan penghapusan data Firestore meskipun hapus file gagal
                            }
                        }
                    }
                }

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
            setPrintModalItem(null);
        } catch (error) {
            toast.dismiss("sppd-loading");
            toast.dismiss("nota-loading");
            console.error("Error generating PDF:", error);
            toast.error("Gagal membuat PDF");
        }
    };

    const handleViewFile = async (path) => {
        if (!path) return;
        try {
            const url = await createSignedUrl(path);
            if (url) {
                window.open(url, '_blank');
            } else {
                toast.error("Gagal mendapatkan akses file");
            }
        } catch (error) {
            console.error("Error viewing file:", error);
            toast.error("Gagal membuka file");
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

                // Create Notification for Pegawai Update
                try {
                    await addDoc(collection(db, "notifications"), {
                        title: "Update Data Pegawai",
                        message: `Data pegawai ${formData.nama} telah diperbarui.`,
                        type: "update",
                        userName: auth.currentUser?.email || "Admin",
                        userEmail: auth.currentUser?.email || "-",
                        userUid: auth.currentUser?.uid,
                        createdAt: serverTimestamp(),
                        isRead: false
                    });
                } catch (notifErr) {
                    console.error("Failed to create pegawai update notification:", notifErr);
                }

                setPegawaiList(prev => prev.map(item => item.id === selectedPegawai.id ? { ...item, ...formData, tgllahir: dataToStore.tgllahir } : item));
                toast.success("Data pegawai berhasil diperbarui");
            } else {
                // CREATE
                const docRef = await addDoc(collection(db, "pegawai"), {
                    ...dataToStore,
                    createdAt: serverTimestamp()
                });

                // Create Notification
                try {
                    await addDoc(collection(db, "notifications"), {
                        title: "Pegawai Baru",
                        message: `Pegawai baru ${formData.nama} telah ditambahkan ke sistem.`,
                        type: "pegawai",
                        userName: auth.currentUser?.email || "Admin",
                        userEmail: auth.currentUser?.email || "-",
                        userUid: auth.currentUser?.uid,
                        createdAt: serverTimestamp(),
                        isRead: false
                    });
                } catch (notifErr) {
                    console.error("Failed to create notification:", notifErr);
                }

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

            // Create Notification for Status Change
            try {
                // Fetch tujuan for better message
                const itemSnap = await getDoc(doc(db, "perjadinkota", itemId));
                const tujuan = itemSnap.exists() ? itemSnap.data().tujuan : "-";

                await addDoc(collection(db, "notifications"), {
                    title: "Status Perjadin Berubah",
                    message: `Status Perjadin ke ${tujuan} diubah menjadi ${newStatus}.`,
                    type: "status",
                    userName: auth.currentUser?.email || "Admin",
                    userEmail: auth.currentUser?.email || "-",
                    userUid: auth.currentUser?.uid,
                    createdAt: serverTimestamp(),
                    isRead: false
                });
            } catch (notifErr) {
                console.error("Failed to create status notification:", notifErr);
            }

            setPerjadinList(prev => prev.map(item =>
                item.id === itemId ? { ...item, status: newStatus } : item
            ));

            toast.success(`Status berhasil diperbarui`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Gagal memperbarui status");
        }
    };


    // Pagination & Sort logic
    const currentList = activeTab === "pegawai" ? pegawaiList : perjadinList;
    const sortedData = sortOrder === "asc" ? [...currentList].reverse() : currentList;
    
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    const toggleSort = () => {
        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
    <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar 
            activeTab={activeTab} setActiveTab={setActiveTab}
            openPegawaiUser={openPegawaiUser} setOpenPegawaiUser={setOpenPegawaiUser}
            openPerjadinLuar={openPerjadinLuar} setOpenPerjadinLuar={setOpenPerjadinLuar}
            openBendahara={openBendahara} setOpenBendahara={setOpenBendahara}
        />

            {/* Main area */}
            <div className="flex-1 flex flex-col min-h-screen relative">
                {/* Topbar */}
                <Topbar user={user} role="Admin" />

                {/* Content - Ensure it takes remaining height */}
                <main className="flex-1 p-6 flex flex-col">
                    <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                        {activeTab === "overview" && (
                            <div className="col-span-1">
                                <div className="p-9 bg-white rounded shadow h-20 flex items-center justify-center text-gray-800">
                                    <p>Selamat Datang</p>
                                </div>
                            </div>
                        )}

                        {/* Content for "Kwitansi" */}
                        {activeTab === "kwitansi" && <KwitansiSection isAdmin={true} userProfile={userProfile} />}

                        {/* Content for "Update Log" */}
                        {activeTab === "update-log" && <UpdateLogSection />}

                        {/* Content for "Kelola User" */}
                        {activeTab === "manage-users" && <UserSection />}

                        {/* Content for "Pegawai" */}
                        {activeTab === "pegawai" && (
                            <PegawaiList 
                                loading={loading}
                                pegawaiList={pegawaiList}
                                currentList={currentList}
                                paginatedData={paginatedData}
                                sortOrder={sortOrder}
                                toggleSort={toggleSort}
                                startIndex={startIndex}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                setCurrentPage={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                setSelectedPegawai={setSelectedPegawai}
                                setIsModalOpen={setIsModalOpen}
                                handleDelete={handleDelete}
                            />
                        )}



                        {/* Content for "Perjadin Umum Dalam Kota" */}
                        {activeTab === "perjadin-umum-dalam-kota" && (
                            <PerjadinKotaList 
                                loading={loading}
                                perjadinList={perjadinList}
                                currentList={currentList}
                                paginatedData={paginatedData}
                                sortOrder={sortOrder}
                                toggleSort={toggleSort}
                                startIndex={startIndex}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                setCurrentPage={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                handleStatusChange={handleStatusChange}
                                handleViewFile={handleViewFile}
                                router={router}
                                setPrintModalItem={setPrintModalItem}
                                handleDelete={handleDelete}
                            />
                        )}
                    </div>
                </main>
            </div>
            {printModalItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setPrintModalItem(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-sm w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="text-sm font-semibold text-gray-800">Opsi Cetak</h3>
                            <button
                                onClick={() => setPrintModalItem(null)}
                                className="text-gray-500 hover:text-gray-700"
                                aria-label="Tutup"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {(printModalItem.isinota || printModalItem.dari) && (
                                <button
                                    onClick={() => handlePrint(printModalItem, 'nota')}
                                    className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-all flex items-center gap-3"
                                >
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span>Print Nota Dinas</span>
                                </button>
                            )}
                            <button
                                onClick={() => handlePrint(printModalItem, 'spj')}
                                className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all flex items-center gap-3"
                            >
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>Print SPJ Perjadin</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
