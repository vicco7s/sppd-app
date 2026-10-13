// Tarif perjalanan dinas luar daerah (dalam provinsi) sesuai Perbub Kab. Tapin.
// Nilai default untuk auto-fill; tetap dapat diubah manual di form.

export const TARIF_TRANSPORT: Record<string, number> = {
  Banjarmasin: 189000,
  Banjarbaru: 106000,
};

export const UANG_HARIAN = 380000; // hari berangkat & pulang (penuh)
export const UANG_HARIAN_1_4 = 95000; // hari di antara (1/4)
export const PENGINAPAN_STANDAR = 697000; // tarif penginapan per malam
export const PERSEN_TANPA_MENGINAP = 30; // 30% bila tanpa menginap

export function tarifTransport(kota?: string): number {
  return TARIF_TRANSPORT[kota || "Banjarmasin"] || 0;
}

export function kelipatanTransport(pulangPergi?: boolean): number {
  return pulangPergi === false ? 1 : 2; // default pulang-pergi (x2)
}

// Uang harian: hari berangkat & pulang penuh (380rb), hari di antaranya 1/4 (95rb).
export function buildUangHarian(lamaHari: number) {
  const n = Number(lamaHari) || 0;
  const full = n >= 2 ? 2 : Math.max(n, 1);
  const sisa = n >= 2 ? n - 2 : 0;
  const rows = [
    { uraian: "Uang Harian", hari: full, tarif: UANG_HARIAN, total: full * UANG_HARIAN },
  ];
  if (sisa > 0) {
    rows.push({ uraian: "Uang Harian (1/4)", hari: sisa, tarif: UANG_HARIAN_1_4, total: sisa * UANG_HARIAN_1_4 });
  }
  return rows;
}
