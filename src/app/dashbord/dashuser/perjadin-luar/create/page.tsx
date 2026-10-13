"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth, db } from "@/services/firebases";
import { collection, getDocs, doc, setDoc, query, where, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Pegawai } from "@/types";
import { PerjadinLuarFormData } from "@/lib/validations/perjadinLuarSchema";
import { uploadFile } from "@/lib/supabase/uploadFile";
import { createSignedUrl } from "@/lib/supabase/createSignedUrl";
import PerjadinLuarForm from "@/components/perjadin-luar/PerjadinLuarForm";

export default function CreatePerjadinLuarPage() {
  const router = useRouter();
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchPegawai = async () => {
      try {
        const snap = await getDocs(collection(db, "pegawai"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pegawai));
        setPegawaiList(data);
      } catch (err) {
        console.error("Gagal mengambil data pegawai:", err);
      }
    };

    const fetchUserProfile = async () => {
      const u = auth.currentUser;
      if (u) {
        try {
          const docSnap = await getDoc(doc(db, "user", u.uid));
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchPegawai();
    fetchUserProfile();
  }, []);

  const handleSave = async (
    formData: PerjadinLuarFormData,
    files: { undanganFile?: File; tiketFile?: File; hotelFile?: File }
  ) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Menyimpan data Perjadin Luar...");

    try {
      // Cek nomor urut duplikat
      const q = query(collection(db, "perjadin_luar_provinsi"), where("no", "==", formData.no));
      const existSnap = await getDocs(q);
      if (!existSnap.empty) {
        toast.error(`Nomor urut ${formData.no} sudah digunakan!`, { id: toastId });
        setIsSubmitting(false);
        return;
      }

      let filesMeta: any = {};

      if (files.undanganFile) {
        try {
          const uploaded = await uploadFile(files.undanganFile, "surat-undangan");
          const signedUrl = await createSignedUrl(uploaded.path);
          filesMeta.undanganUrl = signedUrl;
          filesMeta.undanganPath = uploaded.path;
        } catch (e) {
          console.error("Gagal upload undangan:", e);
        }
      }

      if (files.tiketFile) {
        try {
          const uploaded = await uploadFile(files.tiketFile, "tiket-perjadin");
          const signedUrl = await createSignedUrl(uploaded.path);
          filesMeta.tiketUrl = signedUrl;
          filesMeta.tiketPath = uploaded.path;
        } catch (e) {
          console.error("Gagal upload tiket:", e);
        }
      }

      if (files.hotelFile) {
        try {
          const uploaded = await uploadFile(files.hotelFile, "bukti-hotel");
          const signedUrl = await createSignedUrl(uploaded.path);
          filesMeta.hotelUrl = signedUrl;
          filesMeta.hotelPath = uploaded.path;
        } catch (e) {
          console.error("Gagal upload hotel:", e);
        }
      }

      const newDocRef = doc(collection(db, "perjadin_luar_provinsi"));
      await setDoc(newDocRef, {
        ...formData,
        id: newDocRef.id,
        files: filesMeta,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Tambah notifikasi aktivitas
      try {
        const creatorName =
          userProfile?.name || auth.currentUser?.displayName || auth.currentUser?.email || "User";
        await addDoc(collection(db, "notifications"), {
          title: "Perjadin Luar Baru",
          message: `Pengajuan Perjadin Luar ke ${formData.tempatTujuan} dibuat oleh ${creatorName}.`,
          type: "create",
          userName: creatorName,
          userEmail: auth.currentUser?.email || "-",
          userUid: auth.currentUser?.uid,
          createdAt: serverTimestamp(),
          isRead: false,
        });
      } catch (notifErr) {
        console.error("Gagal membuat notifikasi:", notifErr);
      }

      toast.success("Pengajuan Perjadin Luar berhasil disimpan!", { id: toastId });
      router.back();
    } catch (err: any) {
      console.error("Error saving perjadin luar:", err);
      toast.error(err?.message || "Gagal menyimpan pengajuan.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 transition group"
        >
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Formulir Perjalanan Dinas Luar Daerah (Dalam Provinsi)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Template PDF otomatis mengacu pada standar resmi Kecamatan Salam Babaris (Kabupaten Tapin) sesuai format yang ditentukan.
            </p>
          </div>

          <div className="p-6">
            <PerjadinLuarForm
              pegawaiList={pegawaiList}
              onSubmit={handleSave}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
