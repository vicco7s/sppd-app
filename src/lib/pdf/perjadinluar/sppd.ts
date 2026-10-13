import { jsPDF } from "jspdf";
import { PerjadinLuarDoc, PelaksanaLuar } from "@/types/perjadinLuar";
import { drawKopSurat, formatTanggalIndonesia, terbilangHari } from "./helpers";

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
  const { align = "left", fontStyle = "normal", fontSize = 8.5, padding = 2, border = true } = options;

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

export function drawSPPD(pdfDoc: jsPDF, data: PerjadinLuarDoc, pelaksanaUtama: PelaksanaLuar) {
  const pageWidth = 215;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const centerX = pageWidth / 2;

  let y = drawKopSurat(pdfDoc);

  // Lembar ke / Kode No / Nomor (Kanan Atas)
  y += 2;
  const infoX = pageWidth - marginRight - 65;
  pdfDoc.setFontSize(8.5);
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text("Lembar ke :", infoX, y);
  y += 3.8;
  pdfDoc.text("Kode No.   :", infoX, y);
  y += 3.8;
  pdfDoc.text(`Nomor       : ${data.noSpd || "-"}`, infoX, y);

  y += 6;
  pdfDoc.setFontSize(11);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("SURAT PERINTAH PERJALANAN DINAS", centerX, y, { align: "center" });

  y += 5;

  // TABEL SPPD
  const col1W = 12; // No
  const col2W = 75; // Keterangan
  const col3W = 88; // Isi
  const tableX = marginLeft;

  // 01. Pengguna Anggaran
  drawCell(pdfDoc, tableX, y, col1W, 7, "01.", { align: "center" });
  drawCell(pdfDoc, tableX + col1W, y, col2W, 7, "Pengguna Anggaran/Kuasa Pengguna Anggaran");
  drawCell(pdfDoc, tableX + col1W + col2W, y, col3W, 7, data.jabatanPejabatTtd || "Camat Salam Babaris");
  y += 7;

  // 02. Nama/NIP
  const namaNipText = `${pelaksanaUtama.nama || "-"}\n${pelaksanaUtama.nip || "-"}`;
  drawCell(pdfDoc, tableX, y, col1W, 10, "02.", { align: "center" });
  drawCell(pdfDoc, tableX + col1W, y, col2W, 10, "Nama/NIP Pegawai yang melaksanakan\nperjalanan dinas");
  drawCell(pdfDoc, tableX + col1W + col2W, y, col3W, 10, namaNipText, { fontStyle: "bold" });
  y += 10;

  // 03. Pangkat, Jabatan, Tingkat Biaya
  drawCell(pdfDoc, tableX, y, col1W, 15, "03.", { align: "center" });
  drawCell(pdfDoc, tableX + col1W, y, col2W, 15, "a. Pangkat dan Golongan\nb. Jabatan/Instansi\nc. Tingkat Biaya Perjalanan Dinas");
  drawCell(pdfDoc, tableX + col1W + col2W, y, col3W, 15, `a. ${pelaksanaUtama.pangkat || "-"}\nb. ${pelaksanaUtama.jabatan || "-"}\nc. -`);
  y += 15;

  // 04. Maksud
  const maksudLines = pdfDoc.splitTextToSize(data.maksudPerjalanan || "-", col3W - 4);
  const hMaksud = Math.max(maksudLines.length * 4.2 + 3, 9);
  drawCell(pdfDoc, tableX, y, col1W, hMaksud, "04.", { align: "center" });
  drawCell(pdfDoc, tableX + col1W, y, col2W, hMaksud, "Maksud Perjalanan Dinas");
  drawCell(pdfDoc, tableX + col1W + col2W, y, col3W, hMaksud, maksudLines);
  y += hMaksud;

  // 05. Alat angkutan
  drawCell(pdfDoc, tableX, y, col1W, 7, "05.", { align: "center" });
  drawCell(pdfDoc, tableX + col1W, y, col2W, 7, "Alat angkutan yang digunakan");
  drawCell(pdfDoc, tableX + col1W + col2W, y, col3W, 7, data.alatAngkutan || "Kendaraan Umum");
  y += 7;

  // 06. Tempat berangkat & tujuan
  drawCell(pdfDoc, tableX, y, col1W, 11, "06.", { align: "center" });
  drawCell(pdfDoc, tableX + col1W, y, col2W, 11, "a. Tempat berangkat\nb. Tempat tujuan");
  drawCell(pdfDoc, tableX + col1W + col2W, y, col3W, 11, `a. ${data.tempatBerangkat || "Kecamatan Salam Babaris"}\nb. ${data.tempatTujuan || "-"}`);
  y += 11;

  // 07. Lamanya berangkat, tgl berangkat, tgl kembali
  const tglBerangkatStr = formatTanggalIndonesia(data.tanggalBerangkat);
  const tglKembaliStr = formatTanggalIndonesia(data.tanggalKembali);
  const lamaStr = `${data.lamaHari || 3} (${terbilangHari(data.lamaHari || 3)}) Hari`;
  drawCell(pdfDoc, tableX, y, col1W, 15, "07.", { align: "center" });
  drawCell(pdfDoc, tableX + col1W, y, col2W, 15, "a. Lamanya berangkat\nb. Tanggal berangkat\nc. Tanggal harus kembali/tiba ditempat baru");
  drawCell(pdfDoc, tableX + col1W + col2W, y, col3W, 15, `a. ${lamaStr}\nb. ${tglBerangkatStr}\nc. ${tglKembaliStr}`);
  y += 15;

  // 08. Pengikut (Pelaksana lain selain pelaksanaUtama)
  const pengikutList = data.pelaksanaList.filter((p) => p.nip !== pelaksanaUtama.nip);
  const pengikutRows = Math.max(pengikutList.length, 1);
  const hPengikut = 6 + pengikutRows * 5.5;

  drawCell(pdfDoc, tableX, y, col1W, hPengikut, "08.", { align: "center" });
  // Sub-header pengikut
  drawCell(pdfDoc, tableX + col1W, y, 70, 6, "Pengikut : Nama", { fontStyle: "bold" });
  drawCell(pdfDoc, tableX + col1W + 70, y, 45, 6, "Tanggal Lahir", { fontStyle: "bold", align: "center" });
  drawCell(pdfDoc, tableX + col1W + 115, y, col3W + col2W - 115, 6, "Keterangan", { fontStyle: "bold", align: "center" });

  let subY = y + 6;
  if (pengikutList.length === 0) {
    drawCell(pdfDoc, tableX + col1W, subY, 70, 5.5, "-");
    drawCell(pdfDoc, tableX + col1W + 70, subY, 45, 5.5, "-", { align: "center" });
    drawCell(pdfDoc, tableX + col1W + 115, subY, col3W + col2W - 115, 5.5, "-", { align: "center" });
  } else {
    pengikutList.forEach((pengikut, pIdx) => {
      drawCell(pdfDoc, tableX + col1W, subY, 70, 5.5, `${pIdx + 1}. ${pengikut.nama}`);
      drawCell(pdfDoc, tableX + col1W + 70, subY, 45, 5.5, pengikut.tanggalLahir || "-", { align: "center" });
      drawCell(pdfDoc, tableX + col1W + 115, subY, col3W + col2W - 115, 5.5, "-", { align: "center" });
      subY += 5.5;
    });
  }
  y += hPengikut;

  // 09. Pembebanan Anggaran
  drawCell(pdfDoc, tableX, y, col1W, 11, "09.", { align: "center" });
  drawCell(pdfDoc, tableX + col1W, y, col2W, 11, "Pembebanan Anggaran :\na. SKPD\nb. Kode Rekening");
  drawCell(pdfDoc, tableX + col1W + col2W, y, col3W, 11, `\na. ${data.pembebananSkpd || "Kantor Kecamatan Salam Babaris"}\nb. ${data.kodeRekening || "5.1.02.04.01.0001"}`);
  y += 11;

  // 10. Keterangan lain-lain
  drawCell(pdfDoc, tableX, y, col1W, 7, "10.", { align: "center" });
  drawCell(pdfDoc, tableX + col1W, y, col2W, 7, "Keterangan lain-lain");
  drawCell(pdfDoc, tableX + col1W + col2W, y, col3W, 7, ":");
  y += 12;

  // TANDA TANGAN (KANAN BAWAH)
  const ttdX = pageWidth - marginRight - 65;
  pdfDoc.setFontSize(8.5);
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text(`Dikeluarkan di : Salam Babaris`, ttdX, y);
  y += 4;
  pdfDoc.text(`Pada tanggal   : ${formatTanggalIndonesia(data.tanggalSpd)}`, ttdX, y);
  y += 4.5;
  pdfDoc.text("Pengguna Anggaran/Kuasa Pengguna", ttdX, y);
  y += 4;
  pdfDoc.text("Anggaran", ttdX, y);

  y += 22; // signature space
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text(data.namaPejabatTtd || "Kus Henratno, S.Sos", ttdX, y);
  y += 4.5;
  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text(data.pangkatPejabatTtd || "Penata Tingkat I (III/d)", ttdX, y);
  y += 4.5;
  pdfDoc.text(`NIP. ${data.nipPejabatTtd || "19770413 201001 1011"}`, ttdX, y);
}
