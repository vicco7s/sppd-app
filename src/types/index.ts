export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  pangkat: string;
  tgllahir?: any;
  createdAt?: any;
}

export interface User {
  id: string;
  uid?: string;
  email: string;
  role: "admin" | "user" | string;
  status: "active" | "inactive" | string;
  idPegawai: string;
  createdAt?: any;
}
