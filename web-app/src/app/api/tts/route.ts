import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { EdgeTTS } from "node-edge-tts";
import { NextRequest, NextResponse } from "next/server";
import { clampPlaybackRate, normalizeVoiceId } from "@/lib/cloudReader";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getSpeechServiceConfig } from "@/lib/cloudServices";

export const runtime = "nodejs";
export const maxDuration = 30;

const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

function getVoiceLanguage(voiceId: string) {
    const match = voiceId.match(/^([a-z]{2}-[A-Z]{2})-/);
    return match?.[1] ?? "pt-BR";
}

function buildEdgeRate(rate: number) {
    const normalizedRate = clampPlaybackRate(rate);
    const percent = Math.round((normalizedRate - 1) * 100);

    if (percent === 0) {
        return "default";
    }

    return percent > 0 ? `+${percent}%` : `${percent}%`;
}

function getErrorMessage(error: unknown) {
    if (typeof error === "string") {
        return error;
    }

    return error instanceof Error ? error.message : "";
}

function getSpeechErrorMessage(error: unknown) {
    const message = getErrorMessage(error).toLowerCase();

    if (!message) {
        return "Falha ao gerar o audio agora.";
    }

    if (message.includes("timed out")) {
        return "Servico de voz online indisponivel no momento.";
    }

    if (message.includes("unexpected server response")) {
        return "Servico de voz online indisponivel no momento.";
    }

    return "Falha ao gerar o audio agora.";
}

export async function POST(request: NextRequest) {
    try {
        const rateLimit = await enforceRateLimit("tts", request);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Cota gratuita esgotada no momento. Tente novamente em alguns minutos." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const text = typeof body.text === "string" ? body.text.trim() : "";

        if (!text) {
            return NextResponse.json({ error: "Parametro 'text' e obrigatorio." }, { status: 400 });
        }

        const config = getSpeechServiceConfig();
        const voiceId = normalizeVoiceId(
            typeof body.voiceId === "string" ? body.voiceId : undefined,
            config.defaultVoiceId
        );
        const rate = clampPlaybackRate(typeof body.rate === "number" ? body.rate : 1);
        const outputPath = join(tmpdir(), `tts-${randomUUID()}.mp3`);

        try {
            const tts = new EdgeTTS({
                voice: voiceId,
                lang: getVoiceLanguage(voiceId),
                outputFormat: OUTPUT_FORMAT,
                rate: buildEdgeRate(rate),
                timeout: config.timeoutMs,
            });

            await tts.ttsPromise(text, outputPath);
            const audioBuffer = await fs.readFile(outputPath);

            return new NextResponse(audioBuffer, {
                status: 200,
                headers: {
                    "Content-Type": "audio/mpeg",
                    "Cache-Control": "no-store, max-age=0",
                    "X-Voice-Id": voiceId,
                },
            });
        } catch (speechError) {
            console.error("Edge TTS error:", speechError);

            return NextResponse.json(
                { error: getSpeechErrorMessage(speechError) },
                { status: 502 }
            );
        } finally {
            await fs.rm(outputPath, { force: true }).catch(() => undefined);
        }
    } catch (error) {
        console.error("Erro ao gerar audio:", error);
        return NextResponse.json(
            { error: "Servico de voz online indisponivel no momento." },
            { status: 500 }
        );
    }
}
