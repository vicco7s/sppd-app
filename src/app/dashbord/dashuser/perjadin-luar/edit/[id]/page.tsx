"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { auth, db } from "@/services/firebases";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Pegawai } from "@/types";
import { PerjadinLuarFormData } from "@/lib/validations/perjadinLuarSchema";
import { uploadFile } from "@/lib/supabase/uploadFile";
import { createSignedUrl } from "@/lib/supabase/createSignedUrl";
import PerjadinLuarForm from "@/components/perjadin-luar/PerjadinLuarForm";

export default function EditPerjadinLuarPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [initialData, setInitialData] = useState<any>(null);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pegSnap, docSnap] = await Promise.all([
          getDocs(collection(db, "pegawai")),
          getDoc(doc(db, "perjadin_luar_provinsi", id)),
        ]);

        const pegData = pegSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Pegawai));
        setPegawaiList(pegData);

        if (docSnap.exists()) {
          setInitialData(docSnap.data());
        } else {
          toast.error("Data Perjadin Luar tidak ditemukan.");
          router.back();
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        toast.error("Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router]);

  const handleUpdate = async (
    formData: PerjadinLuarFormData,
    files: { undanganFile?: File; tiketFile?: File; hotelFile?: File }
  ) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Memperbarui data Perjadin Luar...");

    try {
      const docRef = doc(db, "perjadin_luar_provinsi", id);
      const updatedFiles = { ...(initialData?.files || {}) };

      if (files.undanganFile) {
        try {
          const uploaded = await uploadFile(files.undanganFile, "surat-undangan");
          updatedFiles.undanganUrl = await createSignedUrl(uploaded.path);
          updatedFiles.undanganPath = uploaded.path;
        } catch (e) {
          console.error(e);
        }
      }

      if (files.tiketFile) {
        try {
          const uploaded = await uploadFile(files.tiketFile, "tiket-perjadin");
          updatedFiles.tiketUrl = await createSignedUrl(uploaded.path);
          updatedFiles.tiketPath = uploaded.path;
        } catch (e) {
          console.error(e);
        }
      }

      if (files.hotelFile) {
        try {
          const uploaded = await uploadFile(files.hotelFile, "bukti-hotel");
          updatedFiles.hotelUrl = await createSignedUrl(uploaded.path);
          updatedFiles.hotelPath = uploaded.path;
        } catch (e) {
          console.error(e);
        }
      }

      await updateDoc(docRef, {
        ...formData,
        files: updatedFiles,
        updatedAt: new Date(),
      });

      toast.success("Data Perjadin Luar berhasil diperbarui!", { id: toastId });
      router.back();
    } catch (err: any) {
      console.error("Error updating:", err);
      toast.error(err?.message || "Gagal memperbarui data.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 gap-2">
        <Loader2 size={20} className="animate-spin text-blue-600" />
        <span className="text-sm font-medium">Memuat data pengajuan...</span>
      </div>
    );
  }

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
              Edit Perjalanan Dinas Luar Daerah (Dalam Provinsi)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Perbarui rincian SPT, SPPD, daftar pelaksana, atau draf laporan hasil kegiatan.
            </p>
          </div>

          <div className="p-6">
            <PerjadinLuarForm
              initialData={initialData}
              pegawaiList={pegawaiList}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
              isEdit={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
