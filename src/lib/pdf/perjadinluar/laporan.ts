import { jsPDF } from "jspdf";
import { PerjadinLuarDoc } from "@/types/perjadinLuar";
import { drawKopSurat, formatTanggalIndonesia } from "./helpers";

function drawParagraph(
  pdfDoc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  pageHeight: number,
  marginBottom: number,
  align: "left" | "justify" = "left"
): number {
  if (!text) return y;
  const paragraphs = String(text).split("\n");

  for (let p = 0; p < paragraphs.length; p++) {
    const lines = pdfDoc.splitTextToSize(paragraphs[p], maxWidth);
    for (let i = 0; i < lines.length; i++) {
      if (y + lineHeight > pageHeight - marginBottom) {
        pdfDoc.addPage([215, 330]);
        y = 20;
      }
      const isLast = i === lines.length - 1;
      if (align === "justify" && !isLast) {
        pdfDoc.text(lines[i] + "\n ", x, y, { align: "justify", maxWidth });
      } else {
        pdfDoc.text(lines[i], x, y);
      }
      y += lineHeight;
    }
  }
  return y;
}

export function drawLaporan(pdfDoc: jsPDF, data: PerjadinLuarDoc) {
  const pageWidth = 215;
  const pageHeight = 330;
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const centerX = pageWidth / 2;
  const marginBottom = 20;
  const lineHeight = 4.8;

  let y = drawKopSurat(pdfDoc, "Alamat : Jalan Transmigrasi Utara No. 02 Desa Salam Babaris Kode Pos 71182");

  // JUDUL
  y += 4;
  pdfDoc.setFontSize(11);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("LAPORAN", centerX, y, { align: "center" });
  y += 4.5;
  pdfDoc.text("TENTANG KEGIATAN PERJALANAN DINAS LUAR DAERAH", centerX, y, { align: "center" });
  y += 8;

  pdfDoc.setFontSize(9.5);
  pdfDoc.setFont("helvetica", "normal");

  const indentA = marginLeft;
  const indentB = marginLeft + 6;
  const indentC = marginLeft + 14;
  const textWidth = contentWidth - 14;

  // A. PENDAHULUAN
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("A.", indentA, y);
  pdfDoc.text("Pendahuluan", indentB, y);
  y += lineHeight;

  // 1. Umum/ Latar Belakang
  pdfDoc.text("1.", indentB, y);
  pdfDoc.text("Umum/ Latar Belakang", indentC, y);
  y += lineHeight;

  pdfDoc.setFont("helvetica", "normal");
  const latarBelakang =
    "Bahwa untuk mendukung tugas kedinasan di lingkungan Pemerintahan Kabupaten Tapin, perlu mengatur Tata Cara Pelaksanaan Perjalanan Dinas bagi Bupati dan Wakil Bupati, Pimpinan dan Anggota Dewan Perwakilan Rakyat Daerah, Pegawai Negeri Sipil, Non Pegawai Negeri Sipil, dan Pihak Lain dengan memperhatikan prinsip selektif, efesiensi, efektivitas, kepatutan, kewajaran, dan akuntabel, serta memperhatikan aspek pertanggungjawaban sesuai dengan biaya riil (at cost) dan lumpsum. Bahwa berdasarkan pertimbangan tersebut, ditetapkan Peraturan Bupati Tapin Nomor 01 Tahun 2024 Tentang Perjalanan Dinas. Maksud ditetapkan Peraturan Bupati ini untuk dijadikan sebagai pedoman pelaksanaan, penatausahaan, dan pertanggungjawaban serta pelaporan Perjalanan Dinas dalam rangka penyelenggaraan pemerintahan. Peraturan Bupati ini bertujuan untuk mengatur mengenai pelaksanaan, penatausahaan, dan pertanggungjawaban serta pelaporan Perjalanan Dinas bagi Pelaksana SPD yang dibebankan pada APBD. Berdasarkan penjelasan pada Bab 1 Ketentuan Umum pasal 1 Peraturan Bupati Tapin Nomor 01 Tahun 2024 Tentang Perjalanan Dinas, yang dimaksud Perjalanan Dinas adalah perjalanan dinas jabatan yang melewati batas Daerah dan/atau dalam Daerah dari tempat kedudukan ke tempat yang dituju, melaksanakan tugas, dan kembali ke tempat kedudukan semula di dalam negeri. Pelaksana Perjalanan Dinas yang selanjutnya disebut Pelaksana SPD adalah Bupati, Wakil Bupati, Pimpinan DPRD, Anggota DPRD, Pegawai ASN (PNS/Calon PNS/PPPK), dan Pihak Lain yang melaksanakan perjalanan dinas jabatan. Perjalanan Dinas Dalam Daerah adalah Perjalanan Dinas yang dilaksanakan di dalam Daerah yang terdiri atas pelaksanaan lebih dari 8 (delapan) jam, dan pelaksanaan sampai dengan 8 (delapan) jam.";

  y = drawParagraph(pdfDoc, latarBelakang, indentC, y, textWidth, lineHeight, pageHeight, marginBottom, "justify");
  y += 3;

  // 2. Landasan Hukum
  if (y + lineHeight > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("2.", indentB, y);
  pdfDoc.text("Landasan Hukum", indentC, y);
  y += lineHeight;

  pdfDoc.setFont("helvetica", "normal");
  const laws = [
    "Peraturan Bupati Tapin Nomor 01 Tahun 2024 tentang Perjalanan Dinas",
    "DPA SKPD Kecamatan Salam Babaris Tahun Anggaran 2026",
    data.suratDari || "Surat Undangan Pelaksanaan Kegiatan",
    `Surat Tugas Nomor : ${data.noSpt || "-"} Tanggal, ${formatTanggalIndonesia(data.tanggalSpt)}`,
    `Surat Perjalanan Dinas Nomor : ${data.noSpd || "-"} Tanggal, ${formatTanggalIndonesia(data.tanggalSpd)}`,
  ];

  laws.forEach((law, idx) => {
    if (y + lineHeight > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
    pdfDoc.text(`2.${idx + 1}`, indentC, y);
    y = drawParagraph(pdfDoc, law, indentC + 8, y, textWidth - 8, lineHeight, pageHeight, marginBottom);
    y += 1;
  });
  y += 2;

  // 3. Maksud dan Tujuan
  if (y + lineHeight > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("3.", indentB, y);
  pdfDoc.text("Maksud dan Tujuan", indentC, y);
  y += lineHeight;

  pdfDoc.setFont("helvetica", "normal");
  y = drawParagraph(pdfDoc, data.maksudPerjalanan || "-", indentC, y, textWidth, lineHeight, pageHeight, marginBottom, "justify");
  y += 4;

  // B. KEGIATAN YANG DILAKSANAKAN
  if (y + lineHeight * 2 > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("B.", indentA, y);
  pdfDoc.text("Kegiatan yang dilaksanakan", indentB, y);
  y += lineHeight;

  pdfDoc.setFont("helvetica", "normal");
  y = drawParagraph(pdfDoc, data.laporan?.kegiatan || "-", indentC, y, textWidth, lineHeight, pageHeight, marginBottom, "justify");
  y += 4;

  // C. HASIL YANG DICAPAI
  if (y + lineHeight * 2 > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("C.", indentA, y);
  pdfDoc.text("Hasil yang dicapai", indentB, y);
  y += lineHeight;

  pdfDoc.setFont("helvetica", "normal");
  y = drawParagraph(pdfDoc, data.laporan?.hasil || "-", indentC, y, textWidth, lineHeight, pageHeight, marginBottom, "justify");
  y += 4;

  // D. KESIMPULAN DAN SARAN
  if (y + lineHeight * 2 > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("D.", indentA, y);
  pdfDoc.text("Kesimpulan dan Saran", indentB, y);
  y += lineHeight;

  pdfDoc.setFont("helvetica", "normal");
  y = drawParagraph(pdfDoc, data.laporan?.kesimpulanSaran || "-", indentC, y, textWidth, lineHeight, pageHeight, marginBottom, "justify");
  y += 4;

  // E. PENUTUP
  if (y + lineHeight * 2 > pageHeight - marginBottom) { pdfDoc.addPage([215, 330]); y = 20; }
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("E.", indentA, y);
  pdfDoc.text("Penutup", indentB, y);
  y += lineHeight;

  pdfDoc.setFont("helvetica", "normal");
  const penutupText =
    data.laporan?.penutup ||
    "Demikian laporan perjalanan dinas ini disusun sebagai bentuk pertanggungjawaban atas pelaksanaan tugas dalam mengikuti kegiatan perjalanan dinas luar daerah Tahun Anggaran 2026. Diharapkan hasil dari kegiatan ini dapat diterapkan dalam pelaksanaan tugas sehari-hari guna mendukung pengelolaan tugas pemerintahan yang tertib, efektif, transparan, dan akuntabel sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.";

  y = drawParagraph(pdfDoc, penutupText, indentC, y, textWidth, lineHeight, pageHeight, marginBottom, "justify");
}
