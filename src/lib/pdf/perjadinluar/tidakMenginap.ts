import { jsPDF } from "jspdf";
import { PerjadinLuarDoc, PelaksanaLuar } from "@/types/perjadinLuar";
import { drawKopSurat, formatTanggalIndonesia } from "./helpers";

export function drawTidakMenginap(pdfDoc: jsPDF, data: PerjadinLuarDoc, pelaksana: PelaksanaLuar) {
  const pageWidth = 215;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const centerX = pageWidth / 2;

  let y = drawKopSurat(pdfDoc);

  // JUDUL
  y += 5;
  pdfDoc.setFontSize(11);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("SURAT PERNYATAAN TIDAK MENGINAP", centerX, y, { align: "center" });
  const titleW = pdfDoc.getTextWidth("SURAT PERNYATAAN TIDAK MENGINAP");
  pdfDoc.setLineWidth(0.3);
  pdfDoc.line(centerX - titleW / 2, y + 1, centerX + titleW / 2, y + 1);

  y += 8;

  // Identitas
  pdfDoc.setFontSize(9.5);
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text("Yang bertanda tangan di bawah ini :", marginLeft, y);
  y += 5.5;

  const labelX = marginLeft + 8;
  const colonX = labelX + 32;
  const valX = colonX + 4;

  pdfDoc.text("Nama", labelX, y);
  pdfDoc.text(":", colonX, y);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(pelaksana.nama || "-", valX, y);
  y += 5;

  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text("NIP", labelX, y);
  pdfDoc.text(":", colonX, y);
  pdfDoc.text(pelaksana.nip || "-", valX, y);
  y += 5;

  pdfDoc.text("Pangkat / Golongan", labelX, y);
  pdfDoc.text(":", colonX, y);
  pdfDoc.text(pelaksana.pangkat || "-", valX, y);
  y += 5;

  pdfDoc.text("Jabatan", labelX, y);
  pdfDoc.text(":", colonX, y);
  pdfDoc.text(pelaksana.jabatan || "-", valX, y);
  y += 8;

  // Dasar penugasan
  pdfDoc.text("Sehubungan dengan pelaksanaan Perjalanan Dinas berdasarkan :", marginLeft, y);
  y += 5.5;

  pdfDoc.text(`1. Surat Tugas Nomor : ${data.noSpt || "-"}, tanggal : ${formatTanggalIndonesia(data.tanggalSpt)}`, labelX, y);
  y += 5;
  pdfDoc.text(`2. Surat Perintah Perjalanan Dinas (SPPD) Nomor : ${data.noSpd || "-"}, tanggal : ${formatTanggalIndonesia(data.tanggalSpd)}`, labelX, y);
  y += 5;
  pdfDoc.text(`3. Maksud Perjalanan Dinas : ${data.maksudPerjalanan || "-"}`, labelX, y);
  y += 5;
  pdfDoc.text(`4. Tempat Tujuan : ${data.tempatTujuan || "-"}`, labelX, y);
  y += 5;
  pdfDoc.text(
    `5. Lamanya Perjalanan : ${data.lamaHari || 3} hari, tanggal ${formatTanggalIndonesia(data.tanggalBerangkat)} s/d ${formatTanggalIndonesia(data.tanggalKembali)}`,
    labelX,
    y
  );
  y += 8;

  // Pernyataan
  const p1 =
    "Dengan ini menyatakan dengan sesungguhnya bahwa selama melaksanakan perjalanan dinas dimaksud saya tidak menggunakan fasilitas hotel/penginapan dan memilih tidak menginap pada penginapan berbayar.";
  const p1Lines = pdfDoc.splitTextToSize(p1, contentWidth);
  pdfDoc.text(p1Lines, marginLeft, y);
  y += p1Lines.length * 4.8 + 4;

  const p2 =
    "Sesuai dengan ketentuan Peraturan Bupati Tapin Nomor 01 Tahun 2024 tentang Perjalanan Dinas, kepada saya diberikan biaya penginapan sebesar 30% (tiga puluh persen) dari tarif penginapan standar yang berlaku.";
  const p2Lines = pdfDoc.splitTextToSize(p2, contentWidth);
  pdfDoc.text(p2Lines, marginLeft, y);
  y += p2Lines.length * 4.8 + 4;

  const p3 = "Demikian surat pernyataan ini saya buat dengan sebenar-benarnya dan penuh rasa tanggung jawab untuk dipergunakan sebagaimana mestinya.";
  const p3Lines = pdfDoc.splitTextToSize(p3, contentWidth);
  pdfDoc.text(p3Lines, marginLeft, y);
  y += p3Lines.length * 4.8 + 14;

  // Tanda Tangan 2 Kolom
  const colLeft = marginLeft + 6;
  const colRight = pageWidth - marginRight - 65;

  pdfDoc.text("Mengetahui,", colLeft, y);
  pdfDoc.text(`Salam Babaris,   ${formatTanggalIndonesia(data.tanggalSpd)}`, colRight, y);
  y += 4.5;

  pdfDoc.text("Pengguna Anggaran /", colLeft, y);
  pdfDoc.text("Yang Membuat Pernyataan,", colRight, y);
  y += 4;

  pdfDoc.text(data.jabatanPejabatTtd || "Camat Salam Babaris", colLeft, y);
  pdfDoc.text("Pelaksana SPD,", colRight, y);

  y += 22;

  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(data.namaPejabatTtd || "Kus Henratno, S.Sos", colLeft, y);
  pdfDoc.text(pelaksana.nama || "-", colRight, y);
  y += 4.5;

  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text(`NIP. ${data.nipPejabatTtd || "19770413 201001 1 011"}`, colLeft, y);
  pdfDoc.text(`NIP. ${pelaksana.nip || "-"}`, colRight, y);
}
