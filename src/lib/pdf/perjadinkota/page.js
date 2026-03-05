import { jsPDF } from "jspdf";
import { db } from "@/services/firebases";
import { doc, getDoc } from "firebase/firestore";
import { drawSPTLayout } from "./spt";
import { drawSPDLayout } from "./spd";
import { drawRincianLayout } from "./rincian";
import { drawHasilLayout } from "./hasil";

/**
 * Ambil data pegawai dari Firestore berdasarkan ID
 */
async function fetchPegawai(id) {
    try {
        const snap = await getDoc(doc(db, "pegawai", id));
        if (snap.exists()) return { id: snap.id, ...snap.data() };
        return null;
    } catch {
        return null;
    }
}

/**
 * Generate gabungan SPT + SPD + Rincian dalam 1 PDF
 * @param {Object} data - Perjadin data dari Firebase
 */
export async function generateSPPD(data) {
    // Fetch pegawai utama
    const pegawaiUtama = data.idPegawai ? await fetchPegawai(data.idPegawai) : null;

    // Fetch pegawai pengikut
    const pengikutList = [];
    if (data.namaPengikut && data.namaPengikut.length > 0) {
        for (const id of data.namaPengikut) {
            const p = await fetchPegawai(id);
            if (p) pengikutList.push(p);
        }
    }

    // Buat PDF dengan ukuran F4 (215 x 330 mm)
    const pdfDoc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [215, 330],
    });

    // ========== HALAMAN 1: SPT ==========
    await drawSPTLayout(pdfDoc, data, pegawaiUtama, pengikutList);

    // ========== HALAMAN 2: SPD ==========
    pdfDoc.addPage([215, 330]);
    await drawSPDLayout(pdfDoc, data, pegawaiUtama, pengikutList);

    // ========== HALAMAN 3: Rincian (Utama) ==========
    pdfDoc.addPage([215, 330]);
    await drawRincianLayout(pdfDoc, data, pegawaiUtama, [pegawaiUtama], true);

    // ========== HALAMAN 4+: Rincian (Pengikut) ==========
    if (pengikutList.length > 0) {
        for (const p of pengikutList) {
            pdfDoc.addPage([215, 330]);
            // Generate rincian untuk setiap pengikut secara individual
            await drawRincianLayout(pdfDoc, data, p, [p], false);
        }
    }

    // ========== HALAMAN HASIL PERJALANAN DINAS (Utama) ==========
    pdfDoc.addPage([215, 330]);
    await drawHasilLayout(pdfDoc, data, pegawaiUtama);

    // ========== HALAMAN HASIL PERJALANAN DINAS (Pengikut) ==========
    if (pengikutList.length > 0) {
        for (const p of pengikutList) {
            pdfDoc.addPage([215, 330]);
            await drawHasilLayout(pdfDoc, data, p);
        }
    }

    // ========== OUTPUT ==========
    const pdfBlob = pdfDoc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
}
