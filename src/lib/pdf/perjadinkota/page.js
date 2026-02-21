import { jsPDF } from "jspdf";
import { db } from "@/services/firebases";
import { doc, getDoc } from "firebase/firestore";
import { drawSPTLayout } from "./spt";
import { drawSPDLayout } from "./spd";

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
 * Generate gabungan SPT + SPD dalam 1 PDF (2 halaman)
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

    // ========== OUTPUT ==========
    const pdfBlob = pdfDoc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
}
