export interface BiayaTransport {
  volume: string; // e.g. "2 Kali"
  tarif: number;  // e.g. 189000
  total: number;  // e.g. 378000
  keterangan: string; // e.g. "Transport Berangkat Ke Banjarmasin PP"
}

export interface BiayaUangHarian {
  uraian: string; // e.g. "Uang Harian" atau "Uang Harian Diklat"
  hari: number;   // e.g. 2
  tarif: number;  // e.g. 380000
  total: number;  // e.g. 760000
}

export interface BiayaPenginapan {
  malam: number;       // e.g. 2
  tarifStandar: number;// e.g. 697000
  isTanpaPenginapan: boolean; // 30%
  persen: number;      // 30 jika tanpa penginapan, 100 jika riil hotel
  total: number;       // e.g. 418200
  keterangan: string;  // "Tanpa Menginap Di Hotel Berbayar" atau "Hotel Berbayar"
}

export interface PelaksanaLuar {
  idPegawai?: string;
  nama: string;
  nip: string;
  pangkat: string;
  jabatan: string;
  tanggalLahir?: string;
  noRekening?: string;
  
  // Komponen Biaya Individual
  transport: BiayaTransport;
  uangHarian: BiayaUangHarian[];
  penginapan: BiayaPenginapan;
  biayaLain?: BiayaLainItem[];
  totalBiaya: number;
}

export interface BiayaLainItem {
  uraian: string;   // e.g. "Uang Representasi"
  volume: string;   // e.g. "1 Kali"
  tarif: number;    // e.g. 150000
  total: number;    // e.g. 150000
  keterangan: string;
}

export interface PengeluaranRiilItem {
  no: number;
  uraian: string;
  jumlah: number;
}

export interface PerjadinLuarDoc {
  id?: string;
  no: number;
  noSpt: string;
  tanggalSpt: string;
  noSpd: string;
  tanggalSpd: string;
  
  // Dasar / Surat Undangan
  suratDari: string;
  tanggalSurat: string;
  perihalSurat: string;
  
  // Tujuan & Jadwal
  maksudPerjalanan: string;
  tempatBerangkat: string;
  tempatTujuan: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  lamaHari: number;
  lamaMalam: number;
  alatAngkutan: string;
  kotaTujuan?: "Banjarmasin" | "Banjarbaru";
  pulangPergi?: boolean; // true = pulang-pergi (x2), false = sekali jalan (x1)
  
  // Pembebanan Anggaran & Penandatangan
  pembebananSkpd: string;
  kodeRekening: string;
  namaPejabatTtd: string;
  jabatanPejabatTtd: string;
  pangkatPejabatTtd: string;
  nipPejabatTtd: string;
  
  // Pelaksana & Biaya
  tanpaPenginapan: boolean; // default true/false
  pelaksanaList: PelaksanaLuar[];
  
  // Laporan
  laporan: {
    kegiatan: string;
    hasil: string;
    kesimpulanSaran: string;
    penutup: string;
  };
  
  // Pengeluaran Riil
  pengeluaranRiil: PengeluaranRiilItem[];
  
  // Bukti Files (Supabase / URL)
  files?: {
    undanganUrl?: string;
    undanganPath?: string;
    tiketUrl?: string;
    tiketPath?: string;
    hotelUrl?: string;
    hotelPath?: string;
  };
  
  status: 'Menunggu' | 'Selesai' | 'Ditolak';
  createdAt?: any;
  updatedAt?: any;
}
