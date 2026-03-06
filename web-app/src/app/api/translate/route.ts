import { NextRequest, NextResponse } from "next/server";
import { splitIntoSentences } from "@/lib/textProcessor";
import { enforceRateLimit } from "@/lib/rateLimit";
import { splitTextForTranslation } from "@/lib/cloudReader";
import {
    getTranslationEndpoint,
    getTranslationServiceConfig,
    normalizeTranslationLanguage,
} from "@/lib/cloudServices";

export const runtime = "nodejs";
export const maxDuration = 30;

function getTranslationErrorMessage(status: number) {
    if (status === 401 || status === 403 || status === 404) {
        return "Servico de traducao online indisponivel no momento.";
    }

    if (status === 429) {
        return "Cota gratuita esgotada no momento. Tente novamente em alguns minutos.";
    }

    return "Falha ao traduzir o texto agora.";
}

function getDetectedLanguage(data: unknown) {
    if (!data || typeof data !== "object") {
        return null;
    }

    const record = data as {
        detectedLanguage?: { language?: string } | string;
    };

    if (typeof record.detectedLanguage === "string") {
        return record.detectedLanguage;
    }

    if (
        record.detectedLanguage &&
        typeof record.detectedLanguage === "object" &&
        typeof record.detectedLanguage.language === "string"
    ) {
        return record.detectedLanguage.language;
    }

    return null;
}

function getTranslatedChunk(data: unknown) {
    if (!data || typeof data !== "object") {
        return "";
    }

    const record = data as {
        translatedText?: string;
    };

    return typeof record.translatedText === "string" ? record.translatedText.trim() : "";
}

export async function POST(request: NextRequest) {
    try {
        const rateLimit = await enforceRateLimit("translate", request);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Cota gratuita esgotada no momento. Tente novamente em alguns minutos." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const inputText = Array.isArray(body.text) ? body.text.join(" ") : body.text;

        if (!inputText || typeof inputText !== "string") {
            return NextResponse.json({ error: "Parametro 'text' e obrigatorio." }, { status: 400 });
        }

        const config = getTranslationServiceConfig();

        if (!config) {
            return NextResponse.json(
                { error: "Servico de traducao online indisponivel no momento." },
                { status: 503 }
            );
        }

        const targetLang = normalizeTranslationLanguage(
            typeof body.targetLang === "string" ? body.targetLang : config.defaultTargetLang
        );
        const translationChunks = splitTextForTranslation(inputText, splitIntoSentences(inputText));
        const translatedChunks: string[] = [];
        let detectedLanguage = "unknown";

        for (const chunk of translationChunks) {
            const response = await fetch(getTranslationEndpoint(config.baseUrl), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    q: chunk,
                    source: "auto",
                    target: targetLang,
                    format: "text",
                    alternatives: 0,
                    ...(config.apiKey ? { api_key: config.apiKey } : {}),
                }),
                signal: AbortSignal.timeout(30000),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Translation service error:", response.status, errorText);

                return NextResponse.json(
                    { error: getTranslationErrorMessage(response.status) },
                    { status: response.status === 429 ? 429 : 502 }
                );
            }

            const data = await response.json();
            const translatedChunk = getTranslatedChunk(data);

            if (!translatedChunk) {
                console.error("Translation service returned empty text:", data);
                return NextResponse.json(
                    { error: "Falha ao traduzir o texto agora." },
                    { status: 502 }
                );
            }

            translatedChunks.push(translatedChunk);

            if (detectedLanguage === "unknown") {
                detectedLanguage = getDetectedLanguage(data) ?? "unknown";
            }
        }

        const translatedText = translatedChunks.join(" ").trim();

        return NextResponse.json({
            translatedText,
            translations: translatedText ? [translatedText] : [],
            detectedLanguage,
            provider: config.provider,
            rateLimit: {
                enabled: rateLimit.enabled,
                limit: rateLimit.limit,
                remaining: rateLimit.remaining,
                reset: rateLimit.reset,
            },
        });
    } catch (error) {
        console.error("Erro na traducao:", error);
        return NextResponse.json(
            { error: "Servico de traducao online indisponivel no momento." },
            { status: 500 }
        );
    }
}
