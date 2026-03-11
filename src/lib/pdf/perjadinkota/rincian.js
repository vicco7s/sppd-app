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
 * Format mata uang Rupiah
 */
function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number).replace("Rp", "Rp ");
}

/**
 * Terbilang Indonesia
 */
function terbilang(n) {
    const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    if (n < 12) return satuan[n];
    if (n < 20) return terbilang(n - 10) + " Belas";
    if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
    if (n < 200) return "Seratus " + terbilang(n - 100);
    if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus " + terbilang(n % 100);
    if (n < 2000) return "Seribu " + terbilang(n - 1000);
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000);
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " Juta " + terbilang(n % 1000000);
    return String(n);
}

/**
 * Helper untuk menggambar cell tabel
 */
function drawCell(pdfDoc, x, y, w, h, text, options = {}) {
    const {
        fontSize = 9,
        fontStyle = "normal",
        align = "left",
        padding = 2,
        border = true,
        verticalAlign = "top",
    } = options;

    if (border) {
        pdfDoc.setDrawColor(0);
        pdfDoc.setLineWidth(0.3);
        pdfDoc.rect(x, y, w, h);
    }

    pdfDoc.setFontSize(fontSize);
    pdfDoc.setFont("helvetica", fontStyle);

    const textX = align === "center" ? x + w / 2 : x + padding;
    const textAlign = align === "center" ? "center" : "left";

    let textY;
    if (verticalAlign === "middle") {
        textY = y + h / 2 + fontSize * 0.12 * 72 / 25.4; // rough adjustment for pt to mm
        // simplified vertical align for jspdf in mm
        textY = y + (h / 2) + 1.5;
    } else {
        textY = y + padding + 3;
    }

    if (text !== undefined && text !== null) {
        const maxW = w - padding * 2;
        const lines = pdfDoc.splitTextToSize(String(text), maxW);
        pdfDoc.text(lines, textX, textY, { align: textAlign });
    }
}

/**
 * Generate standalone Rincian PDF
 */
export async function generateRincian(data) {
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
        format: [215, 330],
    });

    await drawRincianLayout(pdfDoc, data, pegawaiUtama, [], true); // true for main person

    const pdfBlob = pdfDoc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
}

/**
 * Logic untuk menggambar layout Rincian Biaya
 * @param {jsPDF} pdfDoc
 * @param {Object} data - Data Perjadin
 * @param {Object} person - Pegawai yang sedang diprint rinciannya
 * @param {Array} participants - List pengikut (untuk tabel bawah jika person adalah group)
 * @param {Boolean} isMain - Apakah ini rincian untuk pegawai utama
 */
export async function drawRincianLayout(pdfDoc, data, person, participants = [], isMain = true) {
    const pageWidth = 215;
    const marginLeft = 20;
    const marginRight = 20;
    const tableWidth = pageWidth - marginLeft - marginRight;
    const centerX = pageWidth / 2;

    let y = 15;

    // ========== JUDUL ==========
    pdfDoc.setFontSize(12);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("RINCIAN BIAYA PERJALANAN DINAS", centerX, y, { align: "center" });
    const titleW = pdfDoc.getTextWidth("RINCIAN BIAYA PERJALANAN DINAS");
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(centerX - titleW / 2, y + 1, centerX + titleW / 2, y + 1);

    y += 10;

    // ========== HEADER INFO ==========
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");

    // Baris 1: SPT
    pdfDoc.text("Nomor & Tanggal SPT", marginLeft, y);
    pdfDoc.text(`: ${data.noSpt || "-"}`, marginLeft + 45, y);
    pdfDoc.text("Tanggal", centerX + 10, y);
    pdfDoc.text(`: ${formatTanggal(data.tanggal)}`, centerX + 35, y);
    y += 5;

    // Baris 2: SPD
    pdfDoc.text("Nomor & Tanggal SPPD", marginLeft, y);
    pdfDoc.text(`: ${data.noSpd || "-"}`, marginLeft + 45, y);
    pdfDoc.text("Tanggal", centerX + 10, y);
    pdfDoc.text(`: ${formatTanggal(data.tanggal)}`, centerX + 35, y);
    y += 10;

    // ========== TABEL RINCIAN BIAYA ==========
    const colNo = 10;
    const colUraian = 55;
    const colVolume = 45;
    const colHarga = 30;
    const colJumlah = 20;
    const colKet = tableWidth - colNo - colUraian - colVolume - colHarga - colJumlah;

    const xNo = marginLeft;
    const xUraian = xNo + colNo;
    const xVolume = xUraian + colUraian;
    const xHarga = xVolume + colVolume;
    const xJumlah = xHarga + colHarga;
    const xKet = xJumlah + colJumlah;

    // Table Header
    const headH = 12;
    drawCell(pdfDoc, xNo, y, colNo, headH, "NO", { align: "center", verticalAlign: "middle", fontStyle: "bold" });
    drawCell(pdfDoc, xUraian, y, colUraian, headH, "URAIAN", { align: "center", verticalAlign: "middle", fontStyle: "bold" });
    drawCell(pdfDoc, xVolume, y, colVolume, headH, "RINCIAN BIAYA\nVOLUME", { align: "center", verticalAlign: "middle", fontStyle: "bold" });
    drawCell(pdfDoc, xHarga, y, colHarga, headH, "HARGA (Rp)", { align: "center", verticalAlign: "middle", fontStyle: "bold" });
    drawCell(pdfDoc, xJumlah, y, colJumlah, headH, "JUMLAH\nRp", { align: "center", verticalAlign: "middle", fontStyle: "bold" });
    drawCell(pdfDoc, xKet, y, colKet, headH, "KET", { align: "center", verticalAlign: "middle", fontStyle: "bold" });
    y += headH;

    // Data Rows
    const rowH = 25;
    // Priority: use data from person object (journey-specific) if available, fallback to global data
    const hari = person?.hari ?? data.hari ?? 0;
    const uangHarian = Number(person?.uangHarian ?? data.uangHarian ?? 0);
    const transport = Number(person?.transport ?? data.transport ?? 0);

    // Gunakan total dari person jika ada, jika tidak data global, jika tidak hitung manual
    const grandTotal = person?.total ? Number(person.total) : (data.total ? Number(data.total) : (uangHarian + transport) * hari);

    const totalUangHarian = uangHarian * hari;
    const totalTransport = transport * hari;

    // Row 1 & 2 & 3 & 4 (Combined in one big layout as per image)
    pdfDoc.rect(xNo, y, colNo, rowH);
    pdfDoc.rect(xUraian, y, colUraian, rowH);
    pdfDoc.rect(xVolume, y, colVolume, rowH);
    pdfDoc.rect(xHarga, y, colHarga, rowH);
    pdfDoc.rect(xJumlah, y, colJumlah, rowH);
    pdfDoc.rect(xKet, y, colKet, rowH);

    pdfDoc.setFontSize(9);
    // Column NO
    pdfDoc.text("1", xNo + colNo / 2, y + 5, { align: "center" });
    pdfDoc.text("2", xNo + colNo / 2, y + 10, { align: "center" });
    pdfDoc.text("3", xNo + colNo / 2, y + 17, { align: "center" });
    pdfDoc.text("4", xNo + colNo / 2, y + 23, { align: "center" });

    // Column URAIAN
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Uang Harian", xUraian + 2, y + 5);
    pdfDoc.text("Biaya Penginapan", xUraian + 2, y + 10);
    pdfDoc.text("Biaya Transport", xUraian + 2, y + 17);
    pdfDoc.text("Uang", xUraian + 2, y + 23);

    // Column VOLUME, HARGA, JUMLAH (Conditional Rendering)
    pdfDoc.setFont("helvetica", "normal");

    // Uang Harian details
    if (uangHarian > 0) {
        pdfDoc.text(`${hari} (${terbilang(hari)}) Hari`, xVolume + 2, y + 5);
        pdfDoc.text(`${hari} x ${formatRupiah(uangHarian)}`, xHarga + 2, y + 5);
        pdfDoc.text(formatRupiah(totalUangHarian).replace("Rp ", ""), xJumlah + 2, y + 5);
    }

    // Transport details
    if (transport > 0) {
        pdfDoc.text(`${hari} (${terbilang(hari)}) Hari`, xVolume + 2, y + 17);
        pdfDoc.text(`${hari} x ${formatRupiah(transport)}`, xHarga + 2, y + 17);
        pdfDoc.text(formatRupiah(totalTransport).replace("Rp ", ""), xJumlah + 2, y + 17);
    }

    y += rowH;

    // Row Total
    const totalRowH = 6;
    pdfDoc.setFont("helvetica", "bold");
    drawCell(pdfDoc, xNo, y, colNo + colUraian + colVolume + colHarga, totalRowH, "Total Biaya Perjalanan Dinas", { fontStyle: "bold" });
    drawCell(pdfDoc, xJumlah, y, colJumlah, totalRowH, formatRupiah(grandTotal).replace("Rp ", ""), { fontStyle: "bold" });
    drawCell(pdfDoc, xKet, y, colKet, totalRowH, "");
    y += totalRowH;

    // Row Terbilang
    const terbilangRowH = 6;
    drawCell(pdfDoc, xNo, y, tableWidth, terbilangRowH, `Terbilang : ${terbilang(grandTotal)} Rupiah`, { fontStyle: "bold" });
    y += terbilangRowH + 15;

    // ========== TANDA TANGAN ==========
    const ttdX = pageWidth - marginRight - 60;
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text(`Salam Babaris, ${formatTanggal(data.tglhasil)}`, ttdX, y);
    y += 5;
    pdfDoc.text("Pelaksana SPD,", ttdX, y);
    y += 20;

    const currentName = person ? (person.nama || person.displayName || "-").toUpperCase() : "-";
    const currentNip = person ? (person.nip || "-") : "-";

    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text(currentName, ttdX, y);
    y += 4;
    pdfDoc.text(`NIP. ${currentNip}`, ttdX, y);

    y += 15;

    // ========== TANDA TERIMA ==========
    pdfDoc.setFontSize(11);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("TANDA TERIMA BIAYA PERJALANAN DINAS", centerX, y, { align: "center" });
    const ttTitleW = pdfDoc.getTextWidth("TANDA TERIMA BIAYA PERJALANAN DINAS");
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(centerX - ttTitleW / 2, y + 1, centerX + ttTitleW / 2, y + 1);

    y += 8;

    const ttColNo = 10;
    const ttColNama = 50;
    const ttColPangkat = 25;
    const ttColJumlah = 35;
    const ttColRek = 35;
    const ttColTtd = tableWidth - ttColNo - ttColNama - ttColPangkat - ttColJumlah - ttColRek;

    const xttNo = marginLeft;
    const xttNama = xttNo + ttColNo;
    const xttPangkat = xttNama + ttColNama;
    const xttJumlah = xttPangkat + ttColPangkat;
    const xttRek = xttJumlah + ttColJumlah;
    const xttTtd = xttRek + ttColRek;

    const ttHeadH = 11;
    drawCell(pdfDoc, xttNo, y, ttColNo, ttHeadH, "No.", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xttNama, y, ttColNama, ttHeadH, "NAMA/NIP", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xttPangkat, y, ttColPangkat, ttHeadH, "PANGKAT / GOL", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xttJumlah, y, ttColJumlah, ttHeadH, "JUMLAH UANG\nYANG DITERIMA", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xttRek, y, ttColRek, ttHeadH, "NOMOR REKENING\nPENERIMA", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xttTtd, y, ttColTtd, ttHeadH, "TANDA\nTANGAN", { align: "center", verticalAlign: "middle" });
    y += ttHeadH;

    // Tanda Terima Rows
    const ttRowH = 15;
    const recipients = isMain ? [person] : participants;

    recipients.forEach((r, idx) => {
        const rName = r ? (r.nama || r.displayName || "-").toUpperCase() : "-";
        const rNip = r ? (r.nip || "-") : "-";
        const rPangkat = r ? (r.pangkat || "-") : "-";
        const rRek = r ? (r.rek || r.noRekening || "-") : "-";

        drawCell(pdfDoc, xttNo, y, ttColNo, ttRowH, `${idx + 1}`, { align: "center", verticalAlign: "middle" });
        drawCell(pdfDoc, xttNama, y, ttColNama, ttRowH, `${rName}/\n${rNip}`, { verticalAlign: "middle", fontSize: 8 });
        drawCell(pdfDoc, xttPangkat, y, ttColPangkat, ttRowH, rPangkat, { align: "center", verticalAlign: "middle" });
        drawCell(pdfDoc, xttJumlah, y, ttColJumlah, ttRowH, formatRupiah(grandTotal), { verticalAlign: "middle" });
        drawCell(pdfDoc, xttRek, y, ttColRek, ttRowH, rRek, { align: "center", verticalAlign: "middle" });
        drawCell(pdfDoc, xttTtd, y, ttColTtd, ttRowH, "", { align: "center", verticalAlign: "middle" });
        y += ttRowH;
    });
}
