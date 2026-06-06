import { Timestamp } from 'firebase/firestore';

export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  pangkat: string;
  rek?: string;
  bank?: string;
  tgllahir?: Timestamp | Date | string | null;
  createdAt?: Timestamp | Date | null;
  [key: string]: unknown; // Allow additional fields from Firebase
}

export interface User {
  id: string;
  uid?: string;
  email: string;
  role: "admin" | "user" | string;
  status: "active" | "inactive" | string;
  idPegawai: string;
  createdAt?: Timestamp | Date | null;
  [key: string]: unknown; // Allow additional fields from Firebase
}

export type PegawaiFormData = Omit<Pegawai, 'id' | 'createdAt'>;
export type UserFormData = Omit<User, 'id' | 'createdAt'>;
