"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import PerjadinForm from '@/components/PerjadinForm';
import { auth, db } from "@/services/firebases";

const EditPerjadinPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [pegawaiList, setPegawaiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState(null);
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

  // Ambil data perjadin berdasarkan ID
  useEffect(() => {
    const fetchPerjadinData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const docRef = doc(db, "perjadinkota", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Jika status bukan Menunggu (atau undefined), jangan izinkan edit
          if (data.status && data.status !== 'Menunggu') {
            toast.error("Data sudah diproses Admin dan tidak dapat diedit kembali.");
            router.replace('/dashbord/dashuser');
            return;
          }
          setInitialData({
            id: docSnap.id,
            ...data
          });
        } else {
          toast.error("Data tidak ditemukan!");
          router.push('/dashbord/dashuser');
        }
      } catch (error) {
        console.error("Error fetching perjadin data:", error);
        toast.error("Gagal memuat data!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerjadinData();
  }, [id, router]);

  const handleUpdate = async (formData) => {
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
      // Check for duplicate number (excluding this document)
      const q = query(collection(db, "perjadinkota"), where("no", "==", formData.no));
      const querySnapshot = await getDocs(q);

      let isDuplicate = false;
      querySnapshot.forEach((doc) => {
        if (doc.id !== id) isDuplicate = true;
      });

      if (isDuplicate) {
        toast.error(`Nomor ${formData.no} sudah digunakan oleh data lain!`);
        setIsSubmitting(false);
        return;
      }

      const docRef = doc(db, "perjadinkota", id);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date()
      });

      // Create Notification for Update
      try {
        await addDoc(collection(db, "notifications"), {
          title: "Update Perjadin",
          message: `Data Perjadin ke ${formData.tujuan} telah diperbarui oleh ${userProfile?.name || auth.currentUser?.displayName || 'User'}.`,
          type: "update",
          userName: userProfile?.name || auth.currentUser?.displayName || "User",
          userEmail: auth.currentUser?.email || "-",
          userUid: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
          isRead: false
        });
      } catch (notifErr) {
        console.error("Failed to create update notification:", notifErr);
      }

      toast.success("Data berhasil diperbarui!");
      router.push('/dashbord/dashuser');
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Gagal memperbarui data.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Perjalanan Dinas</h1>
            <p className="text-sm text-gray-500 mt-1">Perbarui data perjalanan dinas di bawah ini.</p>
          </div>

          <PerjadinForm
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
            pegawaiList={pegawaiList}
            initialData={initialData}
            isEdit={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EditPerjadinPage;