import { jsPDF } from "jspdf";
import { PerjadinLuarDoc, PelaksanaLuar } from "@/types/perjadinLuar";

export function formatTanggalIndonesia(dateInput?: string | Date | null): string {
  if (!dateInput) return "-";
  let str = typeof dateInput === "string" ? dateInput : dateInput.toISOString().split("T")[0];
  const parts = str.split("-");
  if (parts.length !== 3) return str;
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return `${day} ${bulan[month] || ""} ${year}`;
}

export function formatRupiah(num: number): string {
  return "Rp " + new Intl.NumberFormat("id-ID").format(num);
}

export function angkaKeTerbilang(n: number): string {
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  if (n < 12) return satuan[n];
  if (n < 20) return angkaKeTerbilang(n - 10) + " Belas";
  if (n < 100) return angkaKeTerbilang(Math.floor(n / 10)) + " Puluh " + angkaKeTerbilang(n % 10);
  if (n < 200) return "Seratus " + angkaKeTerbilang(n - 100);
  if (n < 1000) return angkaKeTerbilang(Math.floor(n / 100)) + " Ratus " + angkaKeTerbilang(n % 100);
  if (n < 2000) return "Seribu " + angkaKeTerbilang(n - 1000);
  if (n < 1000000) return angkaKeTerbilang(Math.floor(n / 1000)) + " Ribu " + angkaKeTerbilang(n % 1000);
  if (n < 1000000000) return angkaKeTerbilang(Math.floor(n / 1000000)) + " Juta " + angkaKeTerbilang(n % 1000000);
  return String(n);
}

export function terbilangHari(n: number): string {
  const map: Record<number, string> = {
    1: "Satu", 2: "Dua", 3: "Tiga", 4: "Empat", 5: "Lima",
    6: "Enam", 7: "Tujuh", 8: "Delapan", 9: "Sembilan", 10: "Sepuluh"
  };
  return map[n] || String(n);
}

export function drawKopSurat(pdfDoc: jsPDF, customAlamat?: string) {
  const pageWidth = 215;
  const marginLeft = 20;
  const marginRight = 20;
  const centerX = pageWidth / 2;
  const y = 14;

  try {
    const logoUrl = "/assets/logo/Lambang_Kabupaten_Tapin.png";
    pdfDoc.addImage(logoUrl, "PNG", marginLeft, y - 3, 16, 18);
  } catch (e) {
    console.error("Gagal load logo:", e);
  }

  pdfDoc.setFontSize(14);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("PEMERINTAH KABUPATEN TAPIN", centerX, y + 2, { align: "center" });

  pdfDoc.setFontSize(18);
  pdfDoc.setFont("helvetica", "bold");
  pdfDoc.text("KECAMATAN SALAM BABARIS", centerX, y + 8, { align: "center" });

  pdfDoc.setFontSize(9.5);
  pdfDoc.setFont("helvetica", "normal");
  const alamatText = customAlamat || "Jalan Transmigrasi No. 02 Desa Salam Babaris Kode Pos : 71182";
  pdfDoc.text(alamatText, centerX, y + 13, { align: "center" });

  // Double Line
  const lineY = y + 16;
  pdfDoc.setLineWidth(0.8);
  pdfDoc.line(marginLeft, lineY, pageWidth - marginRight, lineY);
  pdfDoc.setLineWidth(0.3);
  pdfDoc.line(marginLeft, lineY + 1.2, pageWidth - marginRight, lineY + 1.2);

  return lineY + 6;
}
