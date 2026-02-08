"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, ChevronRight, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/services/firebases";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";

export default function DashuserPage() {
  const [openPerjadin, setOpenPerjadin] = useState(false);
  const [openPerjadinLuar, setOpenPerjadinLuar] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // State to manage active content in main area
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

 
  {/* Fungsi Dropdown profil */}
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow h-screen p-4 text-gray-800 flex flex-col">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full" />
          <div>
            <div className="font-bold text-gray-900">Dashboard</div>
            <div className="text-sm text-gray-500">User</div>
          </div>
        </div>

        <nav className="space-y-3 text-sm mb-4">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-100 ${activeTab === 'overview' ? 'bg-gray-100 font-semibold' : 'text-gray-800'}`}
          >
            Overview
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenPerjadin(!openPerjadin)}
              aria-expanded={openPerjadin}
              className="w-full text-left flex items-center justify-between gap-3 p-2 rounded hover:bg-gray-100 text-gray-700 focus:outline-none focus:ring-0"
            >
              <span>Perjadin Dalam Kota</span>
              <span className="text-sm">{openPerjadin ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
            </button>

            {openPerjadin && (
              <ul className="mt-2 bg-white border border-transparent rounded shadow-sm">
                <li 
                  onClick={() => setActiveTab("berkas-konsul")}
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm focus:outline-none ${activeTab === 'berkas-konsul' ? 'bg-gray-100 font-semibold text-blue-600' : ''}`}
                >
                  Perjadin Berkas atau Konsul
                </li>
                <li 
                  onClick={() => setActiveTab("perjadin-umum-dalam-kota")}
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm focus:outline-none ${activeTab === 'perjadin-umum-dalam-kota' ? 'bg-gray-100 font-semibold text-blue-600' : ''}`}
                >
                  Perjadin Umum Dalam Kota
                </li>
              </ul>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenPerjadinLuar(!openPerjadinLuar)}
              aria-expanded={openPerjadinLuar}
              className="w-full text-left flex items-center justify-between gap-3 p-2 rounded hover:bg-gray-100 text-gray-900 focus:outline-none focus:ring-0"
            >
              <span>Perjadin Luar Kota</span>
              <span className="text-sm">{openPerjadinLuar ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
            </button>

            {openPerjadinLuar && (
              <ul className="mt-2 bg-white border border-transparent rounded shadow-sm">
                <li className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm focus:outline-none">Perjadin Luar Dalam Provinsi</li>
                <li className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm focus:outline-none">Perjadin Luar Antar Provinsi</li>
              </ul>
            )}
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 -mx-4 px-4">
          <a className="block w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-sm text-gray-700">Settings</a>
          <a className="block w-full text-left flex items-center gap-3 p-2 rounded hover:bg-gray-100 text-sm text-gray-700">Help & Support</a>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white flex items-center px-6 shadow-sm">
          <div className="flex-1">
            {/* <input placeholder="Search or type a command" className="w-1/3 border rounded px-3 py-2 text-sm" /> */}
          </div>
          <div ref={profileRef} className="flex items-center gap-4 relative">
            <button className="p-2 rounded-full text-black hover:bg-blue-600 hover:text-white"><Bell size={20} /></button>

            {/* Profile dropdown */}
            <button
              type="button"
              onClick={() => setOpenProfile(!openProfile)}
              className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center focus:outline-none"
              aria-expanded={openProfile}
            >
              <User size={16} className="text-white" />
            </button>

            {openProfile && (
              <div className="absolute right-0 mt-12 w-56 bg-white rounded shadow z-20 border border-gray-100 focus:outline-none">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">U</div>
                  <div>
                    <div className="font-semibold text-black">{user?.displayName || "Nama Pengguna"}</div>
                    <div className="text-sm text-gray-500">{user?.email || "user@example.com"}</div>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <button
                    onClick={async () => {
                      try {
                        await signOut(auth);
                        router.push("/login");
                      } catch (err) {
                        console.error("Logout gagal", err);
                        toast.error("Logout Gagal");
                      }
                    }}
                    className="w-full text-left text-red-600 font-semibold hover:bg-red-50 p-2 rounded focus:outline-none flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === "overview" && (
              <div className="col-span-1">
                <div className="p-9 bg-white rounded shadow h-20 flex items-center justify-center text-gray-800">
                  <p>Selamat Datang</p>
                </div>
              </div>
            )}

            {/* Content for "Perjadin Berkas atau Konsul" */}
            {activeTab === "berkas-konsul" && (
              <div className="bg-white p-6 rounded shadow text-gray-800">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold text-gray-900">List Data Perjadin Berkas atau Konsul</h2>
                  <button 
                    onClick={() => router.push("/dashbord/dashuser/Perjadin/create")}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition shadow-sm font-medium"
                  >
                    <span className="text-lg">+</span> Tambah Perjadin Baru
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">No</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Tujuan</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Tanggal</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Keperluan</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="6" className="px-4 py-10 text-center text-gray-500 italic border-b">
                          Belum ada data perjadin. Silahkan tambah data baru.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Content for "Perjadin Umum Dalam Kota" */}
            {activeTab === "perjadin-umum-dalam-kota" && (
              <div className="bg-white p-6 rounded shadow text-gray-800">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold text-gray-900">List Data Perjadin Umum Dalam Kota</h2>
                  <button 
                    onClick={() => router.push("/dashbord/dashuser/Perjadin/create")}
                    className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition shadow-sm font-medium"
                  >
                    <span className="text-lg">+</span> Tambah Perjadin Baru
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">No</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">No SPT</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Tujuan</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Tanggal</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Keperluan</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 border-b text-sm font-semibold text-gray-600 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="6" className="px-4 py-10 text-center text-gray-500 italic border-b">
                          Belum ada data perjadin. Silahkan tambah data baru.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
