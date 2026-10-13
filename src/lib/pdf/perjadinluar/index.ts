import { jsPDF } from "jspdf";
import { PerjadinLuarDoc } from "@/types/perjadinLuar";
import { drawSPT } from "./spt";
import { drawSPPD } from "./sppd";
import { drawLaporan } from "./laporan";
import { drawRincianBiaya } from "./rincian";
import { drawPengeluaranRiil } from "./pengeluaranRiil";
import { drawTidakMenginap } from "./tidakMenginap";

export async function generatePerjadinLuarPDF(data: PerjadinLuarDoc) {
  const pdfDoc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [215, 330], // Standar kertas F4 Kedinasan
  });

  const pelaksanaList = data.pelaksanaList || [];
  let isFirstPage = true;

  const addNewPage = () => {
    if (isFirstPage) {
      isFirstPage = false;
    } else {
      pdfDoc.addPage([215, 330]);
    }
  };

  // ================= 1. SURAT TUGAS (KOLEKTIF - 1x) =================
  addNewPage();
  drawSPT(pdfDoc, data);

  // ================= 2. SPPD (INDIVIDUAL - N x PELAKSANA) =================
  for (const pelaksana of pelaksanaList) {
    addNewPage();
    drawSPPD(pdfDoc, data, pelaksana);
  }

  // ================= 3. LAPORAN KEGIATAN (KOLEKTIF - 1x) =================
  addNewPage();
  drawLaporan(pdfDoc, data);

  // ================= 4. RINCIAN BIAYA & TANDA TERIMA (INDIVIDUAL - N x PELAKSANA) =================
  for (const pelaksana of pelaksanaList) {
    addNewPage();
    drawRincianBiaya(pdfDoc, data, pelaksana);
  }

  // ================= 5. DAFTAR PENGELUARAN RIIL (INDIVIDUAL - N x PELAKSANA) =================
  for (const pelaksana of pelaksanaList) {
    addNewPage();
    drawPengeluaranRiil(pdfDoc, data, pelaksana);
  }

  // ================= 6. SURAT PERNYATAAN TIDAK MENGINAP (KONDISIONAL - N x PELAKSANA) =================
  if (data.tanpaPenginapan) {
    for (const pelaksana of pelaksanaList) {
      addNewPage();
      drawTidakMenginap(pdfDoc, data, pelaksana);
    }
  }

  // PENAMAAN DINAMIS
  const cleanSpt = (data.noSpt || "ST").replace(/[^a-zA-Z0-9]/g, "_");
  const cleanTujuan = (data.tempatTujuan || "Tujuan").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 25);
  const fileName = `SPPD_Luar_${cleanSpt}_${cleanTujuan}.pdf`;

  // Output blob
  const pdfBlob = pdfDoc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);

  const newWindow = window.open(blobUrl, "_blank");
  if (!newWindow) {
    // Fallback jika popup diblokir browser: trigger direct download
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    link.click();
  }
}
