"use client";

import React, { useState, useEffect } from "react";
import { db, auth } from "@/services/firebases";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Key, 
  Power, 
  Shield, 
  Mail, 
  Calendar,
  Users
} from "lucide-react";
import { toast } from "react-hot-toast";
import UserModal from "./UserModal";
import Pagination from "./Pagination";
import { sendPasswordResetEmail } from "firebase/auth";

export default function UserSection() {
  const [users, setUsers] = useState([]);
  const [pegawaiList, setPegawaiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch Pegawai for mapping
    const fetchPegawai = async () => {
      const q = query(collection(db, "pegawai"), orderBy("nama", "asc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPegawaiList(list);
    };

    fetchPegawai();

    // Listen to users collection
    const q = query(collection(db, "user"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to users:", error);
      toast.error("Gagal memuat data user");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteUser = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus user ini? Catatan: Akun Auth user tidak akan terhapus secara otomatis dari client-side, hanya data Firestore yang dihapus.")) {
      try {
        // Get target user info for notification message
        const targetUserDoc = await getDoc(doc(db, "user", id));
        const targetEmail = targetUserDoc.exists() ? targetUserDoc.data().email : id;

        await deleteDoc(doc(db, "user", id));

        // Create Notification
        await addDoc(collection(db, "notifications"), {
          title: "User Dihapus",
          message: `Akun user ${targetEmail} telah dihapus dari database oleh ${auth.currentUser?.email || 'Admin'}.`,
          type: "status",
          userName: auth.currentUser?.email || "Admin",
          userEmail: auth.currentUser?.email || "-",
          userUid: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
          isRead: false
        });

        toast.success("User berhasil dihapus dari database");
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Gagal menghapus user");
      }
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Email reset password telah dikirim ke ${email}`);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Gagal mengirim email reset password");
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "user", user.id), { status: newStatus });

      // Create Notification
      await addDoc(collection(db, "notifications"), {
        title: `User ${newStatus === "active" ? "Diaktifkan" : "Dinonaktifkan"}`,
        message: `Status akun ${user.email} diubah menjadi ${newStatus === "active" ? "Aktif" : "Nonaktif"} oleh ${auth.currentUser?.email || 'Admin'}.`,
        type: "status",
        userName: auth.currentUser?.email || "Admin",
        userEmail: auth.currentUser?.email || "-",
        userUid: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        isRead: false
      });

      toast.success(`User ${newStatus === "active" ? "diaktifkan" : "dinonaktifkan"}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Gagal mengubah status user");
    }
  };

  // Logic to get pegawai name by idPegawai
  const getPegawaiName = (idPegawai) => {
    const p = pegawaiList.find(p => p.id === idPegawai);
    return p ? p.nama : "Tidak Terhubung";
  };

  // Pagination Logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-gray-800 flex-1 flex flex-col min-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" /> Kelola User
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manajemen hak akses dan akun pengguna sistem.</p>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-bold text-sm"
        >
          <UserPlus size={18} /> Tambah User
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-4 py-4 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Pegawai</th>
              <th className="px-4 py-4 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-4 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-4 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-4 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">Dibuat</th>
              <th className="px-4 py-4 border-b text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-400 italic">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Memuat data user...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-400 italic">
                  Belum ada data user.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {getPegawaiName(user.idPegawai).charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{getPegawaiName(user.idPegawai)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      user.role === "admin" 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      <Shield size={10} />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      user.status === "active" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {user.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('id-ID') : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === "active" 
                            ? "text-red-500 hover:bg-red-50" 
                            : "text-green-500 hover:bg-green-50"
                        }`}
                        title={user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Role"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.email)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus User"
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

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={users.length}
          startIndex={startIndex}
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <UserModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          selectedUser={selectedUser}
          pegawaiList={pegawaiList}
        />
      )}
    </div>
  );
}
