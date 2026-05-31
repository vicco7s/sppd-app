import { jsPDF } from "jspdf";
import { db } from "@/services/firebases";
import { doc, getDoc } from "firebase/firestore";
import { formatTanggal } from "../perjadinkota/spt";

/**
 * Ambil data pegawai dari Firestore berdasarkan ID
 */
async function fetchPegawai(id) {
    if (!id) return null;
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
    }).format(number).replace("Rp", "Rp.");
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

export async function generateKwitansiPDF(data) {
    // Fetch detailed pegawai data to get NIP
    const pegawaiData = await fetchPegawai(data.pegawaiId);
    
    const pdfDoc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [215, 330], // F4 size
    });

    const marginLeft = 15;
    const marginRight = 15;
    const pageWidth = 215;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let y = 15;

    // Header Info (Program, Kegiatan, etc.)
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("helvetica", "normal");

    const drawHeaderRow = (label, value, yPos) => {
        pdfDoc.text(label, marginLeft, yPos);
        pdfDoc.text(":", marginLeft + 35, yPos);
        // Multi-line value support
        const lines = pdfDoc.splitTextToSize(value || "-", contentWidth - 45);
        pdfDoc.text(lines, marginLeft + 38, yPos);
        return yPos + (lines.length * 4);
    };

    y = drawHeaderRow("Program", data.program, y);
    y = drawHeaderRow("Kegiatan", data.kegiatan, y);
    y = drawHeaderRow("Sub Kegiatan", data.subKegiatan, y);
    y = drawHeaderRow("Kode Rekening", data.kodeRekening, y);
    y = drawHeaderRow("Nama Rekening", data.namaRekeningBelanja, y);

    // No. BKU at the top right
    pdfDoc.text(`No. BKU : .................../CSB/2026`, pageWidth - marginRight - 50, 10);

    y += 5;
    // Double line separator
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(marginLeft, y, pageWidth - marginRight, y);
    pdfDoc.setLineWidth(0.2);
    pdfDoc.line(marginLeft, y + 0.8, pageWidth - marginRight, y + 0.8);

    y += 12;
    // Main Title
    pdfDoc.setFontSize(22);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("KWITANSI", pageWidth / 2, y, { align: "center" });
    const kwitansiW = pdfDoc.getTextWidth("KWITANSI");
    pdfDoc.line(pageWidth / 2 - kwitansiW / 2, y + 1, pageWidth / 2 + kwitansiW / 2, y + 1);

    y += 15;
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");

    // "Sudah terima dari"
    pdfDoc.text("Sudah terima dari", marginLeft, y);
    pdfDoc.text(":", marginLeft + 35, y);
    const bendaharaText = "BENDAHARA PENGELUARAN KECAMATAN SALAM BABARIS KABUPATEN TAPIN DI RANTAU";
    const bendaharaLines = pdfDoc.splitTextToSize(bendaharaText, contentWidth - 45);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text(bendaharaLines, marginLeft + 38, y);
    y += (bendaharaLines.length * 5) + 2;

    // "Uang Sejumlah"
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("Uang Sejumlah", marginLeft, y);
    pdfDoc.text(":", marginLeft + 35, y);
    const nominalTerbilang = `${terbilang(data.nominal)} Rupiah`;
    pdfDoc.setFont("helvetica", "bolditalic");
    pdfDoc.text(nominalTerbilang, marginLeft + 38, y);
    y += 7;

    // "Buat Keperluan"
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("Buat Keperluan", marginLeft, y);
    pdfDoc.text(":", marginLeft + 35, y);
    const keperluanText = data.keperluan || "-";
    const keperluanLines = pdfDoc.splitTextToSize(keperluanText, contentWidth - 45);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text(keperluanLines, marginLeft + 38, y);
    y += (keperluanLines.length * 5) + 5;

    // Recipient Info
    const drawRecipientRow = (label, value, yPos) => {
        pdfDoc.text(label, marginLeft, yPos);
        pdfDoc.text(":", marginLeft + 35, yPos);
        pdfDoc.text(value || "-", marginLeft + 38, yPos);
        return yPos + 5;
    };

    y = drawRecipientRow("Nama Rekening", data.namaRekening, y);
    y = drawRecipientRow("Nomor Rekening", data.nomorRekening, y);
    y = drawRecipientRow("Nama Bank", data.namaBank, y);

    y += 5;
    // Financial Details
    const nominalBruto = Number(data.nominal) || 0;
    
    // Safety check: force 0 tax if it's a Perjadin account
    const nameLow = (data.namaRekeningBelanja || "").toLowerCase();
    const codeLow = (data.kodeRekening || "").toLowerCase();
    const isExempt = nameLow.includes("perjalanan dinas") || codeLow.includes("5.1.02.04.01");

    const valPPN = (!isExempt && data.ppn) ? (nominalBruto * data.ppn / 100) : 0;
    const valPPH22 = (!isExempt && data.pph22) ? (nominalBruto * 0.015) : 0;
    const valPPH23 = (!isExempt && data.pph23) ? (nominalBruto * 0.02) : 0;
    const nominalNetto = nominalBruto - valPPN - valPPH22 - valPPH23;

    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Bruto", marginLeft, y);
    pdfDoc.text(":", marginLeft + 35, y);
    pdfDoc.text(formatRupiah(nominalBruto), marginLeft + 38, y);
    y += 5;

    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("Potongan Pajak :", marginLeft, y);
    y += 5;
    pdfDoc.text(`PPN ${data.ppn ? `(${data.ppn}%)` : ""}`, marginLeft + 5, y);
    pdfDoc.text(":", marginLeft + 35, y);
    pdfDoc.text(valPPN > 0 ? formatRupiah(valPPN) : "Rp. -", marginLeft + 38, y);
    y += 5;
    pdfDoc.text("PPh Ps.22", marginLeft + 5, y);
    pdfDoc.text(":", marginLeft + 35, y);
    pdfDoc.text(valPPH22 > 0 ? formatRupiah(valPPH22) : "Rp. -", marginLeft + 38, y);
    y += 5;
    pdfDoc.text("PPh Ps.23", marginLeft + 5, y);
    pdfDoc.text(":", marginLeft + 35, y);
    pdfDoc.text(valPPH23 > 0 ? formatRupiah(valPPH23) : "Rp. -", marginLeft + 38, y);
    y += 7;

    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Netto", marginLeft, y);
    pdfDoc.text(":", marginLeft + 35, y);
    pdfDoc.text(formatRupiah(nominalNetto), marginLeft + 38, y);

    y += 5;
    // --- PENGATURAN PANJANG GARIS PEMBATAS (DI ATAS TERBILANG) ---
    // Ubah nilai 0 di bawah ini untuk memperpendek garis (makin besar makin pendek)
    const kurangPambatas = 100; 
    const garisPembatasX = pageWidth - marginRight - kurangPambatas;

    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(marginLeft, y, garisPembatasX, y);
    pdfDoc.setLineWidth(0.2);
    pdfDoc.line(marginLeft, y + 0.8, garisPembatasX, y + 0.8);
    y += 5;

    pdfDoc.setFont("helvetica", "bolditalic");
    pdfDoc.text(`Terbilang   ${formatRupiah(nominalNetto)}`, marginLeft, y);
    y += 2;
    // --- PENGATURAN PANJANG GARIS TERBILANG ---
    // Ubah nilai 100 di bawah ini untuk memperpajang/memperpendek garis (makin besar makin pendek)
    const penguranganPanjang = 100; 
    const garisAkhirX = pageWidth - marginRight - penguranganPanjang;

    pdfDoc.line(marginLeft, y + 1, garisAkhirX, y + 1); // Garis pertama
    pdfDoc.line(marginLeft, y + 2, garisAkhirX, y + 2); // Garis kedua

    y += 15;
    // Signature Table Area
    const boxWidth = contentWidth / 2;
    const boxHeight = 35;
    
    // PPTK & Penerima Box
    pdfDoc.setLineWidth(0.3);
    pdfDoc.rect(marginLeft, y, boxWidth, boxHeight);
    pdfDoc.rect(marginLeft + boxWidth, y, boxWidth, boxHeight);

    pdfDoc.setFontSize(9);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("PPTK,", marginLeft + boxWidth / 2, y + 5, { align: "center" });
    
    const formattedDate = formatTanggal(data.tanggal);
    pdfDoc.text(`Rantau, ${formattedDate}`, marginLeft + boxWidth + 5, y + 5);
    pdfDoc.text("Penerima Uang,", marginLeft + boxWidth + boxWidth / 2, y + 10, { align: "center" });

    // PPTK Name (Hardcoded from image as sample or use generic)
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Nili, S.Sos", marginLeft + boxWidth / 2, y + boxHeight - 7, { align: "center" });
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("NIP. 198409302014062004", marginLeft + boxWidth / 2, y + boxHeight - 3, { align: "center" });

    // Recipient Name
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text(data.namaRekening?.toUpperCase() || "-", marginLeft + boxWidth + boxWidth / 2, y + boxHeight - 7, { align: "center" });
    pdfDoc.setFont("helvetica", "normal");
    
    // Show NIP from fetched pegawai data
    const recipientNip = pegawaiData?.nip || "...........................................";
    pdfDoc.text(`NIP. ${recipientNip}`, marginLeft + boxWidth + boxWidth / 2, y + boxHeight - 3, { align: "center" });

    y += boxHeight;

    // Mengetahui & Lunas Dibayar Box
    pdfDoc.rect(marginLeft, y, boxWidth, boxHeight + 10);
    pdfDoc.rect(marginLeft + boxWidth, y, boxWidth, boxHeight + 10);

    pdfDoc.text("Mengetahui :", marginLeft + boxWidth / 2, y + 5, { align: "center" });
    pdfDoc.text("Atasan Langsung Bendahara Pengeluaran", marginLeft + boxWidth / 2, y + 9, { align: "center" });
    pdfDoc.text("Kecamatan Salam Babaris Kabupaten Tapin", marginLeft + boxWidth / 2, y + 13, { align: "center" });

    pdfDoc.text(`Lunas Dibayar Tanggal : ..................................`, marginLeft + boxWidth + 5, y + 5);
    pdfDoc.text("Bendahara Pengeluaran", marginLeft + boxWidth + boxWidth / 2, y + 9, { align: "center" });
    pdfDoc.text("Kecamatan Salam Babaris Kabupaten Tapin,", marginLeft + boxWidth + boxWidth / 2, y + 13, { align: "center" });

    // Hardcoded Atasan and Bendahara from image
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Kus Henratmo S.Sos", marginLeft + boxWidth / 2, y + boxHeight + 3, { align: "center" });
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("NIP. 197704132010011011", marginLeft + boxWidth / 2, y + boxHeight + 7, { align: "center" });

    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Siswanto", marginLeft + boxWidth + boxWidth / 2, y + boxHeight + 3, { align: "center" });
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("NIP. 196905102009061006", marginLeft + boxWidth + boxWidth / 2, y + boxHeight + 7, { align: "center" });

    // Output
    const pdfBlob = pdfDoc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
}
