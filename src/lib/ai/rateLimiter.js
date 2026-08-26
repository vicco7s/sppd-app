/**
 * Client-side AI Rate Limiter
 * 
 * Mencegah request beruntun yang dapat memicu rate limit provider.
 * 
 * Batasi pemakaian generator teks agar tidak membebani layanan AI.
 * Vision Gemini tetap memakai limiter yang sama untuk konsistensi UI.
 */

const COOLDOWN_MS = 8000; // 8 detik minimal antar request
const STORAGE_KEY = "sppd_ai_usage_v2";

/**
 * Get today's date as YYYY-MM-DD string
 */
const getToday = () => new Date().toISOString().split("T")[0];

/**
 * Read usage data from localStorage
 */
const getUsageData = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (data.date === getToday()) {
                return data;
            }
        }
    } catch (e) {
        // Ignore parse errors
    }
    return { date: getToday(), count: 0, lastRequest: 0 };
};

/**
 * Save usage data to localStorage
 */
const saveUsageData = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        // Ignore storage errors
    }
};

/**
 * Hitung sisa waktu cooldown dalam detik
 */
const getCooldownRemaining = () => {
    const data = getUsageData();
    const elapsed = Date.now() - (data.lastRequest || 0);
    return Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 1000));
};

/**
 * Cek apakah request AI diizinkan
 * @returns {{ allowed: boolean, reason?: string, remaining?: number, cooldown?: number }}
 */
export const checkRateLimit = () => {
    const data = getUsageData();

    // Cek cooldown antar request
    const cooldownRemaining = getCooldownRemaining();
    if (cooldownRemaining > 0) {
        return {
            allowed: false,
            reason: `Mohon tunggu ${cooldownRemaining} detik sebelum menggunakan AI lagi.`,
            remaining: null,
            cooldown: cooldownRemaining,
        };
    }

    return {
        allowed: true,
        remaining: null,
    };
};

/**
 * Catat bahwa request AI telah dilakukan
 */
export const recordRequest = () => {
    const data = getUsageData();
    data.count += 1;
    data.lastRequest = Date.now();
    saveUsageData(data);
    return data.count;
};

/**
 * Dapatkan status penggunaan AI hari ini untuk indikator UI.
 * Kuota sebenarnya dikelola oleh provider AI.
 */
export const getUsageStatus = () => {
    const data = getUsageData();
    return {
        used: data.count,
        limit: null,
        remaining: null,
        percentage: 0,
    };
};

/**
 * Guard function — panggil sebelum setiap request AI.
 * Jika tidak diizinkan, throw error dengan pesan user-friendly.
 */
export const guardRateLimit = () => {
    const result = checkRateLimit();
    if (!result.allowed) {
        throw new Error(result.reason);
    }
    return result;
};
