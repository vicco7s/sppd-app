/**
 * Client-side AI Rate Limiter
 * 
 * Mencegah error 429 (quota exceeded) dengan membatasi jumlah request
 * AI per hari dan memberi jeda antar request.
 * 
 * Free tier Gemini 2.5 Flash: 20 requests/day
 * Kita batasi di 15 requests/day untuk safety buffer.
 */

const DAILY_LIMIT = 15;
const COOLDOWN_MS = 8000; // 8 detik minimal antar request
const STORAGE_KEY = "sppd_ai_usage";

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

    // Cek batas harian
    if (data.count >= DAILY_LIMIT) {
        return {
            allowed: false,
            reason: `Batas penggunaan AI hari ini sudah tercapai (${DAILY_LIMIT}/${DAILY_LIMIT}). Silakan coba lagi besok.`,
            remaining: 0,
        };
    }

    // Cek cooldown antar request
    const cooldownRemaining = getCooldownRemaining();
    if (cooldownRemaining > 0) {
        return {
            allowed: false,
            reason: `Mohon tunggu ${cooldownRemaining} detik sebelum menggunakan AI lagi.`,
            remaining: DAILY_LIMIT - data.count,
            cooldown: cooldownRemaining,
        };
    }

    return {
        allowed: true,
        remaining: DAILY_LIMIT - data.count,
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
 * Set quota ke exhausted (dipanggil saat dapat 429 dari server)
 * Supaya client tidak terus mencoba dan kena 429 lagi.
 */
export const exhaustQuota = () => {
    const data = getUsageData();
    data.count = DAILY_LIMIT;
    data.lastRequest = Date.now();
    saveUsageData(data);
};

/**
 * Dapatkan status penggunaan AI hari ini
 * @returns {{ used: number, limit: number, remaining: number, percentage: number }}
 */
export const getUsageStatus = () => {
    const data = getUsageData();
    return {
        used: data.count,
        limit: DAILY_LIMIT,
        remaining: Math.max(0, DAILY_LIMIT - data.count),
        percentage: Math.round((data.count / DAILY_LIMIT) * 100),
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
