import { NextResponse } from "next/server";

type GlmRequest = {
  prompt?: unknown;
};

type GlmResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  error?: string | { message?: string; code?: string | number };
};

const getErrorMessage = (error: GlmResponse["error"]) => {
  if (typeof error === "string") return error;
  return error?.message || "GLM gagal menghasilkan teks.";
};

export async function POST(request: Request) {
  const body = (await request.json()) as GlmRequest;

  if (typeof body.prompt !== "string" || !body.prompt.trim()) {
    return NextResponse.json({ error: "Prompt wajib diisi." }, { status: 400 });
  }

  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GLM_API_KEY belum diatur di .env.local." },
      { status: 503 }
    );
  }

  try {
    const startedAt = Date.now();
    const response = await fetch(
      "https://api.z.ai/api/paas/v4/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4.7-flash",
          messages: [{ role: "user", content: body.prompt }],
          thinking: { type: "disabled" },
          temperature: 0.6,
        }),
      }
    );

    const data = (await response.json()) as GlmResponse;
    console.info("GLM duration:", `${Date.now() - startedAt}ms`);
    const text = data.choices?.[0]?.message?.content;

    if (!response.ok || typeof text !== "string") {
      const errorMessage = getErrorMessage(data.error);
      console.error("GLM response error:", response.status, errorMessage);

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("GLM API error:", error);
    return NextResponse.json(
      { error: "Tidak dapat terhubung ke layanan GLM." },
      { status: 502 }
    );
  }
}