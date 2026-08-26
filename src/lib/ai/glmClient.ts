export type GlmTextResponse = {
  text: () => string;
};

type GlmError = string | { message?: string; code?: string | number };

type GlmResponse = {
  text?: string;
  error?: GlmError;
};

let requestQueue: Promise<unknown> = Promise.resolve();

const getErrorMessage = (error?: GlmError) => {
  if (typeof error === "string") return error;
  return error?.message || "GLM gagal menghasilkan teks.";
};

export const generateTextWithGLM = async (
  prompt: string
): Promise<GlmTextResponse> => {
  const request = requestQueue.then(async () => {
    const response = await fetch("/api/ai/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = (await response.json()) as GlmResponse;

    if (!response.ok || typeof data.text !== "string") {
      throw Object.assign(new Error(getErrorMessage(data.error)), {
        status: response.status,
      });
    }

    return { text: () => data.text as string };
  });

  requestQueue = request.catch(() => undefined);
  return request;
};