import { jsPDF } from "jspdf";

export interface VisumLeg {
  tibaDi: string;
  tanggalTiba: string;
  berangkatDari: string;
  ke: string;
  tanggalBerangkat: string;
}

export interface VisumData {
  asal: string;
  tujuan: string;
  tanggalBerangkat: string;
  tanggalTiba: string;
  legs: VisumLeg[];
  tibaAkhir: string;
  tanggalTibaAkhir: string;
  kepalaNama: string;
  kepalaJabatan: string;
  kepalaNip: string;
}

const formatDate = (value: string) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const drawValue = (pdf: jsPDF, label: string, value: string, x: number, y: number, labelWidth: number, valueWidth: number) => {
  pdf.setFontSize(8);
  pdf.setFont("times", "normal");
  pdf.text(label, x, y);
  pdf.text(":", x + labelWidth, y);
  const lines = pdf.splitTextToSize(value || "", valueWidth);
  if (lines.length) pdf.text(lines[0], x + labelWidth + 3, y);
};

const drawOfficialSignature = (pdf: jsPDF, data: VisumData, x: number, y: number, width: number) => {
  pdf.setFontSize(8);
  pdf.setFont("times", "normal");
  pdf.text("Kepala", x, y);
  pdf.setFont("times", "bold");
  pdf.text(data.kepalaNama || "", x, y + 20, { maxWidth: width });
  pdf.setFont("times", "normal");
  pdf.text(data.kepalaJabatan || "", x, y + 25, { maxWidth: width });
  pdf.text(`NIP ${data.kepalaNip || ""}`, x, y + 30, { maxWidth: width });
};

export function generateVisumPDF(data: VisumData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [215, 330] });
  const margin = 12;
  const pageWidth = 215;
  const tableWidth = pageWidth - margin * 2;
  const halfWidth = tableWidth / 2;
  const leftX = margin;
  const rightX = margin + halfWidth;
  let y = 12;

  pdf.setDrawColor(0);
  pdf.setLineWidth(0.35);

  // Section I: keberangkatan dan tanda tangan pejabat.
  const firstHeight = 65;
  pdf.rect(leftX, y, halfWidth, firstHeight);
  pdf.rect(rightX, y, halfWidth, firstHeight);
  drawValue(pdf, "I.  Berangkat dari", data.asal, rightX + 4, y + 7, 39, halfWidth - 51);
  pdf.setFont("times", "normal");
  pdf.setFontSize(8);
  pdf.text("(Tempat Kedudukan)", rightX + 7, y + 12);
  drawValue(pdf, "Ke", data.tujuan, rightX + 7, y + 18, 39, halfWidth - 54);
  drawValue(pdf, "Pada Tanggal", formatDate(data.tanggalBerangkat), rightX + 7, y + 24, 39, halfWidth - 54);
  drawOfficialSignature(pdf, data, rightX + 7, y + 31, halfWidth - 14);
  y += firstHeight;

  // Section II: tiba di tujuan dan keberangkatan kembali menuju asal.
  const stopHeight = 39;
  pdf.rect(leftX, y, halfWidth, stopHeight);
  pdf.rect(rightX, y, halfWidth, stopHeight);
  drawValue(pdf, "II.  Tiba di", data.tujuan, leftX + 2, y + 7, 27, halfWidth - 35);
  drawValue(pdf, "Pada tanggal", formatDate(data.tanggalTiba), leftX + 10, y + 14, 27, halfWidth - 43);
  drawValue(pdf, "Berangkat dari", data.tujuan, rightX + 7, y + 7, 28, halfWidth - 43);
  drawValue(pdf, "Ke", data.asal, rightX + 7, y + 14, 28, halfWidth - 43);
  y += stopHeight;

  // Sections III-V remain on the form even when no intermediate stop is entered.
  const roman = ["III.", "IV.", "V."];
  roman.forEach((section, index) => {
    const leg = data.legs[index] || { tibaDi: "", tanggalTiba: "", berangkatDari: "", ke: "", tanggalBerangkat: "" };
    pdf.rect(leftX, y, halfWidth, stopHeight);
    pdf.rect(rightX, y, halfWidth, stopHeight);
    drawValue(pdf, `${section}  Tiba di`, leg.tibaDi, leftX + 2, y + 7, 27, halfWidth - 35);
    drawValue(pdf, "Pada tanggal", formatDate(leg.tanggalTiba), leftX + 10, y + 14, 27, halfWidth - 43);
    drawValue(pdf, "Berangkat dari", leg.berangkatDari, rightX + 7, y + 7, 28, halfWidth - 43);
    drawValue(pdf, "Ke", leg.ke, rightX + 7, y + 14, 28, halfWidth - 43);
    drawValue(pdf, "Pada tanggal", formatDate(leg.tanggalBerangkat), rightX + 7, y + 21, 28, halfWidth - 43);
    y += stopHeight;
  });

  // Section VI: tiba di tempat kedudukan dan pemeriksaan perjalanan.
  const finalHeight = 52;
  pdf.rect(leftX, y, halfWidth, finalHeight);
  pdf.rect(rightX, y, halfWidth, finalHeight);
  drawValue(pdf, "VI.  Tiba di", data.tibaAkhir || data.asal, leftX + 2, y + 7, 27, halfWidth - 35);
  drawValue(pdf, "Pada tanggal", formatDate(data.tanggalTibaAkhir), leftX + 10, y + 14, 27, halfWidth - 43);
  drawOfficialSignature(pdf, data, leftX + 10, y + 20, halfWidth - 20);
  pdf.setFont("times", "normal");
  const certification = "Telah diperiksa, dengan keterangan bahwa perjalanan tersebut di atas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.";
  pdf.setFontSize(8);
  pdf.text(pdf.splitTextToSize(certification, halfWidth - 14), rightX + 7, y + 8);
  y += finalHeight;

  // Sections VII-VIII: catatan dan keterangan resmi.
  pdf.rect(leftX, y, tableWidth, 7);
  pdf.setFont("times", "normal");
  pdf.setFontSize(8);
  pdf.text("VII. Catatan Lain-Lain", leftX + 2, y + 5);
  y += 7;

  const warning = "PPK yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.";
  pdf.setFontSize(8);
  const warningLines = pdf.splitTextToSize(warning, tableWidth - 8);
  const warningHeight = Math.max(22, warningLines.length * 5 + 10);
  pdf.rect(leftX, y, 9, warningHeight);
  pdf.rect(leftX + 9, y, tableWidth - 9, 6);
  pdf.rect(leftX + 9, y + 6, tableWidth - 9, warningHeight - 6);
  pdf.setFont("times", "normal");
  pdf.setFontSize(8);
  pdf.text("VIII.", leftX + 1, y + 4);
  pdf.text("PERHATIAN :", leftX + 11, y + 4);
  pdf.text(warningLines, leftX + 11, y + 11);

  const url = URL.createObjectURL(pdf.output("blob"));
  window.open(url, "_blank");
}