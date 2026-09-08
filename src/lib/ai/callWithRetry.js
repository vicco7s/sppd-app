import { generateTextWithGLM } from "./glmClient";
import { guardRateLimit, recordRequest, getUsageStatus } from "./rateLimiter";

const MAX_RETRIES = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if an error is retryable (server overload / rate limit)
 */
const isRetryableError = (err) => {
    const msg =
        err?.message ||
        err?.statusText ||
        err?.error?.message ||
        (typeof err?.toString === "function" ? err.toString() : "") ||
        "";
    const status = String(err?.status || err?.code || err?.error?.status || "");
    const fullText = msg + " " + status;
    return (
        status.includes("500") ||
        status.includes("429") ||
        status.includes("503") ||
        fullText.includes("high demand") ||
        fullText.includes("RESOURCE_EXHAUSTED") ||
        fullText.includes("UNAVAILABLE") ||
        fullText.includes("Too many requests") ||
        fullText.includes("fetch-error")
    );
};

/**
 * Get current usage status (for UI components)
 */
export const getAiUsageStatus = () => {
    return getUsageStatus();
};

/**
 * Call GLM text generation with automatic retry on server errors
 * and client-side rate limiting to prevent quota exhaustion.
 * @param {string} prompt - The prompt to send
 * @returns {Promise<Object>} - The response object
 */
export const generateContentWithRetry = async (prompt, retryCount = 1) => {
    // Client-side rate limit guard
    guardRateLimit();

    try {
        const result = await generateTextWithGLM(prompt);
        // Catat request yang berhasil
        recordRequest();
        return result;
    } catch (err) {
        if (retryCount < MAX_RETRIES && isRetryableError(err)) {
            const isRateLimited = String(err?.status || err?.code || err?.error?.status || "").includes("429");
            const providerDelay = Number(err?.retryAfter);
            const delay = isRateLimited && Number.isFinite(providerDelay) && providerDelay > 0
                ? providerDelay * 1000
                : isRateLimited
                    ? Math.min(8000 * Math.pow(2, retryCount - 1), 30000)
                    : Math.min(1000 * Math.pow(2, retryCount), 8000);
            console.warn(
                `[AI Retry] ${retryCount}/${MAX_RETRIES} after ${delay}ms:`,
                err?.message || err
            );
            await sleep(delay);
            return generateContentWithRetry(prompt, retryCount + 1);
        }

        if (String(err?.status || err?.code || err?.error?.status || "").includes("429")) {
            throw new Error(
                "GLM masih mencapai batas concurrency/rate limit setelah beberapa percobaan. Silakan coba lagi nanti."
            );
        }
        throw err;
    }
};
