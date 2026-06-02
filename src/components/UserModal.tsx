"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Mail, 
  Lock, 
  Shield, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  IdCard,
  Loader2
} from "lucide-react";
import { db, auth, secondaryAuth } from "@/services/firebases";
import { 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  addDoc,
  collection
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import { User, Pegawai } from "@/types";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
  pegawaiList: Pegawai[];
}

export default function UserModal({ isOpen, onClose, selectedUser, pegawaiList }: UserModalProps) {
  const isEdit = !!selectedUser;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    idPegawai: ""
  });

  const [selectedPegawaiData, setSelectedPegawaiData] = useState<Pegawai | null>(null);

  useEffect(() => {
    if (isEdit && selectedUser) {
      setFormData({
        email: selectedUser.email,
        password: "",
        confirmPassword: "",
        role: selectedUser.role,
        idPegawai: selectedUser.idPegawai
      });
      const p = pegawaiList.find(p => p.id === selectedUser.idPegawai) || null;
      setSelectedPegawaiData(p);
    } else {
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        role: "user",
        idPegawai: ""
      });
      setSelectedPegawaiData(null);
    }
  }, [selectedUser, isEdit, pegawaiList]);

  const handlePegawaiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setFormData({ ...formData, idPegawai: id });
    const p = pegawaiList.find(p => p.id === id) || null;
    setSelectedPegawaiData(p);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validasi
    if (!formData.email || !formData.idPegawai) {
      toast.error("Email dan Pegawai wajib diisi");
      return;
    }

    if (!isEdit) {
      if (formData.password.length < 6) {
        toast.error("Password minimal 6 karakter");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Konfirmasi password tidak cocok");
        return;
      }
    }

    setLoading(true);
    try {
      if (isEdit && selectedUser) {
        // Update Role & Pegawai in Firestore
        await updateDoc(doc(db, "user", selectedUser.id), {
          role: formData.role,
          idPegawai: formData.idPegawai
        });

        // Create Notification
        await addDoc(collection(db, "notifications"), {
          title: "User Diperbarui",
          message: `Hak akses user ${formData.email} telah diperbarui oleh ${auth.currentUser?.email || 'Admin'}.`,
          type: "update",
          userName: auth.currentUser?.email || "Admin",
          userEmail: auth.currentUser?.email || "-",
          userUid: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
          isRead: false
        });

        toast.success("User berhasil diperbarui");
      } else {
        // Create User in Auth using secondary app
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth, 
          formData.email, 
          formData.password
        );
        const user = userCredential.user;

        // Save to Firestore
        await setDoc(doc(db, "user", user.uid), {
          uid: user.uid,
          email: formData.email,
          role: formData.role,
          idPegawai: formData.idPegawai,
          status: "active",
          createdAt: serverTimestamp(),
        });

        // Create Notification
        await addDoc(collection(db, "notifications"), {
          title: "User Baru Terdaftar",
          message: `User baru ${formData.email} telah ditambahkan ke sistem oleh ${auth.currentUser?.email || 'Admin'}.`,
          type: "pegawai",
          userName: auth.currentUser?.email || "Admin",
          userEmail: auth.currentUser?.email || "-",
          userUid: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
          isRead: false
        });

        // Sign out from secondary app immediately to prevent session interference
        await signOut(secondaryAuth);
        
        toast.success("User baru berhasil dibuat");
      }
      onClose();
    } catch (error: unknown) {
      console.error("Error saving user:", error);
      const firebaseError = error as { code?: string } | undefined;
      if (firebaseError?.code === "auth/email-already-in-use") {
        toast.error("Email sudah terdaftar");
      } else {
        toast.error(isEdit ? "Gagal memperbarui user" : "Gagal membuat user");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">
              {isEdit ? "Edit Hak Akses User" : "Tambah User Baru"}
            </h3>
            <p className="text-blue-100 text-xs mt-1">
              {isEdit ? "Sesuaikan role dan relasi pegawai" : "Buat akun sistem untuk pegawai"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            title="Tutup modal"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            {/* Account Info Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Informasi Akun</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      type="email"
                      disabled={isEdit}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:opacity-60 disabled:bg-gray-100"
                      placeholder="email@instansi.go.id"
                    />
                  </div>
                </div>

                {!isEdit && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-start-2">
                      <label className="text-xs font-bold text-gray-500 ml-1">Konfirmasi Password</label>
                      <div className="relative">
                        <CheckCircle2 className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* Access & Relation Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Hak Akses & Relasi</h4>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">Role User</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none"
                      aria-label="Pilih role user"
                      title="Pilih role user"
                    >
                      <option value="user">User Standard</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1">Pilih Pegawai</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select 
                      value={formData.idPegawai}
                      onChange={handlePegawaiChange}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm appearance-none"
                      aria-label="Pilih pegawai"
                      title="Pilih pegawai"
                    >
                      <option value="">-- Pilih Pegawai --</option>
                      {pegawaiList.map(p => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 block mb-2">Preview Profil Pegawai</label>
                {selectedPegawaiData ? (
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0">
                        <IdCard size={24} />
                      </div>
                      <div className="space-y-2 overflow-hidden">
                        <div className="text-sm font-bold text-gray-900 truncate">{selectedPegawaiData.nama}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                          <span className="font-bold bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">NIP</span>
                          {selectedPegawaiData.nip}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                          <Briefcase size={12} className="text-blue-500" />
                          <span className="truncate">{selectedPegawaiData.jabatan}</span>
                        </div>
                        <div className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                          {selectedPegawaiData.pangkat}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[140px] border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300 gap-2">
                    <AlertCircle size={24} />
                    <span className="text-[10px] font-bold">Pilih pegawai untuk melihat profil</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-10 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                isEdit ? "Simpan Perubahan" : "Konfirmasi & Buat User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
