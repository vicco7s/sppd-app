"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebases";
import toast from "react-hot-toast";
import KwitansiModal from "@/components/KwitansiModal";
import KwitansiTable from "@/components/KwitansiTable";

export default function KwitansiSection({ isAdmin = false }) {
  const [kwitansiList, setKwitansiList] = useState([]);
  const [pegawaiList, setPegawaiList] = useState([]);
  const [kodeRekeningOptions, setKodeRekeningOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingKwitansi, setEditingKwitansi] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchList = async (collectionName, setState) => {
    try {
      // Use "nama" for pegawai, and "kodeRekening" for koderekening as they have different field names
      const orderField = collectionName === "pegawai" ? "nama" : "kodeRekening";
      const q = query(collection(db, collectionName), orderBy(orderField, "asc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setState(data);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      // Fallback if the field doesn't exist for ordering
      try {
        const q = query(collection(db, collectionName));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setState(data);
      } catch (innerError) {
        setState([]);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchList("pegawai", setPegawaiList),
        fetchList("koderekening", setKodeRekeningOptions),
      ]);

      const kwitansiQuery = query(collection(db, "kwitansi"), orderBy("createdAt", "desc"));
      const kwitansiSnap = await getDocs(kwitansiQuery);
      const kwitansiData = kwitansiSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setKwitansiList(kwitansiData);
    } catch (error) {
      console.error("Error fetching kwitansi data:", error);
      toast.error("Gagal memuat data kwitansi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKwitansi = async (formData) => {
    setIsSaving(true);

    const requiredFields = [
      "program",
      "kegiatan",
      "subKegiatan",
      "kodeRekening",
      "namaRekeningBelanja",
      "namaRekening",
      "nomorRekening",
      "namaBank",
      "nominal",
      "tanggal",
      "keperluan"
    ];

    const missing = requiredFields.filter((field) => !formData[field]);
    if (missing.length > 0) {
      console.warn("Missing fields:", missing);
      toast.error(`Harap isi semua field wajib: ${missing.join(", ")}`);
      setIsSaving(false);
      return;
    }

    try {
      const isEdit = Boolean(formData.id);
      
      // Handle saving new account option if it's a custom/manual entry
      let accountId = formData.accountOptionId;
      if (!accountId && formData.kodeRekening) {
        // Check if this kodeRekening already exists in our options
        const existingOption = kodeRekeningOptions.find(
          (opt) => opt.kodeRekening === formData.kodeRekening
        );

        if (existingOption) {
          accountId = existingOption.id;
        } else {
          // Save as new account option
          const newAccountRef = doc(collection(db, "koderekening"));
          const accountPayload = {
            id: newAccountRef.id,
            program: formData.program,
            kegiatan: formData.kegiatan,
            subKegiatan: formData.subKegiatan,
            kodeRekening: formData.kodeRekening,
            namaRekeningBelanja: formData.namaRekeningBelanja,
            createdAt: serverTimestamp(),
          };
          await setDoc(newAccountRef, accountPayload);
          accountId = newAccountRef.id;
          
          // Update local state so it appears in the list next time
          setKodeRekeningOptions((prev) => [...prev, accountPayload]);
          toast.success("Kode rekening baru berhasil ditambahkan ke referensi.");
        }
      }

      const docRef = isEdit ? doc(db, "kwitansi", formData.id) : doc(collection(db, "kwitansi"));
      
      const payload = {
        ...formData,
        id: docRef.id,
        accountOptionId: accountId || formData.accountOptionId,
        nominal: Number(formData.nominal) || 0,
        updatedAt: serverTimestamp(),
      };

      if (!isEdit) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(docRef, payload, { merge: true });
      
      if (isEdit) {
        setKwitansiList((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
        toast.success("Kwitansi berhasil diperbarui.");
      } else {
        setKwitansiList((prev) => [payload, ...prev]);
        toast.success("Kwitansi berhasil disimpan.");
      }

      // Always close modal and clear state after success
      setEditingKwitansi(null);
      setShowForm(false);
      
      return true;
    } catch (error) {
      console.error("Error saving kwitansi:", error);
      toast.error("Gagal menyimpan kwitansi.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKwitansi = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kwitansi ini?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "kwitansi", id));
      setKwitansiList((prev) => prev.filter((item) => item.id !== id));
      if (editingKwitansi?.id === id) {
        setEditingKwitansi(null);
        setShowForm(false);
      }
      toast.success("Kwitansi berhasil dihapus.");
    } catch (error) {
      console.error("Error deleting kwitansi:", error);
      toast.error("Gagal menghapus kwitansi.");
    }
  };

  const handleEditKwitansi = (kwitansi) => {
    setEditingKwitansi(kwitansi);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingKwitansi(null);
    setShowForm(false);
  };


  return (
    <div className="bg-white p-6 rounded shadow text-gray-800">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Manajemen Kwitansi</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola seluruh data kwitansi pengeluaran perjalanan dinas secara terpusat.</p>
      </div>

      <KwitansiModal
        isOpen={showForm}
        onClose={handleCancelEdit}
        pegawaiList={pegawaiList}
        kodeRekeningOptions={kodeRekeningOptions}
        onSubmit={handleSaveKwitansi}
        isSubmitting={isSaving}
        editingData={editingKwitansi}
        isAdmin={isAdmin}
      />

      <div>
        <KwitansiTable
          items={kwitansiList}
          loading={loading}
          onDelete={handleDeleteKwitansi}
          onEdit={handleEditKwitansi}
          showForm={showForm}
          onToggleForm={() => {
            if (showForm && editingKwitansi) {
              setEditingKwitansi(null);
            }
            setShowForm((prev) => !prev);
          }}
        />
      </div>
    </div>
  );
}
