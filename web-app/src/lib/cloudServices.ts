import { getDefaultVoiceId } from "@/lib/cloudReader";

export const TRANSLATION_PROVIDER = "libretranslate-compatible";
export const SPEECH_PROVIDER = "edge-tts";

const DEFAULT_TRANSLATION_TARGET = "pt";
const DEFAULT_TTS_TIMEOUT_MS = 15000;

function readEnvValue(...names: string[]) {
    for (const name of names) {
        const value = process.env[name]?.trim();

        if (value) {
            return value;
        }
    }

    return undefined;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? "", 10);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }

    return parsed;
}

export function normalizeTranslationLanguage(language: string | undefined) {
    const normalized = language?.trim().toLowerCase().replace(/_/g, "-");

    if (!normalized) {
        return DEFAULT_TRANSLATION_TARGET;
    }

    const baseLanguage = normalized.split("-")[0];
    return baseLanguage || DEFAULT_TRANSLATION_TARGET;
}

export function getTranslationServiceConfig() {
    const baseUrl = readEnvValue(
        "LIBRETRANSLATE_URL",
        "TRANSLATE_API_URL",
        "TRANSLATION_API_URL"
    );

    if (!baseUrl) {
        return null;
    }

    return {
        provider: TRANSLATION_PROVIDER,
        baseUrl: baseUrl.replace(/\/+$/, ""),
        apiKey: readEnvValue(
            "LIBRETRANSLATE_API_KEY",
            "TRANSLATE_API_KEY",
            "TRANSLATION_API_KEY"
        ),
        defaultTargetLang: normalizeTranslationLanguage(
            readEnvValue("DEFAULT_TARGET_LANG", "TRANSLATION_TARGET_LANG")
        ),
    };
}

export function getTranslationEndpoint(baseUrl: string) {
    if (/\/translate$/i.test(baseUrl)) {
        return baseUrl;
    }

    return `${baseUrl}/translate`;
}

export function describeTranslationEndpoint(baseUrl: string | undefined | null) {
    if (!baseUrl) {
        return null;
    }

    try {
        const endpoint = new URL(getTranslationEndpoint(baseUrl));
        return `${endpoint.origin}${endpoint.pathname}`;
    } catch {
        return getTranslationEndpoint(baseUrl);
    }
}

export function getSpeechServiceConfig() {
    return {
        provider: SPEECH_PROVIDER,
        defaultVoiceId: getDefaultVoiceId(readEnvValue("EDGE_TTS_VOICE_DEFAULT")),
        timeoutMs: parsePositiveInteger(
            readEnvValue("EDGE_TTS_TIMEOUT_MS"),
            DEFAULT_TTS_TIMEOUT_MS
        ),
    };
}
