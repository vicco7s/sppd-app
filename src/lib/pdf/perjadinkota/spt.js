import { jsPDF } from "jspdf";
import { db } from "@/services/firebases";
import { doc, getDoc } from "firebase/firestore";

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
 * Format tanggal dari "YYYY-MM-DD" ke "DD NamaBulan YYYY"
 */
export function formatTanggal(dateInput) {
    if (!dateInput) return "-";

    let dateStr = dateInput;
    // Handle Firebase Timestamp
    if (dateInput && typeof dateInput.toDate === "function") {
        dateStr = dateInput.toDate().toISOString().split("T")[0];
    } else if (dateInput instanceof Date) {
        dateStr = dateInput.toISOString().split("T")[0];
    }

    if (!dateStr || typeof dateStr !== "string") return "-";

    const bulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} ${bulan[month]} ${year}`;
}

/**
 * Format tanggal ke nama hari Indonesia
 */
export function formatHari(dateStr) {
    if (!dateStr) return "-";
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const d = new Date(dateStr);
    return hari[d.getDay()];
}

/**
 * Generate standalone SPT PDF with F4 format
 * @param {Object} data - Perjadin data from Firebase
 */
export async function generateSPT(data) {
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

    await drawSPTLayout(pdfDoc, data, pegawaiUtama, pengikutList);

    const pdfBlob = pdfDoc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
}

/**
 * Logic untuk menggambar layout SPT ke dalam pdfDoc
 */
export async function drawSPTLayout(pdfDoc, data, pegawaiUtama, pengikutList) {
    // Semua orang yang ditugaskan (utama + pengikut)
    const semuaPegawai = [];
    if (pegawaiUtama) semuaPegawai.push(pegawaiUtama);
    semuaPegawai.push(...pengikutList);

    const pageWidth = 215;
    const marginLeft = 25;
    const marginRight = 25;
    const contentWidth = pageWidth - marginLeft - marginRight;

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

    // Teks header center
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

    // Garis bawah header (double line)
    pdfDoc.setLineWidth(0.8);
    pdfDoc.line(marginLeft, y, pageWidth - marginRight, y);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.line(marginLeft, y + 1.2, pageWidth - marginRight, y + 1.2);

    y += 8;

    // ========== JUDUL SURAT TUGAS ==========
    pdfDoc.setFontSize(12);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("SURAT TUGAS", centerX, y, { align: "center" });
    // Garis bawah judul
    const titleWidth = pdfDoc.getTextWidth("SURAT TUGAS");
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(centerX - titleWidth / 2, y + 1, centerX + titleWidth / 2, y + 1);

    y += 6;

    // NOMOR
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");
    const nomorText = `NOMOR : ${data.noSpt || "-"}`;
    pdfDoc.text(nomorText, centerX, y, { align: "center" });

    y += 10;

    // ========== DASAR ==========
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "bold");
    const dasarLabel = "Dasar :";
    pdfDoc.text(dasarLabel, marginLeft, y);

    // Dasar content (back to normal font)
    pdfDoc.setFont("helvetica", "normal");
    const dasarIndent = marginLeft + 18;
    const dasarMaxWidth = contentWidth - 18;

    // Pilih teks dasar: jika ada isinota (berarti mode Nota Dinas), gunakan format khusus
    let dasarText = "";
    if (data.isinota) {
        dasarText = `Berdasarkan arahan langsung dari Camat Salam Babaris pada tanggal ${formatTanggal(data.tanggal)}, maka dilakukan perjalanan dinas ke ${data.tujuan || "-"}.`;
    } else {
        dasarText = `Surat dari ${data.suratDari || "-"} Tanggal ${formatTanggal(data.tanggalSurat)} Perihal ${data.perihalSurat || "-"}.`;
    }

    const dasarLines = pdfDoc.splitTextToSize(dasarText, dasarMaxWidth);
    pdfDoc.text(dasarLines, dasarIndent, y);
    y += dasarLines.length * 5 + 5;

    // ========== MEMERINTAHKAN ==========
    pdfDoc.setFontSize(11);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("MEMERINTAHKAN :", centerX, y, { align: "center" });
    // Garis bawah
    const merintahWidth = pdfDoc.getTextWidth("MEMERINTAHKAN :");
    pdfDoc.setLineWidth(0.3);
    pdfDoc.line(centerX - merintahWidth / 2, y + 1, centerX + merintahWidth / 2, y + 1);

    y += 10;

    // ========== KEPADA ==========
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Kepada :", marginLeft, y);

    const labelX = marginLeft + 33;
    const colonX = labelX + 28;
    const valueX = colonX + 5;
    const valueMaxWidth = pageWidth - marginRight - valueX;

    // Render setiap pegawai
    semuaPegawai.forEach((pegawai, index) => {
        const nomor = index + 1;

        // Nomor
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.text(`${nomor}`, marginLeft + 18, y);

        // Nama
        pdfDoc.setFont("helvetica", "normal");
        pdfDoc.text("Nama", labelX, y);
        pdfDoc.text(":", colonX, y);
        pdfDoc.setFont("helvetica", "bold");
        const namaText = (pegawai.nama || pegawai.displayName || "-").toUpperCase();
        pdfDoc.text(namaText, valueX, y);
        y += 5;

        // Pangkat
        pdfDoc.setFont("helvetica", "normal");
        pdfDoc.text("Pangkat", labelX, y);
        pdfDoc.text(":", colonX, y);
        pdfDoc.text(pegawai.pangkat || "-", valueX, y);
        y += 5;

        // NIP
        pdfDoc.text("NIP", labelX, y);
        pdfDoc.text(":", colonX, y);
        pdfDoc.text(pegawai.nip || "-", valueX, y);
        y += 5;

        // Jabatan
        pdfDoc.text("Jabatan", labelX, y);
        pdfDoc.text(":", colonX, y);
        const jabatanLines = pdfDoc.splitTextToSize(pegawai.jabatan || "-", valueMaxWidth);
        pdfDoc.text(jabatanLines, valueX, y);
        y += jabatanLines.length * 5 + 3;

        // Spasi antar pegawai
        if (index < semuaPegawai.length - 1) {
            y += 2;
        }
    });

    y += 5;

    // ========== UNTUK ==========
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Untuk :", marginLeft, y);

    pdfDoc.setFont("helvetica", "normal");
    const untukIndent = marginLeft + 18;
    const untukMaxWidth = contentWidth - 18;

    // Format teks untuk
    let untukText = data.untuk || "-";
    // Tambahkan info tanggal dan lokasi
    const hariText = formatHari(data.tanggalBerangkat);
    untukText += `, pada hari ${hariText} tanggal ${formatTanggal(data.tanggalBerangkat)} waktu 09:00 WITA di ${data.tujuan || "-"} Kabupaten Tapin.`;

    const untukLines = pdfDoc.splitTextToSize(untukText, untukMaxWidth);
    pdfDoc.text(untukLines, untukIndent, y);

    y += untukLines.length * 5 + 15;

    // ========== TANDA TANGAN ==========
    // Tempat dan tanggal
    const ttdX = centerX + 15;
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");

    const tempatTanggal = `Salam Babaris,    ${formatTanggal(data.tanggal)}`;
    pdfDoc.text(tempatTanggal, ttdX, y);
    y += 5;

    pdfDoc.text("Camat Salam Babaris,", ttdX, y);
    y += 25; // Ruang untuk tanda tangan

    // Nama penandatangan (contoh - bisa diganti)
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
