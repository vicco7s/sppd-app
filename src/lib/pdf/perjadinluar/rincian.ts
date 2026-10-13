import { jsPDF } from "jspdf";
import { PerjadinLuarDoc, PelaksanaLuar } from "@/types/perjadinLuar";
import { formatTanggalIndonesia, formatRupiah, angkaKeTerbilang, terbilangHari } from "./helpers";

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
    fillColor?: number[];
  } = {}
) {
  const { align = "left", fontStyle = "normal", fontSize = 8.5, padding = 2, border = true, fillColor } = options;

  if (fillColor) {
    pdfDoc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    pdfDoc.rect(x, y, w, h, "FD");
  } else if (border) {
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

export function drawRincianBiaya(pdfDoc: jsPDF, data: PerjadinLuarDoc, pelaksana: PelaksanaLuar) {
  const pageWidth = 215;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const centerX = pageWidth / 2;

  let y = 18;

  // JUDUL
  pdfDoc.setFontSize(11);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("RINCIAN BIAYA PERJALANAN DINAS", centerX, y, { align: "center" });

  y += 8;

  // Header SPT & SPPD
  pdfDoc.setFontSize(8.5);
  pdfDoc.setFont("helvetica", "normal");
  const colLeftX = marginLeft;
  const colMidX = marginLeft + 105;

  pdfDoc.text(`Nomor & Tanggal SPT   : ${data.noSpt || "-"}`, colLeftX, y);
  pdfDoc.text(`Tanggal : ${formatTanggalIndonesia(data.tanggalSpt)}`, colMidX, y);
  y += 4.5;
  pdfDoc.text(`Nomor & Tanggal SPPD : ${data.noSpd || "-"}`, colLeftX, y);
  pdfDoc.text(`Tanggal : ${formatTanggalIndonesia(data.tanggalSpd)}`, colMidX, y);

  y += 7;

  // TABEL RINCIAN BIAYA
  const colW = [10, 36, 32, 35, 32, 30]; // Total 175 mm
  const tableX = marginLeft;

  // Header Row
  drawCell(pdfDoc, tableX, y, colW[0], 9, "NO", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0], y, colW[1], 9, "URAIAN", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], 9, "RINCIAN BIAYA\nVOLUME", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2], y, colW[3], 9, "HARGA (Rp)", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3], y, colW[4], 9, "JUMLAH Rp", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y, colW[5], 9, "KETERANGAN", { align: "center", fontStyle: "bold" });
  y += 9;

  // Layout baris mengikuti template Perbub (gambar 2):
  // 1 Biaya Transport | 2 Biaya Penginapan | 3 Uang Harian | 4 Biaya Penginapan | 5 Uang | 6+ Biaya lain

  // Baris 1: Biaya Transport (2 kali PP / 1 kali sekali jalan)
  const tVol = pelaksana.transport?.volume || "2 Kali";
  const tTarifVal = pelaksana.transport?.tarif || 0;
  const tTotalVal = pelaksana.transport?.total || 0;
  const tMult = tTarifVal ? Math.max(1, Math.round(tTotalVal / tTarifVal)) : (data.pulangPergi === false ? 1 : 2);
  const tTot = formatRupiah(tTotalVal);
  const tKet = pelaksana.transport?.keterangan || "-";
  drawCell(pdfDoc, tableX, y, colW[0], 9, "1", { align: "center" });
  drawCell(pdfDoc, tableX + colW[0], y, colW[1], 9, "Biaya Transport", { fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], 9, tVol);
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2], y, colW[3], 9, `${tMult} x ${formatRupiah(tTarifVal)}`);
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3], y, colW[4], 9, tTot, { align: "right" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y, colW[5], 9, tKet);
  y += 9;

  // Baris 2: Biaya Penginapan (baris placeholder kosong sesuai template)
  drawCell(pdfDoc, tableX, y, colW[0], 9, "2", { align: "center" });
  drawCell(pdfDoc, tableX + colW[0], y, colW[1], 9, "Biaya Penginapan", { fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], 9, "");
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2], y, colW[3], 9, "");
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3], y, colW[4], 9, "");
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y, colW[5], 9, "");
  y += 9;

  // Baris 3: Uang Harian
  const uhList = pelaksana.uangHarian || [];
  const hUh = Math.max(uhList.length * 5.5 + 4, 12);
  const uhVolText = uhList.map((u) => `${u.hari} (${terbilangHari(u.hari)}) Hari`).join("\n");
  const uhHargaText = uhList.map((u) => `${u.hari} x ${formatRupiah(u.tarif)}`).join("\n");
  const uhTotText = uhList.map((u) => formatRupiah(u.total)).join("\n");

  drawCell(pdfDoc, tableX, y, colW[0], hUh, "3", { align: "center" });
  drawCell(pdfDoc, tableX + colW[0], y, colW[1], hUh, "Uang Harian", { fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], hUh, uhVolText);
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2], y, colW[3], hUh, uhHargaText);
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3], y, colW[4], hUh, uhTotText, { align: "right" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y, colW[5], hUh, "");
  y += hUh;

  // Baris 4: Biaya Penginapan (persen mengikuti toggle tanpa penginapan)
  const pMalam = pelaksana.penginapan?.malam || 0;
  const pTarif = pelaksana.penginapan?.tarifStandar || 0;
  const persen = pelaksana.penginapan?.persen ?? (data.tanpaPenginapan ? 30 : 100);
  const isTanpa = persen < 100;
  const pKet = isTanpa ? "Tanpa Menginap\nDi Hotel Berbayar" : "Hotel Berbayar";
  const pTotVal = pelaksana.penginapan?.total || Math.round(pTarif * (persen / 100) * pMalam);
  const pHargaText = `${pTarif} x ${persen}%\n(${formatRupiah(Math.round(pTarif * (persen / 100)))})`;

  drawCell(pdfDoc, tableX, y, colW[0], 12, "4", { align: "center" });
  drawCell(pdfDoc, tableX + colW[0], y, colW[1], 12, "Biaya Penginapan", { fontStyle: "bold" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], 12, `${pMalam} Malam`);
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2], y, colW[3], 12, pHargaText);
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3], y, colW[4], 12, formatRupiah(pTotVal), { align: "right" });
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y, colW[5], 12, pKet);
  y += 12;

  // Baris 5: Uang (baris placeholder kosong sesuai template)
  drawCell(pdfDoc, tableX, y, colW[0], 8, "5", { align: "center" });
  drawCell(pdfDoc, tableX + colW[0], y, colW[1], 8, "Uang");
  drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], 8, "");
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2], y, colW[3], 8, "");
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3], y, colW[4], 8, "");
  drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y, colW[5], 8, "");
  y += 8;

  // Baris tambahan: jenis biaya lain (manual)
  let extraNo = 6;
  (pelaksana.biayaLain || []).forEach((b) => {
    drawCell(pdfDoc, tableX, y, colW[0], 9, String(extraNo), { align: "center" });
    drawCell(pdfDoc, tableX + colW[0], y, colW[1], 9, b.uraian || "Biaya Lain", { fontStyle: "bold" });
    drawCell(pdfDoc, tableX + colW[0] + colW[1], y, colW[2], 9, b.volume || "");
    drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2], y, colW[3], 9, b.tarif ? formatRupiah(b.tarif) : "");
    drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3], y, colW[4], 9, formatRupiah(b.total || 0), { align: "right" });
    drawCell(pdfDoc, tableX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4], y, colW[5], 9, b.keterangan || "");
    y += 9;
    extraNo++;
  });

  // TOTAL ROW
  const grandTotal = pelaksana.totalBiaya || (pelaksana.transport?.total || 0) + (uhList.reduce((acc, cur) => acc + cur.total, 0)) + pTotVal + (pelaksana.biayaLain || []).reduce((acc, cur) => acc + (cur.total || 0), 0);
  const wSpanLeft = colW[0] + colW[1] + colW[2] + colW[3];
  drawCell(pdfDoc, tableX, y, wSpanLeft, 7, "Total Biaya Perjalanan Dinas", { fontStyle: "bold" });
  drawCell(pdfDoc, tableX + wSpanLeft, y, colW[4], 7, formatRupiah(grandTotal), { align: "right", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + wSpanLeft + colW[4], y, colW[5], 7, "");
  y += 7;

  // TERBILANG ROW
  const terbilangStr = `Terbilang : ${angkaKeTerbilang(grandTotal)} Rupiah`;
  drawCell(pdfDoc, tableX, y, contentWidth, 7, terbilangStr, { fontStyle: "bold" });
  y += 12;

  // Tanda tangan Pelaksana SPD
  const ttdX = pageWidth - marginRight - 65;
  pdfDoc.setFontSize(8.5);
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text(`Salam Babaris,   ${formatTanggalIndonesia(data.tanggalSpd)}`, ttdX, y);
  y += 4;
  pdfDoc.text("Pelaksana SPD,", ttdX, y);

  y += 18; // space ttd
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(pelaksana.nama || "-", ttdX, y);
  y += 4;
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text(`NIP.  ${pelaksana.nip || "-"}`, ttdX, y);

  y += 10;

  // ================= TANDA TERIMA BIAYA PERJALANAN DINAS =================
  pdfDoc.setFontSize(10);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("TANDA TERIMA BIAYA PERJALANAN DINAS", centerX, y, { align: "center" });
  const ttW = pdfDoc.getTextWidth("TANDA TERIMA BIAYA PERJALANAN DINAS");
  pdfDoc.setLineWidth(0.3);
  pdfDoc.line(centerX - ttW / 2, y + 1, centerX + ttW / 2, y + 1);

  y += 5;

  const ttColW = [10, 48, 26, 35, 34, 22]; // Total 175 mm
  // Header
  drawCell(pdfDoc, tableX, y, ttColW[0], 8, "No.", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + ttColW[0], y, ttColW[1], 8, "NAMA/NIP", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + ttColW[0] + ttColW[1], y, ttColW[2], 8, "PANGKAT\n/ GOL", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + ttColW[0] + ttColW[1] + ttColW[2], y, ttColW[3], 8, "JUMLAH UANG\nYANG DITERIMA", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + ttColW[0] + ttColW[1] + ttColW[2] + ttColW[3], y, ttColW[4], 8, "NOMOR REKENING\nPENERIMA", { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + ttColW[0] + ttColW[1] + ttColW[2] + ttColW[3] + ttColW[4], y, ttColW[5], 8, "TANDA\nTANGAN", { align: "center", fontStyle: "bold" });
  y += 8;

  // Row Data
  const rowH = 12;
  drawCell(pdfDoc, tableX, y, ttColW[0], rowH, "1", { align: "center" });
  drawCell(pdfDoc, tableX + ttColW[0], y, ttColW[1], rowH, `${pelaksana.nama}\n${pelaksana.nip}`, { fontStyle: "bold" });
  drawCell(pdfDoc, tableX + ttColW[0] + ttColW[1], y, ttColW[2], rowH, pelaksana.pangkat || "-", { align: "center" });
  drawCell(pdfDoc, tableX + ttColW[0] + ttColW[1] + ttColW[2], y, ttColW[3], rowH, formatRupiah(grandTotal), { align: "center", fontStyle: "bold" });
  drawCell(pdfDoc, tableX + ttColW[0] + ttColW[1] + ttColW[2] + ttColW[3], y, ttColW[4], rowH, pelaksana.noRekening || "-", { align: "center" });
  drawCell(pdfDoc, tableX + ttColW[0] + ttColW[1] + ttColW[2] + ttColW[3] + ttColW[4], y, ttColW[5], rowH, "");
}
