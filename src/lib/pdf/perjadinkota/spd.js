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
 * Terbilang sederhana untuk angka hari
 */
function terbilang(n) {
    const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh"];
    if (n >= 0 && n <= 10) return satuan[n];
    return String(n);
}

/**
 * Helper untuk menggambar cell tabel SPD
 */
function drawCell(pdfDoc, x, y, w, h, text, options = {}) {
    const {
        fontSize = 8,
        fontStyle = "normal",
        align = "left",
        padding = 2,
        border = true,
        verticalAlign = "top",
    } = options;

    // Border
    if (border) {
        pdfDoc.setDrawColor(0);
        pdfDoc.setLineWidth(0.3);
        pdfDoc.rect(x, y, w, h);
    }

    // Text
    pdfDoc.setFontSize(fontSize);
    pdfDoc.setFont("helvetica", fontStyle);

    const textX = align === "center" ? x + w / 2 : x + padding;
    const textAlign = align === "center" ? "center" : "left";

    let textY;
    if (verticalAlign === "middle") {
        textY = y + h / 2 + fontSize * 0.12;
    } else {
        textY = y + padding + fontSize * 0.35;
    }

    if (typeof text === "string" || typeof text === "number") {
        const maxW = w - padding * 2;
        const lines = pdfDoc.splitTextToSize(String(text), maxW);
        pdfDoc.text(lines, textX, textY, { align: textAlign });
    }
}

/**
 * Generate standalone SPD PDF with F4 format
 * @param {Object} data - Perjadin data from Firebase
 */
export async function generateSPD(data) {
    // Fetch data necessary for standalone print
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

    await drawSPDLayout(pdfDoc, data, pegawaiUtama, pengikutList);

    const pdfBlob = pdfDoc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
}

/**
 * Logic untuk menggambar layout SPD ke dalam pdfDoc
 */
/**
 * Logic untuk menggambar layout SPD ke dalam pdfDoc
 */
export async function drawSPDLayout(pdfDoc, data, pegawaiUtama, pengikutList) {
    const pageWidth = 215;
    const marginLeft = 25;
    const marginRight = 25;
    const tableWidth = pageWidth - marginLeft - marginRight;

    let y = 12;

    // ========== HEADER ==========
    const centerX = pageWidth / 2;

    // Logo di kiri
    try {
        const logoUrl = "/assets/logo/Lambang_Kabupaten_Tapin.png";
        pdfDoc.addImage(logoUrl, "PNG", marginLeft, y - 3, 16, 18);
    } catch (e) {
        console.error("Gagal memuat logo:", e);
    }

    // Teks header
    pdfDoc.setFontSize(15);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("PEMERINTAH KABUPATEN TAPIN", centerX, y + 3, { align: "center" });

    pdfDoc.setFontSize(20);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("KECAMATAN SALAM BABARIS", centerX, y + 9, { align: "center" });

    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("Jalan Transmigrasi No. 02 Desa Salam Babaris Kode Pos : 71182", centerX, y + 13, { align: "center" });

    y += 16;

    // Garis bawah header
    pdfDoc.setLineWidth(0.8);
    pdfDoc.line(marginLeft, y, pageWidth - marginRight, y);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.line(marginLeft, y + 1, pageWidth - marginRight, y + 1);

    y += 5;

    // ========== LEMBAR KE & NOMOR (kotak kanan atas) ==========
    const boxW = 50;
    const boxX = pageWidth - marginRight - boxW;
    const boxLineH = 5;

    pdfDoc.setFontSize(7);
    pdfDoc.setFont("helvetica", "normal");

    // Lembar ke
    pdfDoc.text("Lembar ke :", boxX, y + 1);
    y += boxLineH;

    // Kode No
    pdfDoc.text("Kode No.", boxX, y + 1);
    y += boxLineH;

    // Nomor SPD
    pdfDoc.text("Nomor :", boxX, y + 1);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text(`${data.noSpd || "-"}`, boxX + 10, y + 1);

    y += boxLineH + 5;

    // ========== JUDUL ==========
    pdfDoc.setFontSize(11);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("SURAT PERJALANAN DINAS", centerX, y, { align: "center" });
    const titleW = pdfDoc.getTextWidth("SURAT PERJALANAN DINAS");
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(centerX - titleW / 2, y + 1, centerX + titleW / 2, y + 1);

    y += 6;

    // ========== TABEL SPD ==========
    const colNo = 10;       // kolom nomor
    const colLabel = 65;    // kolom uraian
    const colValue = tableWidth - colNo - colLabel; // kolom isi

    const xNo = marginLeft;
    const xLabel = xNo + colNo;
    const xValue = xLabel + colLabel;

    // Nama pegawai utama
    const namaPegawai = pegawaiUtama
        ? (pegawaiUtama.nama || pegawaiUtama.displayName || "-").toUpperCase()
        : "-";
    const nipPegawai = pegawaiUtama ? (pegawaiUtama.nip || "-") : "-";
    const pangkatPegawai = pegawaiUtama ? (pegawaiUtama.pangkat || "-") : "-";
    const golonganPegawai = pegawaiUtama ? (pegawaiUtama.golongan || "-") : "-";
    const jabatanPegawai = pegawaiUtama ? (pegawaiUtama.jabatan || "-") : "-";

    // ---- Row 01: Pejabat Pembuat Komitmen ----
    const row1H = 10;
    drawCell(pdfDoc, xNo, y, colNo, row1H, "01", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xLabel, y, colLabel, row1H, "Pengguna Anggaran/Kuasa Pengguna\nAnggaran");
    drawCell(pdfDoc, xValue, y, colValue, row1H, "Camat Salam Babaris", { fontStyle: "bold" });
    y += row1H;

    // ---- Row 02: Nama/NIP Pegawai ----
    const namaNipText = `${namaPegawai}/\n${nipPegawai}`;
    const namaNipLines = pdfDoc.splitTextToSize(namaNipText, colValue - 4);
    const row2H = Math.max(12, (namaNipLines.length * 4) + 2);
    drawCell(pdfDoc, xNo, y, colNo, row2H, "02", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xLabel, y, colLabel, row2H, "Nama/NIP Pegawai yang melaksanakan\nperjalanan dinas");
    drawCell(pdfDoc, xValue, y, colValue, row2H, namaNipText, { fontStyle: "bold" });
    y += row2H;

    // ---- Row 03: Pangkat, Jabatan, Tingkat Biaya ----
    const pLines = pdfDoc.splitTextToSize(`a. ${pangkatPegawai}`, colValue - 4);
    const jLines = pdfDoc.splitTextToSize(`b. ${jabatanPegawai}`, colValue - 4);
    const row3H = Math.max(18, (pLines.length + jLines.length + 1) * 4 + 3);

    drawCell(pdfDoc, xNo, y, colNo, row3H, "03", { align: "center", verticalAlign: "middle" });

    // Label column — 3 sub-labels
    pdfDoc.setDrawColor(0);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.rect(xLabel, y, colLabel, row3H);
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("a. Pangkat dan Golongan", xLabel + 2, y + 4.5);
    pdfDoc.text("b. Jabatan/Instansi", xLabel + 2, y + 4.5 + (pLines.length * 4));
    pdfDoc.text("c. Tingkat Biaya Perjalanan Dinas", xLabel + 2, y + row3H - 2.5);

    // Value column — 3 sub-values
    pdfDoc.rect(xValue, y, colValue, row3H);
    pdfDoc.text(pLines, xValue + 2, y + 4.5);
    pdfDoc.text(jLines, xValue + 2, y + 4.5 + (pLines.length * 4));
    pdfDoc.text("c.", xValue + 2, y + row3H - 2.5);
    y += row3H;

    // ---- Row 04: Maksud Perjalanan Dinas ----
    const maksudText = data.perihalSurat || "-";
    const maksudLinesArr = pdfDoc.splitTextToSize(maksudText, colValue - 4);
    const row4H = Math.max(8, (maksudLinesArr.length * 4) + 2);
    drawCell(pdfDoc, xNo, y, colNo, row4H, "04", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xLabel, y, colLabel, row4H, "Maksud Perjalanan Dinas");
    drawCell(pdfDoc, xValue, y, colValue, row4H, maksudText, { fontStyle: "bold" });
    y += row4H;

    // ---- Row 05: Alat angkutan ----
    const row5H = 8;
    drawCell(pdfDoc, xNo, y, colNo, row5H, "05", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xLabel, y, colLabel, row5H, "Alat angkutan yang digunakan");
    drawCell(pdfDoc, xValue, y, colValue, row5H, "Kendaraan Umum", { fontStyle: "bold" });
    y += row5H;

    // ---- Row 06: Tempat berangkat & tujuan ----
    const tujuanText = `b. ${data.tujuan || "-"}`;
    const tujuanLinesArr = pdfDoc.splitTextToSize(tujuanText, colValue - 4);
    const row6H = Math.max(12, 9 + (tujuanLinesArr.length * 4) + 1);

    drawCell(pdfDoc, xNo, y, colNo, row6H, "06", { align: "center", verticalAlign: "middle" });

    // Label
    pdfDoc.rect(xLabel, y, colLabel, row6H);
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("a. Tempat berangkat", xLabel + 2, y + 4.5);
    pdfDoc.text("b. Tempat tujuan", xLabel + 2, y + 9);

    // Value
    pdfDoc.rect(xValue, y, colValue, row6H);
    pdfDoc.text("a. Kecamatan Salam Babaris", xValue + 2, y + 4.5);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text(tujuanLinesArr, xValue + 2, y + 9);
    y += row6H;

    // ---- Row 07: Lama, tanggal berangkat, tanggal kembali ----
    const row7H = 18;
    drawCell(pdfDoc, xNo, y, colNo, row7H, "07", { align: "center", verticalAlign: "middle" });

    // Label
    pdfDoc.rect(xLabel, y, colLabel, row7H);
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("a. Lamanya berangkat", xLabel + 2, y + 5);
    pdfDoc.text("b. Tanggal berangkat", xLabel + 2, y + 10);
    pdfDoc.text("c. Tanggal harus kembali/tiba ditempat baru", xLabel + 2, y + 15);

    // Calculate extreme dates (earliest departure, latest return)
    let displayBerangkat = data.tanggalBerangkat;
    let displayKembali = data.tanggalKembali;
    let displayHari = data.hari || 1;

    const participants = [pegawaiUtama, ...(pengikutList || [])].filter(Boolean);
    if (participants.length > 0) {
        let earliest = null;
        let latest = null;

        participants.forEach(p => {
            if (p.tglBerangkat) {
                if (!earliest || p.tglBerangkat < earliest) earliest = p.tglBerangkat;
            }
            if (p.tglKembali) {
                if (!latest || p.tglKembali > latest) latest = p.tglKembali;
            }
        });

        if (earliest) displayBerangkat = earliest;
        if (latest) displayKembali = latest;
        
        // Recalculate days if we have extreme dates
        if (earliest && latest) {
            const start = new Date(earliest);
            const end = new Date(latest);
            const diffTime = Math.abs(end - start);
            displayHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
    }

    // Value
    pdfDoc.rect(xValue, y, colValue, row7H);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text(`a.  ${displayHari}  (${terbilang(displayHari)}) Hari`, xValue + 2, y + 5);
    pdfDoc.text(`b.  ${formatTanggal(displayBerangkat)}`, xValue + 2, y + 10);
    pdfDoc.text(`c.  ${formatTanggal(displayKembali)}`, xValue + 2, y + 15);
    y += row7H;

    // ---- Row 08: Pengikut (tabel) ----
    // Header pengikut
    const row8HeaderH = 6;
    drawCell(pdfDoc, xNo, y, colNo, row8HeaderH, "", { align: "center" });

    // Sub header di label+value area
    const pengikutFullW = colLabel + colValue;
    pdfDoc.rect(xLabel, y, pengikutFullW, row8HeaderH);
    pdfDoc.setFontSize(7);
    pdfDoc.setFont("helvetica", "bold");

    // Sub columns header: No | Nama | Tanggal Lahir | Keterangan
    // Aligned with main table: colLabel = 65, colValue = 110. pengikutFullW = 175.
    const subColNo = 10;
    const subColNama = 55; // Total 65 (colLabel)
    const subColTglLahir = 40;
    const subColKet = 70; // Total 110 (colValue)

    pdfDoc.text("No", xLabel + 2, y + 4);
    pdfDoc.text("Nama Pengikut", xLabel + subColNo + 2, y + 4);
    pdfDoc.text("Tanggal Lahir", xLabel + subColNo + subColNama + 2, y + 4);
    pdfDoc.text("Keterangan", xLabel + subColNo + subColNama + subColTglLahir + 2, y + 4);

    // Garis vertikal di sub header
    pdfDoc.line(xLabel + subColNo, y, xLabel + subColNo, y + row8HeaderH);
    pdfDoc.line(xLabel + subColNo + subColNama, y, xLabel + subColNo + subColNama, y + row8HeaderH);
    pdfDoc.line(xLabel + subColNo + subColNama + subColTglLahir, y, xLabel + subColNo + subColNama + subColTglLahir, y + row8HeaderH);

    y += row8HeaderH;

    // Pengikut rows (minimal 1 baris kosong jika tidak ada pengikut)
    const pengikutRows = pengikutList.length > 0 ? pengikutList : [null];
    const pengikutRowH = 7;

    pengikutRows.forEach((p, idx) => {
        drawCell(pdfDoc, xNo, y, colNo, pengikutRowH, "", { align: "center", verticalAlign: "middle", fontSize: idx === 0 ? 8 : 0 });

        pdfDoc.rect(xLabel, y, pengikutFullW, pengikutRowH);

        pdfDoc.setFontSize(7);
        pdfDoc.setFont("helvetica", "normal");

        // Nomor pengikut
        pdfDoc.text(`${idx + 1}.`, xLabel + 2, y + 4.5);

        if (p) {
            // Nama
            const namaPengikut = (p.nama || p.displayName || "-").toUpperCase();
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.text(namaPengikut, xLabel + subColNo + 2, y + 4.5);

            // Tanggal Lahir
            pdfDoc.setFont("helvetica", "normal");
            // Check potential field names for birth date
            const birthDate = p.tanggalLahir || p.tgllahir || p.tgllahir || p.tanggal_lahir;
            pdfDoc.text(birthDate ? formatTanggal(birthDate) : "-", xLabel + subColNo + subColNama + 2, y + 4.5);

            // Keterangan
            pdfDoc.text("-", xLabel + subColNo + subColNama + subColTglLahir + 2, y + 4.5);
        }

        // Garis vertikal
        pdfDoc.line(xLabel + subColNo, y, xLabel + subColNo, y + pengikutRowH);
        pdfDoc.line(xLabel + subColNo + subColNama, y, xLabel + subColNo + subColNama, y + pengikutRowH);
        pdfDoc.line(xLabel + subColNo + subColNama + subColTglLahir, y, xLabel + subColNo + subColNama + subColTglLahir, y + pengikutRowH);

        y += pengikutRowH;
    });

    // ---- Row 09: Pembebanan Anggaran ----
    const row9H = 15;
    drawCell(pdfDoc, xNo, y, colNo, row9H, "09", { align: "center", verticalAlign: "middle" });

    pdfDoc.rect(xLabel, y, colLabel, row9H);
    pdfDoc.setFontSize(8);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("Pembebanan Anggaran :", xLabel + 2, y + 4);
    pdfDoc.text("a. SKPD", xLabel + 2, y + 9);
    pdfDoc.text("b. Kode Rekening", xLabel + 2, y + 14);

    pdfDoc.rect(xValue, y, colValue, row9H);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("a. Kecamatan Salam Babaris", xValue + 2, y + 9);
    pdfDoc.text("b. 5.1.02.04.01.0003", xValue + 2, y + 14);
    y += row9H;

    // ---- Row 10: Keterangan lain-lain ----
    const ketText = data.keterangan || "-";
    const ketLinesArr = pdfDoc.splitTextToSize(ketText, colValue - 4);
    const row10H = Math.max(8, (ketLinesArr.length * 4) + 2);
    drawCell(pdfDoc, xNo, y, colNo, row10H, "10", { align: "center", verticalAlign: "middle" });
    drawCell(pdfDoc, xLabel, y, colLabel, row10H, "Keterangan lain-lain");
    drawCell(pdfDoc, xValue, y, colValue, row10H, ketText);
    y += row10H;

    // ========== TANDA TANGAN (Statis) ==========
    y += 5;

    const ttdX = centerX + 10;
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("helvetica", "normal");

    pdfDoc.text("Dikeluarkan di", ttdX, y);
    pdfDoc.text(":  Salam Babaris", ttdX + 30, y);
    y += 4;

    pdfDoc.text("Pada tanggal", ttdX, y);
    pdfDoc.text(`:  ${formatTanggal(data.tanggal)}`, ttdX + 30, y);
    y += 5;

    pdfDoc.text("Pengguna Anggaran/Kuasa Pengguna", ttdX, y);
    y += 4;
    pdfDoc.text("Anggaran", ttdX, y);

    y += 20; // ruang tanda tangan

    // Nama penandatangan STATIS
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.setFontSize(10);
    const namaTtd = "Kus Henratmo, S.Sos";
    pdfDoc.text(namaTtd, ttdX, y);

    // Garis bawah nama
    const namaTtdW = pdfDoc.getTextWidth(namaTtd);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.line(ttdX, y + 1, ttdX + namaTtdW, y + 1);

    y += 5;

    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.setFontSize(8);
    pdfDoc.text("Penata Tingkat I (III/d)", ttdX, y);
    y += 4;
    pdfDoc.text("NIP. 19770413 2010011011", ttdX, y);
}
