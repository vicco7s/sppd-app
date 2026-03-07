import { jsPDF } from "jspdf";
import { db } from "@/services/firebases";
import { doc, getDoc } from "firebase/firestore";
import { formatTanggal } from "./spt";

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
 * Generate Nota Dinas PDF
 * @param {Object} data - Perjadin data from Firebase
 */
export async function generateNotaDinas(data) {
    const pegawaiUtama = data.idPegawai ? await fetchPegawai(data.idPegawai) : null;
    const pengikutList = [];
    if (data.namaPengikut && data.namaPengikut.length > 0) {
        for (const id of data.namaPengikut) {
            const p = await fetchPegawai(id);
            if (p) pengikutList.push(p);
        }
    }

    const pdfDoc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [215, 330], // F4 format
    });

    await drawNotaLayout(pdfDoc, data, pegawaiUtama, pengikutList);

    const pdfBlob = pdfDoc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
}

/**
 * Logic untuk menggambar layout Nota Dinas
 */
export async function drawNotaLayout(pdfDoc, data, pegawaiUtama, pengikutList) {
    const pageWidth = 215;
    const marginLeft = 25;
    const marginRight = 25;
    const centerX = pageWidth / 2;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let y = 12;

    // ========== HEADER (KOP SURAT) ==========
    try {
        const logoUrl = "/assets/logo/Lambang_Kabupaten_Tapin.png";
        pdfDoc.addImage(logoUrl, "PNG", marginLeft, y - 3, 16, 18);
    } catch (e) {
        console.error("Gagal memuat logo:", e);
    }

    pdfDoc.setFontSize(14);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("PEMERINTAH KABUPATEN TAPIN", centerX, y + 3, { align: "center" });

    pdfDoc.setFontSize(18);
    pdfDoc.text("KECAMATAN SALAM BABARIS", centerX, y + 9, { align: "center" });

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("Jalan Transmigrasi No. 02 Desa Salam Babaris Kode Pos : 71182", centerX, y + 13, { align: "center" });

    y += 16;
    pdfDoc.setLineWidth(0.8);
    pdfDoc.line(marginLeft, y, pageWidth - marginRight, y);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.line(marginLeft, y + 1.2, pageWidth - marginRight, y + 1.2);

    y += 10;

    // ========== JUDUL NOTA DINAS ==========
    pdfDoc.setFontSize(12);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("NOTA DINAS", centerX, y, { align: "center" });
    const titleWidth = pdfDoc.getTextWidth("NOTA DINAS");
    pdfDoc.line(centerX - titleWidth / 2, y + 1, centerX + titleWidth / 2, y + 1);

    y += 12;

    // ========== METADATA (Kepada, Dari, Tanggal, Perihal) ==========
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");

    const labelX = marginLeft;
    const colonX = marginLeft + 25;
    const valueX = colonX + 3;

    // Kepada
    pdfDoc.text("Kepada", labelX, y);
    pdfDoc.text(":", colonX, y);
    pdfDoc.text("Camat Salam Babaris", valueX, y);
    y += 6;

    // Dari
    pdfDoc.text("Dari", labelX, y);
    pdfDoc.text(":", colonX, y);
    pdfDoc.text(data.dari || "-", valueX, y);
    y += 6;

    // Tanggal
    pdfDoc.text("Tanggal", labelX, y);
    pdfDoc.text(":", colonX, y);
    pdfDoc.text(formatTanggal(data.tanggal), valueX, y);
    y += 6;

    // Perihal
    pdfDoc.text("Perihal", labelX, y);
    pdfDoc.text(":", colonX, y);
    const perihalLines = pdfDoc.splitTextToSize(data.perihalSurat || "-", pageWidth - marginRight - valueX);
    pdfDoc.text(perihalLines, valueX, y);
    y += perihalLines.length * 5 + 10;

    // ========== ISI NOTA DINAS ==========
    // ========== ISI NOTA DINAS ==========
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.setFontSize(11); // Ukuran font sedikit lebih besar agar isi penuh
    const isiText = data.isinota || "-";
    const paragraphs = isiText.split('\n');

    paragraphs.forEach(para => {
        const trimmed = para.trim();
        if (!trimmed) {
            y += 6;
            return;
        }
        // Kalimat pertama menjorok kedalam (indentasi)
        const textToDraw = "            " + trimmed;
        pdfDoc.text(textToDraw, marginLeft, y, { align: 'justify', maxWidth: contentWidth });
        const lineCount = pdfDoc.splitTextToSize(textToDraw, contentWidth).length;
        y += lineCount * 7.5; // Jarak antar baris lebih berjauhan
    });

    y += 2;

    const dasarNotaStr = "            " + `Mendasari hal tersebut diatas maka kami bermaksud untuk mengajukan permohonan perjalanan dinas ${data.perihalSurat || "-"} ke ${data.tujuan || "-"}.`;
    pdfDoc.text(dasarNotaStr, marginLeft, y, { align: 'justify', maxWidth: contentWidth });
    const dasarLineCount = pdfDoc.splitTextToSize(dasarNotaStr, contentWidth).length;
    y += dasarLineCount * 7.5 + 8;

    // ========== PENUTUP ==========
    const penutup = "            " + "Demikian disampaikan, atas perhatian dan perkenan Bapak diucapkan terima kasih.";
    pdfDoc.text(penutup, marginLeft, y, { align: 'justify', maxWidth: contentWidth });
    const penutupLineCount = pdfDoc.splitTextToSize(penutup, contentWidth).length;
    y += penutupLineCount * 7.5 + 8;

    // ========== PENGIKUT SECTION ==========
    if (pengikutList.length > 0) {
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text("Pegawai yang mengikuti :", marginLeft, y);
        y += 6;
        pdfDoc.setFont("helvetica", "normal");
        pengikutList.forEach((p, idx) => {
            pdfDoc.text(`${idx + 1}. ${p.nama || p.displayName}`, marginLeft + 5, y);
            y += 5;
        });
        y += 5;
    }

    // ========== TANDA TANGAN (Signature) ==========
    const ttdX = pageWidth - marginRight - 70;
    const signatureWidth = 60;

    let designation = "Bendahara";
    if (data.dari) {
        if (data.dari.toLowerCase().includes("bendahara")) designation = "Bendahara";
        else if (data.dari.toLowerCase().includes("sekretaris")) designation = "Sekretaris Camat";
        else if (data.dari.toLowerCase().includes("kasubag")) designation = "Kasubag Perencanaan";
    }

    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text(designation, ttdX + signatureWidth / 2, y, { align: "center" });

    y += 25;

    pdfDoc.setFont("helvetica", "bold");
    const signerName = (pegawaiUtama?.nama || data.nama || "-");
    pdfDoc.text(signerName, ttdX + signatureWidth / 2, y, { align: "center" });

    const nameWidth = pdfDoc.getTextWidth(signerName);
    pdfDoc.line(ttdX + signatureWidth / 2 - nameWidth / 2, y + 1, ttdX + signatureWidth / 2 + nameWidth / 2, y + 1);

    y += 5;
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.setFontSize(9);
    const signerNip = `NIP. ${pegawaiUtama?.nip || "-"}`;
    pdfDoc.text(signerNip, ttdX + signatureWidth / 2, y, { align: "center" });

    y += 10;

    // ========== FOOTER BOXES ==========
    pdfDoc.setLineWidth(0.3);
    const boxHeight = 25;

    pdfDoc.rect(marginLeft, y, contentWidth, boxHeight);
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Saran Sekretaris Camat :", marginLeft + 2, y + 5);

    y += boxHeight;

    pdfDoc.rect(marginLeft, y, contentWidth, boxHeight);
    pdfDoc.text("Keputusan Camat Salam babaris :", marginLeft + 2, y + 5);
}