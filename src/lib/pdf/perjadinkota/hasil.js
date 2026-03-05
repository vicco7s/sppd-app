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
 * Generate standalone Hasil PDF (For individual test if needed)
 */
export async function generateHasil(data) {
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

    await drawHasilLayout(pdfDoc, data, pegawaiUtama);

    const pdfBlob = pdfDoc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
}

/**
 * Split and draw text handling page breaks
 */
function drawTextWithPagination(pdfDoc, text, x, y, maxWidth, lineHeight, pageHeight, marginBottom) {
    if (!text) return y;

    const lines = pdfDoc.splitTextToSize(String(text), maxWidth);

    for (let i = 0; i < lines.length; i++) {
        // Check if we need a new page
        if (y + lineHeight > pageHeight - marginBottom) {
            pdfDoc.addPage([215, 330]);
            y = 20; // reset Y for new page (margin top)
        }
        pdfDoc.text(lines[i], x, y);
        y += lineHeight;
    }
    return y;
}

/**
 * Logic untuk menggambar layout Hasil Perjadin
 * @param {jsPDF} pdfDoc
 * @param {Object} data - Data Perjadin
 * @param {Object} person - Pegawai yang sedang diprint laporannya
 */
export async function drawHasilLayout(pdfDoc, data, person) {
    const pageWidth = 215;
    const pageHeight = 330;
    const marginLeft = 20;
    const marginRight = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;
    const centerX = pageWidth / 2;
    const marginBottom = 25; // bottom margin threshold

    let y = 12;

    // ========== HEADER ==========
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
    pdfDoc.text("Alamat : Jalan Transmigrasi Utara No. 02 Desa Salam Babaris Kode Pos 71182", centerX, y + 13, { align: "center" });

    y += 16;

    // Garis bawah header
    pdfDoc.setLineWidth(0.8);
    pdfDoc.line(marginLeft, y, pageWidth - marginRight, y);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.line(marginLeft, y + 1, pageWidth - marginRight, y + 1);

    y += 10;

    // ========== JUDUL ==========
    pdfDoc.setFontSize(11);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("LAPORAN", centerX, y, { align: "center" });
    y += 5;
    pdfDoc.text("TENTANG KEGIATAN PERJALANAN DINAS DALAM DAERAH", centerX, y, { align: "center" });
    y += 10;

    // Konfigurasi spasi dan ukuran font untuk konten
    const lineHeight = 5;
    const indentA = marginLeft;
    const indentB = marginLeft + 5;
    const indentC = marginLeft + 12;
    const indentText = marginLeft + 12;
    const textWidth = contentWidth - 12;

    // ========== A. PENDAHULUAN ==========
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");

    pdfDoc.text("A.", indentA, y);
    pdfDoc.text("Pendahuluan", indentB, y);
    y += lineHeight;

    // 1. Umum/Latar Belakang
    pdfDoc.text("1.", indentB, y);
    pdfDoc.text("Umum/Latar Belakang", indentC, y);
    y += lineHeight;

    const latarBelakang = "Bahwa untuk mendukung tugas kedinasan di lingkungan Pemerintahan Kabupaten Tapin, perlu mengatur Tata Cara Pelaksanaan Perjalanan Dinas bagi Bupati dan Wakil Bupati, Pimpinan dan Anggota Dewan Perwakilan Rakyat Daerah, Pegawai Negeri Sipil, Non Pegawai Negeri Sipil, dan Pihak Lain dengan memperhatikan prinsip selektif, efesiensi, efektivitas, kepatutan, kewajaran, dan akuntabel, serta memperhatikan aspek pertanggungjawaban sesuai dengan biaya riil (at cost) dan lumpsum. Bahwa berdasarkan pertimbangan tersebut, ditetapkan Peraturan Bupati Tapin Nomor 01 Tahun 2024 Tentang Perjalanan Dinas. Maksud ditetapkan Peraturan Bupati ini untuk dijadikan sebagai pedoman pelaksanaan, penatausahaan, dan pertanggungjawaban serta pelaporan Perjalanan Dinas dalam rangka penyelenggaraan pemerintahan. Peraturan Bupati ini bertujuan untuk mengatur mengenai pelaksanaan, penatausahaan, dan pertanggungiawaban serta pelaporan Perjalanan Dinas bagi Pelaksana SPD yang dibebankan pada APBD. Berdasarkan penjelasan pada Bab 1 Ketentuan Umum pasal 1 Peraturan Bupati Tapin Nomor 01 Tahun 2024 Tentang Perjalanan Dinas, yang dimaksud Perjalanan Dinas adalah perjalanan dinas jabatan yang melewati batas Daerah dan/atau dalam Daerah dari tempat kedudukan ke tempat yang dituju, melaksanakan tugas, dan kembali ke tempat kedudukan semula di dalam negeri. Pelaksana Perjalanan Dinas yang selanjutnya disebut Pelaksana SPD adalah Bupati, Wakil Bupati, Pimpinan DPRD, Anggota DPRD, Pegawai ASN (PNS/Calon PNS/PPPK), dan Pihak Lain yang melaksanakan perjalanan dinas jabatan. \nPerjalanan Dinas Dalam Daerah adalah Perjalanan Dinas yang dilaksanakan di dalam Daerah yang terdiri atas pelaksanaan lebih dari 8 (delapan) jam, dan pelaksanaan sampai dengan 8 (delapan) jam.";

    y = drawTextWithPagination(pdfDoc, latarBelakang, indentText, y, textWidth, lineHeight, pageHeight, marginBottom);
    y += lineHeight;

    // 2. Landasan Hukum
    if (y + lineHeight > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
    pdfDoc.text("2.", indentB, y);
    pdfDoc.text("Landasan Hukum", indentC, y);
    y += lineHeight;

    const tableXStart = indentC;
    const col1W = 10;
    const col2W = textWidth - col1W - 5;

    const lh1 = "Peraturan Bupati Tapin Nomor 01 Tahun 2024 tentang Perjalanan Dinas";
    const lh2 = "DPA SKPD Kecamatan Salam Babaris Tahun Anggaran 2026";
    const lh3 = `Surat Dari ${data.suratDari || "-"} tanggal ${formatTanggal(data.tanggalSurat)} Perihal ${data.perihalSurat || "-"}`;
    const lh4 = `Surat Tugas Nomor : ${data.noSpt || "-"} Tanggal, ${formatTanggal(data.tanggal)}`;
    const lh5 = `Surat Perjalanan Dinas Nomor : ${data.noSpd || "-"} Tanggal, ${formatTanggal(data.tanggal)}`;

    const lawsList = [lh1, lh2, lh3, lh4, lh5];

    for (let i = 0; i < lawsList.length; i++) {
        if (y + lineHeight > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
        pdfDoc.text(`2.${i + 1}`, tableXStart, y);
        y = drawTextWithPagination(pdfDoc, lawsList[i], tableXStart + col1W, y, col2W, lineHeight, pageHeight, marginBottom);
        y += 2; // small gap
    }

    y += lineHeight;

    // 3. Maksud dan Tujuan
    if (y + lineHeight > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
    pdfDoc.text("3.", indentB, y);
    pdfDoc.text("Maksud dan Tujuan", indentC, y);
    y += lineHeight;

    y = drawTextWithPagination(pdfDoc, "Mengikuti " + data.perihalSurat || "-", indentText, y, textWidth, lineHeight, pageHeight, marginBottom);
    y += lineHeight;

    // ========== B. KEGIATAN YANG DILAKSANAKAN ==========
    if (y + lineHeight * 2 > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
    pdfDoc.text("B.", indentA, y);
    pdfDoc.text("Kegiatan yang dilaksanakan", indentB, y);
    y += lineHeight;

    y = drawTextWithPagination(pdfDoc, data.kegiatan || "-", indentText, y, textWidth, lineHeight, pageHeight, marginBottom);
    y += lineHeight;

    // ========== C. HASIL YANG DICAPAI ==========
    if (y + lineHeight * 2 > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
    pdfDoc.text("C.", indentA, y);
    pdfDoc.text("Hasil yang dicapai", indentB, y);
    y += lineHeight;

    // Split text strings by new lines to mimic paragraph styling from image (dash list)
    let hasilText = data.hasil || "-";
    // Tweak parsing if the AI includes new lines
    let hasilParas = hasilText.split('\n').filter(p => p.trim() !== "");
    if (hasilParas.length === 0) hasilParas = ["-"];

    for (let p of hasilParas) {
        if (y + lineHeight > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
        // Simple bullet
        pdfDoc.text("-", indentText, y);
        y = drawTextWithPagination(pdfDoc, p.trim(), indentText + 5, y, textWidth - 5, lineHeight, pageHeight, marginBottom);
        y += 2;
    }

    y += lineHeight;

    // ========== D. KESIMPULAN DAN SARAN ==========
    if (y + lineHeight * 2 > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
    pdfDoc.text("D.", indentA, y);
    pdfDoc.text("Kesimpulan dan Saran", indentB, y);
    y += lineHeight;

    const kesimpulanSaran = `${data.kesimpulan || ""}\n\n${data.saran || ""}`.trim();
    let ksParas = kesimpulanSaran.split('\n').filter(p => p.trim() !== "");
    if (ksParas.length === 0) ksParas = ["-"];

    for (let p of ksParas) {
        if (y + lineHeight > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
        pdfDoc.text("-", indentText, y);
        y = drawTextWithPagination(pdfDoc, p.trim(), indentText + 5, y, textWidth - 5, lineHeight, pageHeight, marginBottom);
        y += 2;
    }

    y += lineHeight;

    // ========== E. PENUTUP ==========
    if (y + lineHeight * 2 > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
    pdfDoc.text("E.", indentA, y);
    pdfDoc.text("Penutup", indentB, y);
    y += lineHeight;

    const penutup = `Demikian laporan perjalanan dinas ini disusun sebagai bentuk pertanggungjawaban atas pelaksanaan tugas dalam kegiatan ${data.perihalSurat || "-"}. Diharapkan hasil kegiatan ini dapat menjadi pedoman yang akurat, realistis, dan akuntabel.`;
    y = drawTextWithPagination(pdfDoc, penutup, indentText, y, textWidth, lineHeight, pageHeight, marginBottom);
    y += lineHeight;

    // ========== TANDA TANGAN ==========
    // We need 40 units of space for the signature
    if (y + 40 > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }

    const ttdX = pageWidth - marginRight - 65;
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");

    // Position signature box
    const alignLabel = ttdX;
    const alignVal = ttdX + 22;

    pdfDoc.text("Dibuat di", alignLabel, y);
    pdfDoc.text(`: Salam Babaris`, alignVal, y);
    y += lineHeight;

    pdfDoc.text("Pada Tanggal", alignLabel, y);
    // Usually the report is signed after return date + a few days, but we use data.tanggal for now or return date.
    const tanggalTtd = data.tanggalKembali ? data.tanggalKembali : data.tanggal;
    pdfDoc.text(`: ${formatTanggal(tanggalTtd)}`, alignVal, y);
    y += lineHeight + 2;

    pdfDoc.text("Pembuat Laporan,", alignLabel, y);
    y += 25; // Space for signature

    const personName = person ? (person.nama || person.displayName || "-").toUpperCase() : "-";
    const personPangkat = person ? (person.pangkat || "-") : "-";
    const personNip = person ? (person.nip || "-") : "-";

    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text(personName, alignLabel, y);

    // Underscore line
    const nameW = pdfDoc.getTextWidth(personName);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.line(alignLabel, y + 1, alignLabel + nameW, y + 1);

    y += 5;
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text(personPangkat, alignLabel, y);
    y += 5;
    pdfDoc.text(`NIP. ${personNip}`, alignLabel, y);
}
