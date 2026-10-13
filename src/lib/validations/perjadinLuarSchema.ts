import { z } from "zod";

export const pelaksanaSchema = z.object({
  idPegawai: z.string().optional(),
  nama: z.string().min(1, "Nama pelaksana wajib diisi"),
  nip: z.string().default("-"),
  pangkat: z.string().default("-"),
  jabatan: z.string().default("-"),
  tanggalLahir: z.string().optional().default("-"),
  noRekening: z.string().optional().default("-"),
  
  transport: z.object({
    volume: z.string().default("2 Kali"),
    tarif: z.coerce.number().default(189000),
    total: z.coerce.number().default(378000),
    keterangan: z.string().default("Transport Berangkat Ke"),
  }),
  
  uangHarian: z.array(z.object({
    uraian: z.string().default("Uang Harian"),
    hari: z.coerce.number().default(2),
    tarif: z.coerce.number().default(380000),
    total: z.coerce.number().default(760000),
  })).default([
    { uraian: "Uang Harian", hari: 2, tarif: 380000, total: 760000 },
    { uraian: "Uang Harian (1/4)", hari: 1, tarif: 95000, total: 95000 }
  ]),
  
  penginapan: z.object({
    malam: z.coerce.number().default(2),
    tarifStandar: z.coerce.number().default(697000),
    isTanpaPenginapan: z.boolean().default(true),
    persen: z.coerce.number().default(30),
    total: z.coerce.number().default(418200),
    keterangan: z.string().default("Tanpa Menginap Di Hotel Berbayar"),
  }),

  biayaLain: z.array(z.object({
    uraian: z.string().default("Biaya Lain"),
    volume: z.string().default("1 Kali"),
    tarif: z.coerce.number().default(0),
    total: z.coerce.number().default(0),
    keterangan: z.string().default("-"),
  })).default([]),

  totalBiaya: z.coerce.number().default(1651200),
});

export const perjadinLuarSchema = z.object({
  no: z.coerce.number().min(1, "Nomor urut wajib diisi"),
  noSpt: z.string().min(1, "Nomor Surat Tugas wajib diisi"),
  tanggalSpt: z.string().min(1, "Tanggal Surat Tugas wajib diisi"),
  noSpd: z.string().min(1, "Nomor SPPD wajib diisi"),
  tanggalSpd: z.string().min(1, "Tanggal SPPD wajib diisi"),
  
  suratDari: z.string().min(1, "Dasar surat pengirim wajib diisi"),
  tanggalSurat: z.string().min(1, "Tanggal surat pengirim wajib diisi"),
  perihalSurat: z.string().min(1, "Perihal surat wajib diisi"),
  
  maksudPerjalanan: z.string().min(1, "Maksud perjalanan dinas wajib diisi"),
  tempatBerangkat: z.string().default("Kecamatan Salam Babaris"),
  tempatTujuan: z.string().min(1, "Tempat tujuan wajib diisi"),
  tanggalBerangkat: z.string().min(1, "Tanggal berangkat wajib diisi"),
  tanggalKembali: z.string().min(1, "Tanggal kembali wajib diisi"),
  lamaHari: z.coerce.number().min(1).default(3),
  lamaMalam: z.coerce.number().min(0).default(2),
  alatAngkutan: z.string().default("Kendaraan Umum"),
  kotaTujuan: z.enum(["Banjarmasin", "Banjarbaru"]).default("Banjarmasin"),
  pulangPergi: z.boolean().default(true),
  
  pembebananSkpd: z.string().default("Kantor Kecamatan Salam Babaris"),
  kodeRekening: z.string().default("5.1.02.04.01.0001"),
  namaPejabatTtd: z.string().default("Kus Henratno, S.Sos"),
  jabatanPejabatTtd: z.string().default("Camat Salam Babaris"),
  pangkatPejabatTtd: z.string().default("Penata Tingkat I (III/d)"),
  nipPejabatTtd: z.string().default("19770413 201001 1 011"),
  
  tanpaPenginapan: z.boolean().default(true),
  
  pelaksanaList: z.array(pelaksanaSchema).min(1, "Minimal harus ada 1 pelaksana perjalanan dinas"),
  
  laporan: z.object({
    kegiatan: z.string().default("-"),
    hasil: z.string().default("-"),
    kesimpulanSaran: z.string().default("-"),
    penutup: z.string().default("Demikian laporan perjalanan dinas ini disusun sebagai bentuk pertanggungjawaban atas pelaksanaan tugas. Diharapkan hasil dari kegiatan ini dapat diterapkan dalam pelaksanaan tugas sehari-hari guna mendukung tata kelola pemerintahan yang tertib, efektif, transparan, dan akuntabel sesuai dengan ketentuan peraturan perundang-undangan yang berlaku."),
  }),
  
  pengeluaranRiil: z.array(z.object({
    no: z.coerce.number(),
    uraian: z.string(),
    jumlah: z.coerce.number(),
  })).default([
    { no: 1, uraian: "PP Salam Babaris - Banjarmasin (Rp. 378.000,-)", jumlah: 378000 }
  ]),
  
  status: z.enum(["Menunggu", "Selesai", "Ditolak"]).default("Menunggu"),
});

export type PerjadinLuarFormData = z.infer<typeof perjadinLuarSchema>;
