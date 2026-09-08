"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/services/firebases";
import { onAuthStateChanged, User as AuthUser } from "firebase/auth";
import { collection, getDocs, deleteDoc, doc, query, orderBy, getDoc, serverTimestamp, addDoc, updateDoc, limit } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { generateSPPD } from "@/lib/pdf/perjadinkota/page";
import { formatNotificationDate } from "@/components/topbar/notificationHelpers";
import { generateNotaDinas } from "@/lib/pdf/perjadinkota/nota";
import PegawaiModal from "@/components/PegawaiModal";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import Topbar from "@/components/Topbar";
import KwitansiSection from "@/components/KwitansiSection";
import { deleteFile } from "@/lib/supabase/deleteFile";
import { createSignedUrl } from "@/lib/supabase/createSignedUrl";
import UserSidebar from "@/components/dashuser/UserSidebar";
import UserPegawaiList from "@/components/dashuser/UserPegawaiList";
import UserPerjadinKotaList from "@/components/dashuser/UserPerjadinKotaList";
import { Pegawai, User as DbUser } from "@/types";
import { ArrowUpRight, BriefcaseBusiness, ChevronRight, FileText, Sparkles, Upload, Users } from "lucide-react";

export default function DashuserPage() {
  useInactivityLogout(1800000); // 30 minutes auto logout
  const [openPerjadinLuar, setOpenPerjadinLuar] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // State to manage active content in main area
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [perjadinList, setPerjadinList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc");
  const itemsPerPage = 10;
  const [printModalItem, setPrintModalItem] = useState<any | null>(null);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [overviewStats, setOverviewStats] = useState({ perjadin: 0, kwitansi: 0, visum: 0, pegawai: 0 });
  const [userActivityLogs, setUserActivityLogs] = useState<any[]>([]);
  const [userLoginHistory, setUserLoginHistory] = useState<any[]>([]);
  const [today, setToday] = useState("");

  // Modal State for Pegawai
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null);

  useEffect(() => {
    setToday(new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date()));
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Better security: verify if admin is trying to access user dash
        try {
          const userDoc = await getDoc(doc(db, "user", u.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as DbUser;

            // Cek jika akun dinonaktifkan
            if (userData.status === "inactive") {
              await auth.signOut();
              toast.error("Akun Anda telah dinonaktifkan. Silakan hubungi admin.");
              router.replace("/login");
              return;
            }

            const role = userData.role;
            if (role === "admin") {
              router.replace("/dashbord/dashadmin");
              return;
            }

            // Fetch Pegawai Name
            if (userData.idPegawai) {
              const pegDoc = await getDoc(doc(db, "pegawai", userData.idPegawai));
              if (pegDoc.exists()) {
                setUserProfile({ ...userData, name: pegDoc.data().nama });
              } else {
                setUserProfile({ ...userData, name: u.displayName || "User" });
              }
            } else {
              setUserProfile({ ...userData, name: u.displayName || "User" });
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
  }, [router]);

  useEffect(() => {
    const fetchOverviewStats = async () => {
      if (!user?.uid && !user?.email) return;

      try {
        const [pegawaiSnapshot, notificationSnapshot] = await Promise.all([
          getDocs(collection(db, "pegawai")),
          getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc")))
        ]);

        setOverviewStats((prev) => ({
          ...prev,
          pegawai: pegawaiSnapshot.size
        }));

        const allNotifications = notificationSnapshot.docs
          .map((docItem): any => ({ id: docItem.id, ...docItem.data() }))
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.seconds ?? 0;
            const bTime = b.createdAt?.seconds ?? 0;
            return bTime - aTime;
          });

        const mainActivityLogs = allNotifications.filter((item: any) => item.type !== "login");
        const loginHistory = allNotifications.filter((item: any) => item.type === "login");

        setUserActivityLogs(mainActivityLogs.slice(0, 3));
        setUserLoginHistory(loginHistory.slice(0, 2));
      } catch (error) {
        console.error("Error fetching overview stats:", error);
      }
    };

    fetchOverviewStats();
  }, [user?.uid, user?.email]);

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
      } else if (activeTab === "pegawai") {
        setLoading(true);
        try {
          const q = query(collection(db, "pegawai"), orderBy("nama", "asc"));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Pegawai));
          setPegawaiList(data);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Gagal mengambil data pegawai");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [activeTab]);

  // Reset page and sort when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSortOrder("desc");
  }, [activeTab]);

  const handleDelete = async (id: string, type: string = "perjadinkota") => {
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

  const handleSavePegawai = async (formData: Record<string, unknown>): Promise<void> => {
    setIsSaving(true);
    try {
      const dataToStore = {
        ...formData,
        tgllahir: formData.tgllahir ? new Date(formData.tgllahir as string | number) : null
      };

      if (selectedPegawai) {
        // UPDATE
        await updateDoc(doc(db, "pegawai", selectedPegawai.id), dataToStore);

        // Create Notification for Pegawai Update
        try {
          await addDoc(collection(db, "notifications"), {
            title: "Update Data Pegawai",
            message: `Data pegawai ${formData.nama} telah diperbarui oleh ${userProfile?.name || auth.currentUser?.displayName || 'User'}.`,
            type: "update",
            userName: userProfile?.name || auth.currentUser?.displayName || "User",
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
            message: `Pegawai baru ${formData.nama} telah ditambahkan oleh ${userProfile?.name || auth.currentUser?.displayName || 'User'}.`,
            type: "pegawai",
            userName: userProfile?.name || auth.currentUser?.displayName || "User",
            userEmail: auth.currentUser?.email || "-",
            userUid: auth.currentUser?.uid,
            createdAt: serverTimestamp(),
            isRead: false
          });
        } catch (notifErr) {
          console.error("Failed to create notification:", notifErr);
        }

        setPegawaiList(prev => [{ id: docRef.id, ...formData, tgllahir: dataToStore.tgllahir } as Pegawai, ...prev]);
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

  const handlePrint = async (item: Record<string, unknown>, type: string = 'spj'): Promise<void> => {
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
    } catch (error: unknown) {
      toast.dismiss("sppd-loading");
      toast.dismiss("nota-loading");
    }
  };

  const handleViewFile = async (path: string) => {
    if (!path) return;
    
    try {
      toast.loading("Membuka file...", { id: "file-loading" });
      const url = await createSignedUrl(path);
      toast.dismiss("file-loading");
      
      if (url) {
        window.open(url, '_blank');
        toast.success("File dibuka");
      } else {
        toast.error("Gagal membuat akses file. Silakan coba lagi.");
      }
    } catch (error: unknown) {
      toast.dismiss("file-loading");
      
      const errorMsg = error instanceof Error ? error.message : "Terjadi kesalahan saat membuka file";
      console.error("Error viewing file:", error);
      
      // Show specific error based on the error message
      if (errorMsg.includes("tidak ditemukan")) {
        toast.error("File tidak ditemukan. Mungkin sudah dihapus.");
      } else if (errorMsg.includes("tidak memiliki akses")) {
        toast.error(errorMsg);
      } else if (errorMsg.includes("Konfigurasi")) {
        toast.error(errorMsg);
      } else {
        toast.error(errorMsg);
      }
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <UserSidebar 
        activeTab={activeTab} setActiveTab={setActiveTab}
        openPerjadinLuar={openPerjadinLuar} setOpenPerjadinLuar={setOpenPerjadinLuar}
      />

      {/* Main area */}
      <div className="min-w-0 flex-1 flex flex-col min-h-screen relative">
        {/* Topbar */}
        <Topbar user={user} role="User" />

        {/* Content - Ensure it takes remaining height khusus Overview ada catatan untuk di perbaiki*/}
        <main className="flex-1 p-4 flex flex-col sm:p-6">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
            {activeTab === "overview" && (
              <div className="space-y-5 pb-6">
                <section className="relative overflow-hidden rounded-[2rem] bg-yellow-600 px-6 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-8">
                <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-cyan-300/20" />
                <div className="absolute -right-2 -top-10 h-48 w-48 rounded-full border border-cyan-300/10" />
                <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-500">Dashboard User</p>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Selamat datang, {userProfile?.name || user?.displayName || "User"}</h1>
                  <p className="mt-2 text-sm text-slate-300">Ringkasan aktivitas dan Update Hari ini</p>
                  </div>
                  <time className="shrink-0 text-sm font-medium text-slate-300">{today}</time>
                  </div>
                  </section>
                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ 
                  label: "Perjadin Kota", 
                  value: "0", 
                  icon: BriefcaseBusiness, 
                  tone: "bg-cyan-50 text-cyan-700" 
                  }, { 
                    label: "Kwitansi", 
                    value: "0", 
                    icon: FileText, 
                    tone: "bg-amber-50 text-amber-700" }, 
                    { label: "Visum", 
                    value: "0", 
                    icon: Upload, 
                    tone: "bg-emerald-50 text-emerald-700" 
                    }, { label: "Pegawai", 
                    value: String(overviewStats.pegawai), 
                    icon: Users, 
                    tone: "bg-violet-50 text-violet-700" 
                    }].map(({ label, value, icon: Icon, tone }) => <div key={label} 
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className={`mb-5 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                        <Icon size={17} />
                        </div><p className="text-xs font-medium text-slate-500">{label}</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
                        </div>)}
                        </section>
                <section className="grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Aktivitas</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">Riwayat Aktivitas</h2>
                      </div>
                      <ArrowUpRight size={18} className="text-slate-400" />
                    </div>

                    <div className="max-h-60 space-y-4 overflow-y-auto pr-1 text-sm text-slate-600">
                      {userActivityLogs.length > 0 ? userActivityLogs.map((activity, index) => (
                        <div key={activity.id || `${activity.title}-${index}`} className="flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${index === 0 ? "bg-cyan-500" : index === 1 ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-700">{activity.title}</p>
                            <p className="text-[11px] text-slate-500">{activity.message}</p>
                          </div>
                          <span className="ml-auto shrink-0 text-[10px] text-slate-400">{formatNotificationDate(activity.createdAt)}</span>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Belum ada riwayat aktivitas Anda.</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Riwayat pengguna</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">Aktivitas login</h2>
                    <div className="mt-5 max-h-52 space-y-3 overflow-y-auto pr-1">
                      {userLoginHistory.length > 0 ? userLoginHistory.map((activity, index) => (
                        <div key={`activity-${activity.id || index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${index % 2 === 0 ? "bg-cyan-500" : "bg-violet-500"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">{activity.userName || activity.userEmail || "System"}</p>
                            <p className="mt-1 text-xs text-slate-600">{activity.message || activity.title}</p>
                            <p className="mt-1 text-[10px] text-slate-400">{formatNotificationDate(activity.createdAt)}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Belum ada aktivitas login untuk akun Anda.</div>
                      )}
                    </div>
                  </div>
                </section>
                <section className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-white"><Sparkles size={20} /></div><div className="flex-1"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Informasi Sistem</p><h2 className="mt-1 font-semibold text-slate-900">Update v2.4</h2><p className="mt-1 text-sm text-slate-600">AI Auto Fill Surat Undangan sekarang tersedia</p></div><button onClick={() => setActiveTab("perjadin-umum-dalam-kota")} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-cyan-700 hover:text-cyan-900">Lihat detail <ChevronRight size={16} /></button></div></section>
                <section>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Panduan Singkat</p>
                  <div className="grid gap-3 md:grid-cols-3">{["Cara membuat Perjadin", "Upload surat dengan AI", "Generate laporan"].map((guide) => <button key={guide} onClick={() => setActiveTab("perjadin-umum-dalam-kota")} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-cyan-600"><ChevronRight size={15} /></span>{guide}</button>)}</div></section>
              </div>
            )}

            {/* Content for "Kwitansi" */}
            {activeTab === "kwitansi" && <KwitansiSection isAdmin={false} userProfile={userProfile} />}

            {/* Content for "Pegawai" */}
            {activeTab === "pegawai" && (
              <UserPegawaiList 
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

            {activeTab === "perjadin-umum-dalam-kota" && (
              <div className="flex-1 flex flex-col min-h-[calc(100vh-180px)] space-y-6">
                  <UserPerjadinKotaList 
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
                    handleViewFile={handleViewFile}
                    router={router}
                    setPrintModalItem={setPrintModalItem}
                    handleDelete={handleDelete}
                  />
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
              </div>
            )}
          </div>
        </main>
      </div>

      <PegawaiModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPegawai(null);
        }}
        onSave={handleSavePegawai}
        pegawaiData={selectedPegawai as any}
        isSaving={isSaving}
      />
    </div>
  );
}
