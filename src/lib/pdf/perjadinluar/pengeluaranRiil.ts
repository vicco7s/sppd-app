import { jsPDF } from "jspdf";
import { PerjadinLuarDoc, PelaksanaLuar } from "@/types/perjadinLuar";
import { formatTanggalIndonesia, formatRupiah } from "./helpers";

function drawCell(
  pdfDoc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string | string[],
  options: {
    align?: "left" | "center" | "right";
    fontStyle?: "normal" | "bold";
    fontSize?: number;
    padding?: number;
    border?: boolean;
  } = {}
) {
  const { align = "left", fontStyle = "normal", fontSize = 9, padding = 2, border = true } = options;

  if (border) {
    pdfDoc.setDrawColor(0);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.rect(x, y, w, h);
  }

  pdfDoc.setFontSize(fontSize);
  pdfDoc.setFont("helvetica", fontStyle);

  const textX = align === "center" ? x + w / 2 : align === "right" ? x + w - padding : x + padding;
  const lineH = fontSize * 0.352778 * 1.25;

  let lines: string[] = [];
  if (Array.isArray(text)) {
    lines = text;
  } else if (text) {
    lines = pdfDoc.splitTextToSize(String(text), w - padding * 2);
  }

  const startY = y + padding + lineH * 0.75;
  lines.forEach((line, idx) => {
    if (startY + idx * lineH <= y + h) {
      pdfDoc.text(line, textX, startY + idx * lineH, { align });
    }
  });
}

export function drawPengeluaranRiil(pdfDoc: jsPDF, data: PerjadinLuarDoc, pelaksana: PelaksanaLuar) {
  const pageWidth = 215;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const centerX = pageWidth / 2;

  let y = 20;

  // JUDUL
  pdfDoc.setFontSize(12);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("DAFTAR PENGELUARAN RIIL", centerX, y, { align: "center" });

  y += 12;

  // Yang bertanda tangan di bawah ini
  pdfDoc.setFontSize(9.5);
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text("Yang bertanda tangan di bawah ini :", marginLeft, y);
  y += 6;

  const labelX = marginLeft + 10;
  const colonX = labelX + 22;
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

  pdfDoc.text("Jabatan", labelX, y);
  pdfDoc.text(":", colonX, y);
  pdfDoc.text(pelaksana.jabatan || "-", valX, y);
  y += 8;

  // Paragraf Dasar
  const introText = `Berdasarkan Surat Tugas (ST) Nomor : ${data.noSpt || "-"}, tanggal : ${formatTanggalIndonesia(data.tanggalSpt)} dan Surat Perintah Perjalanan Dinas (SPPD) Nomor : ${data.noSpd || "-"}, tanggal : ${formatTanggalIndonesia(data.tanggalSpd)}, dengan ini menyatakan dengan sesungguhnya bahwa :`;
  const introLines = pdfDoc.splitTextToSize(introText, contentWidth);
  pdfDoc.text(introLines, marginLeft, y);
  y += introLines.length * 4.8 + 5;

  // Poin 1
  pdfDoc.text("1.", marginLeft, y);
  const poin1Text = "Biaya Transportasi dibawah ini yang tidak dapat di peroleh bukti – bukti pengeluarannya,Meliputi :";
  pdfDoc.text(poin1Text, marginLeft + 6, y);
  y += 6;

  // TABEL BIAYA RIIL
  const colW = [14, 116, 45]; // Total 175 mm
  const tableX = marginLeft;
  const totalTransport = pelaksana.transport?.total || 378000;
  const transportUraian = `PP Salam Babaris - ${data.tempatTujuan?.replace(/Hotel\s*/i, "") || "Banjarmasin"} (${formatRupiah(totalTransport)},-)`;

  // Header
  drawCell(pdfDoc, tableX, y, colW[0], 7, "No", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0], y, colW[1], 7, "Uraian", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], 7, "Jumlah", { align: "center", fontStyle: "bold" });
  y += 7;

  // Row 1
  drawCell(pdfDoc, tableX, y, colW[0], 9, "1", { align: "center" });
  drawCell(pdfDoc, tableX + colW[0], y, colW[1], 9, transportUraian);
  drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], 9, formatRupiah(totalTransport), { align: "right" });
  y += 9;

  // Row Jumlah
  drawCell(pdfDoc, tableX, y, colW[0] + colW[1], 7, "Jumlah", { align: "right", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], 7, formatRupiah(totalTransport), { align: "right", fontStyle: "bold" });
  y += 12;

  // Poin 2
  pdfDoc.text("2.", marginLeft, y);
  const poin2Text =
    "Jumlah uang tersebut pada angka 1 di atas benar – benar dikeluarkan untuk pelaksanaan Perjalanan Dinas dimaksud dan apabila di kemudian hari terdapat kelebihan atas pembayaran, saya bersedia untuk menyetorkan kelebihan tersebut ke kas Daerah.";
  const poin2Lines = pdfDoc.splitTextToSize(poin2Text, contentWidth - 6);
  pdfDoc.text(poin2Lines, marginLeft + 6, y);
  y += poin2Lines.length * 4.8 + 6;

  // Penutup
  const closingText = "Demikian pernyataan ini dibuat dengan sebenarnya, untuk dipergunakan sebagaimana mestinya.";
  pdfDoc.text(closingText, marginLeft, y);
  y += 14;

  // TANDA TANGAN 2 KOLOM
  const colLeft = marginLeft + 6;
  const colRight = pageWidth - marginRight - 65;

  pdfDoc.text("Mengetahui / Menyetujui :", colLeft, y);
  pdfDoc.text(`Rantau,   ${formatTanggalIndonesia(data.tanggalSpd)}`, colRight, y);
  y += 4.5;

  pdfDoc.text("Pengguna Anggaran,", colLeft, y);
  pdfDoc.text("Pelaksana SPPD,", colRight, y);
  y += 4;

  pdfDoc.text(data.jabatanPejabatTtd || "Camat Salam Babaris", colLeft, y);

  y += 22; // space ttd

  // Nama Pejabat & Nama Pelaksana
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(data.namaPejabatTtd || "Kus Henratno, S.Sos", colLeft, y);
  pdfDoc.text(pelaksana.nama || "-", colRight, y);
  y += 4.5;

  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text(`NIP. ${data.nipPejabatTtd || "19770413 201001 1 011"}`, colLeft, y);
  pdfDoc.text(`NIP. ${pelaksana.nip || "-"}`, colRight, y);
}
