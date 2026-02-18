"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, Zap, ZapOff } from 'lucide-react';
import { db, model } from "@/services/firebases";
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from "firebase/firestore";
import toast from "react-hot-toast";

const EditPerjadinPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const [pegawaiList, setPegawaiList] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoSpt, setIsAutoSpt] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    idPegawai: '',
    no: 0,
    noSpt: '',
    noSpd: '',
    nama: '',
    namaPengikut: [],
    tujuan: '',
    tanggal: '',
    suratDari: '',
    tanggalSurat: '',
    tanggalBerangkat: '',
    tanggalKembali: '',
    perihalSurat: '',
    hari: 0,
    uangHarian: 0,
    transport: 0,
    total: 0,
    untuk: '',
    keterangan: '',
    kegiatan: '',
    hasil: '',
    kesimpulan: '',
    saran: '',
  });

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
          setFormData({
            id: docSnap.id,
            idPegawai: data.idPegawai || '',
            no: data.no || 0,
            noSpt: data.noSpt || '',
            noSpd: data.noSpd || '',
            nama: data.nama || '',
            namaPengikut: data.namaPengikut || [],
            tujuan: data.tujuan || '',
            tanggal: data.tanggal || '',
            suratDari: data.suratDari || '',
            tanggalSurat: data.tanggalSurat || '',
            tanggalBerangkat: data.tanggalBerangkat || '',
            tanggalKembali: data.tanggalKembali || '',
            perihalSurat: data.perihalSurat || '',
            hari: data.hari || 0,
            uangHarian: data.uangHarian || 0,
            transport: data.transport || 0,
            total: data.total || 0,
            untuk: data.untuk || '',
            keterangan: data.keterangan || '',
            kegiatan: data.kegiatan || '',
            hasil: data.hasil || '',
            kesimpulan: data.kesimpulan || '',
            saran: data.saran || '',
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

  {/* hitung hari & total otomatis */ }
  useEffect(() => {
    const { tanggalBerangkat, tanggalKembali, uangHarian, transport } = formData;

    let computedHari = formData.hari;

    if (tanggalBerangkat && tanggalKembali) {
      const start = new Date(tanggalBerangkat);
      const end = new Date(tanggalKembali);

      const diffTime = end - start;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      computedHari = diffDays > 0 ? diffDays : 0;
    }

    const computedTotal = (Number(uangHarian) + Number(transport)) * computedHari;

    setFormData(prev => ({
      ...prev,
      hari: computedHari,
      total: computedTotal
    }));
  }, [formData.tanggalBerangkat, formData.tanggalKembali, formData.uangHarian, formData.transport]);


  {/* Fungsi untuk mengubah data di form */ }
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const newData = { ...prevData, [name]: value };

      if (name === 'no') {
        if (isAutoSpt) newData.noSpt = `800.1.11.1/${value}/ST/2026`;
        newData.noSpd = `000.2.2.4/${value}/SPD/2026`;
      }

      return newData;
    });
  };

  {/* Fungsi Submit Form */ }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mapping field names ke label yang lebih user-friendly
    const fieldLabels = {
      'no': 'Nomor',
      'noSpt': 'No. SPT',
      'noSpd': 'No. SPD',
      'tanggal': 'Tanggal Pelaksanaan SPT',
      'idPegawai': 'Nama Pegawai',
      'tujuan': 'Tujuan Lokasi',
      'suratDari': 'Surat Dari',
      'tanggalSurat': 'Tanggal Surat',
      'perihalSurat': 'Perihal',
      'untuk': 'Maksud / Untuk',
      'tanggalBerangkat': 'Tanggal Berangkat',
      'tanggalKembali': 'Tanggal Kembali',
      'kegiatan': 'Kegiatan yang Dilaksanakan',
      'hasil': 'Hasil yang Dicapai',
      'kesimpulan': 'Kesimpulan',
      'saran': 'Saran / Penutup'
    };

    // Field yang wajib diisi (kecuali Keterangan, namaPengikut, uangHarian, transport)
    const requiredFields = [
      'no', 'noSpt', 'noSpd', 'tanggal', 'idPegawai', 'tujuan',
      'suratDari', 'tanggalSurat', 'perihalSurat', 'untuk',
      'tanggalBerangkat', 'tanggalKembali',
      'kegiatan', 'hasil', 'kesimpulan', 'saran'
    ];

    // Cek field yang kosong
    const emptyFields = requiredFields.filter(field => !formData[field]);

    if (emptyFields.length > 0) {
      // Tampilkan pesan untuk setiap field yang kosong
      emptyFields.forEach(field => {
        const label = fieldLabels[field] || field;
        toast.error(`${label} belum diisi!`);
      });
      setIsSubmitting(false);
      return;
    }

    // Cek apakah nomor sudah ada di database (kecuali untuk dokumen ini sendiri)
    try {
      const q = query(collection(db, "perjadinkota"), where("no", "==", formData.no));
      const querySnapshot = await getDocs(q);
      
      let isDuplicate = false;
      querySnapshot.forEach((doc) => {
        if (doc.id !== id) {
          isDuplicate = true;
        }
      });

      if (isDuplicate) {
        toast.error(`Nomor ${formData.no} sudah digunakan oleh data lain! Harap gunakan nomor lain.`);
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("Error checking duplicate no:", error);
      toast.error("Gagal memvalidasi nomor surat.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Update data di Firestore
      const docRef = doc(db, "perjadinkota", id);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date()
      });

      toast.success("Data berhasil diperbarui!");
      setIsSubmitting(false);

      // Redirect ke halaman dashboard
      router.push('/dashbord/dashuser');
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Gagal memperbarui data. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  {/* Fungsi Generate AI */ }
  const handleGenerateAI = async () => {
    if (!formData.untuk) {
      toast.error("Mohon isi kolom 'Maksud / Untuk' terlebih dahulu sebagai dasar pembuatan laporan.");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `
      Anda adalah staf administrasi pemerintahan yang bertugas menyusun laporan resmi perjalanan dinas.

      Berdasarkan maksud/tujuan berikut:
      "${formData.untuk}"

      Susun laporan formal dan profesional dengan bahasa baku administrasi pemerintahan.

      Kembangkan isi secara logis dan realistis seolah-olah kegiatan benar-benar dilaksanakan.

      Ketentuan:
      - Tulis dalam bentuk paragraf naratif.
      - Panjang setiap bagian minimal 3 - 5 kalimat.
      - Jangan gunakan bullet point.
      - Jangan gunakan markdown.
      - Jangan tambahkan teks penjelasan apapun.

      WAJIB keluarkan HANYA JSON valid dengan struktur berikut:

      {
        "kegiatan": "",
        "hasil": "",
        "kesimpulan": "",
        "saran": ""
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Basic cleanup for JSON string
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanText);

      setFormData(prev => ({
        ...prev,
        kegiatan: data.kegiatan || prev.kegiatan,
        hasil: data.hasil || prev.hasil,
        kesimpulan: data.kesimpulan || prev.kesimpulan,
        saran: data.saran || prev.saran
      }));

      toast.success("Laporan berhasil dibuat secara otomatis!");
    } catch (err) {
      console.error("Error generating AI content:", err);
      toast.error("Terjadi kesalahan saat membuat laporan otomatis. Coba lagi nanti.");
    } finally {
      setIsGenerating(false);
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
        {/* Navigation / Header */}
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

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row 1 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor</label>
                <input
                  type="text"
                  name="no"
                  value={formData.no}
                  onChange={handleChange}
                  placeholder="001"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">No. SPT</label>
                  <button
                    type="button"
                    onClick={() => setIsAutoSpt(!isAutoSpt)}
                    className={`flex items-center text-xs font-medium px-2 py-1 rounded-md transition-colors ${isAutoSpt ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {isAutoSpt ? (
                      <><Zap size={12} className="mr-1" /> Auto</>
                    ) : (
                      <><ZapOff size={12} className="mr-1" /> Custom</>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  name="noSpt"
                  value={formData.noSpt}
                  onChange={handleChange}
                  placeholder=" contoh : 800.1.11.1/01/ST/2026"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Row 2 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">No. SPD</label>
                <input
                  type="text"
                  name="noSpd"
                  value={formData.noSpd}
                  onChange={handleChange}
                  placeholder="contoh : 000.2.2.4/01/SPD/2026"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Pelaksanaan SPT</label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Full Width Fields */}
            {/* Row 3 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Pegawai</label>
              <select
                name="idPegawai"
                value={formData.idPegawai || ""}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedPegawai = pegawaiList.find(p => p.id === selectedId);
                  setFormData(prev => ({
                    ...prev,
                    idPegawai: selectedId,
                    nama: selectedPegawai ? (selectedPegawai.nama || selectedPegawai.displayName) : ""
                  }));
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="">Pilih Pegawai</option>
                {pegawaiList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama || p.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 4 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Pengikut</label>
              <select
                value=""
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId && !formData.namaPengikut?.includes(selectedId)) {
                    setFormData(prev => ({
                      ...prev,
                      namaPengikut: [...(prev.namaPengikut || []), selectedId]
                    }));
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="">Pilih Pengikut</option>
                {pegawaiList.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={formData.namaPengikut?.includes(p.id) || p.id === formData.idPegawai}
                  >
                    {p.nama || p.displayName}
                  </option>
                ))}
              </select>

              {formData.namaPengikut?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.namaPengikut.map((id) => {
                    const pegawai = pegawaiList.find(p => p.id === id);
                    return (
                      <div key={id} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{pegawai?.nama || pegawai?.displayName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              namaPengikut: prev.namaPengikut.filter(item => item !== id)
                            }));
                          }}
                          className="text-xs font-bold text-red-500 hover:text-red-700 uppercase"
                        >
                          Hapus
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Row 5 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tujuan Lokasi</label>
              <input
                type="text"
                name="tujuan"
                value={formData.tujuan}
                onChange={handleChange}
                placeholder="contoh : Bapelitbang Kab. Tapin"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dasar Surat</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Surat Dari</label>
                  <input
                    type="text"
                    name="suratDari"
                    value={formData.suratDari}
                    onChange={handleChange}
                    placeholder="Surat dari BKAD Tapin Nomor: 900.1.15/021/BKAD-AKT/I/2026"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Surat</label>
                  <input
                    type="date"
                    name="tanggalSurat"
                    value={formData.tanggalSurat}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Perihal</label>
                  <input
                    type="text"
                    name="perihalSurat"
                    value={formData.perihalSurat}
                    onChange={handleChange}
                    placeholder="Entry Jurnal"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>


            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Maksud / Untuk</label>
              <textarea
                name="untuk"
                value={formData.untuk}
                onChange={handleChange}
                rows="2"
                placeholder="Tujuan utama perjalanan dinas buat sedetail detailnya"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              ></textarea>
            </div>

            {/* Tanggal Berangkat dan Kembali */}
            <div className="space-y-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Berangkat dan Kembali
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Tanggal Berangkat */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Berangkat
                  </label>
                  <input
                    type="date"
                    name="tanggalBerangkat"
                    value={formData.tanggalBerangkat}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Tanggal Kembali */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Kembali
                  </label>
                  <input
                    type="date"
                    name="tanggalKembali"
                    value={formData.tanggalKembali}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Hari (Auto) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jumlah Hari
                  </label>
                  <input
                    type="number"
                    value={formData.hari}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Row 6 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Uang Harian</label>
              <input
                type="number"
                name="uangHarian"
                value={formData.uangHarian}
                onChange={handleChange}
                placeholder="Masukkan jumlah uang harian"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Row 7 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Transportasi</label>
              <input
                type="number"
                name="transport"
                value={formData.transport}
                onChange={handleChange}
                placeholder="Masukkan jumlah transportasi"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>


            {/* Row 8 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total</label>
              <input
                type="number"
                name="total"
                value={formData.total}
                readOnly
                placeholder="Total otomatis"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed outline-none transition-all resize-none"
              />
            </div>

            {/* Row 9 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan</label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleChange}
                rows="4"
                placeholder="Jelaskan Keterangan yang akan di buat untuk rincian biaya"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              ></textarea>
            </div>

            {/* AI Generation Section */}
            <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Isi Laporan Otomatis</h3>
                  <p className="text-sm text-gray-500">Gunakan AI untuk mengisi detail laporan kegiatan secara otomatis. </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="mr-2" />
                      Generate AI
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kegiatan yang Dilaksanakan</label>
                  <textarea
                    name="kegiatan"
                    value={formData.kegiatan}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Deskripsi kegiatan..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hasil yang Dicapai</label>
                  <textarea
                    name="hasil"
                    value={formData.hasil}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Hasil kegiatan..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kesimpulan</label>
                  <textarea
                    name="kesimpulan"
                    value={formData.kesimpulan}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Kesimpulan..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Saran / Penutup</label>
                  <textarea
                    name="saran"
                    value={formData.saran}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Saran dan penutup..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Memperbarui...
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Perbarui Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPerjadinPage;