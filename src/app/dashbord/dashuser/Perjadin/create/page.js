"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth, db } from "@/services/firebases";
import { collection, getDocs, doc, setDoc, updateDoc, query, where, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import PerjadinForm from '@/components/PerjadinForm';
import { uploadFile } from '@/lib/supabase/uploadFile';
import { createSignedUrl } from '@/lib/supabase/createSignedUrl';

const CreatePerjadin = () => {
  const router = useRouter();
  const [pegawaiList, setPegawaiList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Ambil data pegawai dari Firestore
  useEffect(() => {
    const fetchPegawai = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pegawai"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPegawaiList(data);
      } catch (error) {
        console.error("Error fetching pegawai:", error);
      }
    };
    fetchPegawai();

    // Fetch Current User Profile
    const fetchUserProfile = async () => {
      const u = auth.currentUser;
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, "user", u.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.idPegawai) {
              const pegDoc = await getDoc(doc(db, "pegawai", userData.idPegawai));
              if (pegDoc.exists()) {
                setUserProfile({ ...userData, name: pegDoc.data().nama });
              }
            }
          }
        } catch (err) { console.error("Error fetching user profile:", err); }
      }
    };
    fetchUserProfile();
  }, []);

  const handleSave = async (formData) => {
    setIsSubmitting(true);

    // Validation
    const isNota = formData.dari || formData.isinota;
    const requiredFields = [
      'no', 'noSpt', 'noSpd', 'tanggal', 'idPegawai', 'tujuan',
      'suratDari', isNota ? null : 'tanggalSurat', 'perihalSurat', 'untuk',
      'tanggalBerangkat', 'tanggalKembali',
      'kegiatan', 'hasil', 'kesimpulan', 'saran'
    ].filter(Boolean);

    const emptyFields = requiredFields.filter(field => !formData[field]);

    if (emptyFields.length > 0) {
      toast.error("Harap isi semua field yang wajib!");
      setIsSubmitting(false);
      return;
    }

    try {
      const { pendingFile, ...perjadinData } = formData;

      // Check for duplicate number
      const q = query(collection(db, "perjadinkota"), where("no", "==", formData.no));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error(`Nomor ${formData.no} sudah ada!`);
        setIsSubmitting(false);
        return;
      }

      const newDocRef = doc(collection(db, "perjadinkota"));
      await setDoc(newDocRef, {
        ...perjadinData,
        id: newDocRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (pendingFile) {
        const uploadedFile = await uploadFile(pendingFile, 'surat-undangan');
        const suratUrl = await createSignedUrl(uploadedFile.path);
        await updateDoc(newDocRef, {
          suratUrl,
          suratPath: uploadedFile.path,
          suratFileName: uploadedFile.fileName,
          updatedAt: new Date()
        });
      }

      // Create Notification
      try {
        const isAdmin = userProfile?.role === 'admin';
        await addDoc(collection(db, "notifications"), {
          title: "Perjadin Baru",
          message: `Perjadin ke ${formData.tujuan} telah ditambahkan oleh ${isAdmin ? auth.currentUser?.email : (userProfile?.name || auth.currentUser?.displayName || 'User')}.`,
          type: "create",
          userName: isAdmin ? auth.currentUser?.email : (userProfile?.name || auth.currentUser?.displayName || "User"),
          userEmail: auth.currentUser?.email || "-",
          userUid: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
          isRead: false
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }

      toast.success("Data berhasil disimpan!");
      router.push('/dashbord/dashuser');
    } catch (error) {
      console.error("Error saving document: ", error);
      toast.error("Gagal menyimpan data.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-gray-900">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors mb-6 group"
        >
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h1 className="text-2xl font-bold text-gray-900">Formulir Perjalanan Dinas</h1>
            <p className="text-sm text-gray-500 mt-1">Lengkapi data di bawah ini untuk membuat pengajuan baru.</p>
          </div>

          <PerjadinForm
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
            pegawaiList={pegawaiList}
          />
        </div>
      </div>
    </div>
  );
};

export default CreatePerjadin;
