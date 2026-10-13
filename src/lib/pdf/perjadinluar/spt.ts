import { jsPDF } from "jspdf";
import { PerjadinLuarDoc } from "@/types/perjadinLuar";
import { drawKopSurat, formatTanggalIndonesia } from "./helpers";

export function drawSPT(pdfDoc: jsPDF, data: PerjadinLuarDoc) {
  const pageWidth = 215;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const centerX = pageWidth / 2;

  let y = drawKopSurat(pdfDoc);

  // JUDUL
  y += 4;
  pdfDoc.setFontSize(12);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("SURAT TUGAS", centerX, y, { align: "center" });

  const titleW = pdfDoc.getTextWidth("SURAT TUGAS");
  pdfDoc.setLineWidth(0.4);
  pdfDoc.line(centerX - titleW / 2, y + 1, centerX + titleW / 2, y + 1);

  y += 5;
  pdfDoc.setFontSize(10);
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text(`NOMOR : ${data.noSpt || "-"}`, centerX, y, { align: "center" });

  // DASAR
  y += 8;
  pdfDoc.setFontSize(10);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("Dasar :", marginLeft, y);

  pdfDoc.setFont("helvetica", "normal");
  const dasarText = data.suratDari || "-";
  const dasarLines = pdfDoc.splitTextToSize(dasarText, contentWidth - 18);
  pdfDoc.text(dasarLines, marginLeft + 18, y);
  y += Math.max(dasarLines.length * 4.5, 6) + 4;

  // MEMERINTAHKAN :
  pdfDoc.setFontSize(11);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("MEMERINTAHKAN :", centerX, y, { align: "center" });
  const merintahW = pdfDoc.getTextWidth("MEMERINTAHKAN :");
  pdfDoc.setLineWidth(0.3);
  pdfDoc.line(centerX - merintahW / 2, y + 1, centerX + merintahW / 2, y + 1);

  y += 8;

  // KEPADA
  pdfDoc.setFontSize(10);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("Kepada :", marginLeft, y);

  const startXList = marginLeft + 24;
  const labelW = 28;
  const colonX = startXList + labelW;
  const valueX = colonX + 4;
  const valMaxW = pageWidth - marginRight - valueX;

  data.pelaksanaList.forEach((pelaksana, idx) => {
    const noUrut = idx + 1;
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text(`${noUrut}`, marginLeft + 18, y);

    // Nama
    pdfDoc.text("Nama", startXList, y);
    pdfDoc.text(":", colonX, y);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text(pelaksana.nama || "-", valueX, y);
    y += 4.5;

    // Pangkat/Gol
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text("Pangkat/Gol", startXList, y);
    pdfDoc.text(":", colonX, y);
    pdfDoc.text(pelaksana.pangkat || "-", valueX, y);
    y += 4.5;

    // NIP
    pdfDoc.text("NIP", startXList, y);
    pdfDoc.text(":", colonX, y);
    pdfDoc.text(pelaksana.nip || "-", valueX, y);
    y += 4.5;

    // Jabatan
    pdfDoc.text("Jabatan", startXList, y);
    pdfDoc.text(":", colonX, y);
    const jabatanLines = pdfDoc.splitTextToSize(pelaksana.jabatan || "-", valMaxW);
    pdfDoc.text(jabatanLines, valueX, y);
    y += jabatanLines.length * 4.5 + 2;
  });

  y += 3;

  // UNTUK
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("Untuk :", marginLeft, y);

  pdfDoc.setFont("helvetica", "normal");
  const untukText = data.maksudPerjalanan || "-";
  const untukLines = pdfDoc.splitTextToSize(untukText, contentWidth - 18);
  pdfDoc.text(untukLines, marginLeft + 18, y);
  y += untukLines.length * 4.8 + 12;

  // TANDA TANGAN CAMAT (KANAN BAWAH)
  const ttdX = pageWidth - marginRight - 65;
  pdfDoc.text(`Salam Babaris,   ${formatTanggalIndonesia(data.tanggalSpt)}`, ttdX, y);
  y += 4.5;
  pdfDoc.text(data.jabatanPejabatTtd || "Camat Salam Babaris,", ttdX, y);

  y += 24; // Space for signature / stamp
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(data.namaPejabatTtd || "Kus Henratno, S.Sos", ttdX, y);
  y += 4.5;
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text(data.pangkatPejabatTtd || "Penata Tingkat I (III/d)", ttdX, y);
  y += 4.5;
  pdfDoc.text(`NIP. ${data.nipPejabatTtd || "19770413 201001 1 011"}`, ttdX, y);
}
