import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30; // Vercel function timeout

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, targetLang = "PT-BR" } = body;

        if (!text) {
            return NextResponse.json(
                { error: "Parâmetro 'text' é obrigatório." },
                { status: 400 }
            );
        }

        const apiKey = process.env.DEEPL_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "DEEPL_API_KEY não configurada no servidor." },
                { status: 500 }
            );
        }

        // DeepL accepts arrays of text. Split long text into chunks.
        const textChunks: string[] = Array.isArray(text) ? text : [text];

        const params = new URLSearchParams();
        for (const chunk of textChunks) {
            params.append("text", chunk);
        }
        params.append("target_lang", targetLang);

        const response = await fetch(DEEPL_API_URL, {
            method: "POST",
            headers: {
                Authorization: `DeepL-Auth-Key ${apiKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("DeepL API error:", response.status, errorText);
            return NextResponse.json(
                { error: `Erro na API do DeepL: ${response.status}` },
                { status: 502 }
            );
        }

        const data = await response.json();

        // DeepL returns { translations: [{ text: "...", detected_source_language: "EN" }] }
        const translatedTexts = data.translations.map(
            (t: { text: string }) => t.text
        );
        const detectedLang = data.translations[0]?.detected_source_language || "unknown";

        return NextResponse.json({
            translatedText: translatedTexts.join(" "),
            translations: translatedTexts,
            detectedLanguage: detectedLang,
        });
    } catch (err) {
        console.error("Erro na tradução:", err);
        const message =
            err instanceof Error ? err.message : "Erro desconhecido na tradução.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
