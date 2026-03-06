export interface CloudVoiceOption {
    id: string;
    label: string;
}

export interface AudioChunk {
    id: string;
    text: string;
    startSentenceIndex: number;
    endSentenceIndex: number;
    sentenceCount: number;
    characterCount: number;
}

export const CLOUD_VOICE_OPTIONS: CloudVoiceOption[] = [
    { id: "pt-BR-FranciscaNeural", label: "Francisca Natural" },
    { id: "pt-BR-AntonioNeural", label: "Antonio Natural" },
];

export const FALLBACK_VOICE_ID = "pt-BR-FranciscaNeural";
export const MAX_AUDIO_CHUNK_SENTENCES = 10;
export const MAX_AUDIO_CHUNK_CHARS = 1200;
export const MAX_TRANSLATION_CHUNK_CHARS = 4000;

export function getDefaultVoiceId(configuredVoiceId: string | undefined) {
    if (configuredVoiceId && CLOUD_VOICE_OPTIONS.some((voice) => voice.id === configuredVoiceId)) {
        return configuredVoiceId;
    }

    return FALLBACK_VOICE_ID;
}

export function normalizeVoiceId(voiceId: string | undefined, configuredVoiceId?: string) {
    const defaultVoiceId = getDefaultVoiceId(configuredVoiceId);

    if (!voiceId) {
        return defaultVoiceId;
    }

    const matchedVoice = CLOUD_VOICE_OPTIONS.find((voice) => voice.id === voiceId);
    return matchedVoice?.id ?? defaultVoiceId;
}

export function clampPlaybackRate(rate: number | undefined) {
    if (!Number.isFinite(rate)) {
        return 1;
    }

    return Math.min(2, Math.max(0.5, rate ?? 1));
}

export function buildAudioChunks(sentences: string[]) {
    const chunks: AudioChunk[] = [];
    let chunkSentences: string[] = [];
    let chunkStartIndex = 0;
    let chunkCharCount = 0;

    const flushChunk = (endSentenceIndex: number) => {
        const text = chunkSentences.join(" ").trim();

        if (!text) {
            return;
        }

        chunks.push({
            id: `chunk-${chunks.length}`,
            text,
            startSentenceIndex: chunkStartIndex,
            endSentenceIndex,
            sentenceCount: chunkSentences.length,
            characterCount: text.length,
        });

        chunkSentences = [];
        chunkCharCount = 0;
        chunkStartIndex = endSentenceIndex + 1;
    };

    sentences.forEach((sentence, index) => {
        const normalizedSentence = sentence.trim();

        if (!normalizedSentence) {
            return;
        }

        const nextCharCount = chunkCharCount + normalizedSentence.length + (chunkSentences.length > 0 ? 1 : 0);
        const shouldFlush =
            chunkSentences.length >= MAX_AUDIO_CHUNK_SENTENCES ||
            nextCharCount > MAX_AUDIO_CHUNK_CHARS;

        if (shouldFlush && chunkSentences.length > 0) {
            flushChunk(index - 1);
        }

        if (chunkSentences.length === 0) {
            chunkStartIndex = index;
        }

        chunkSentences.push(normalizedSentence);
        chunkCharCount += normalizedSentence.length + (chunkSentences.length > 1 ? 1 : 0);
    });

    if (chunkSentences.length > 0) {
        flushChunk(sentences.length - 1);
    }

    return chunks;
}

export function splitTextForTranslation(text: string, sentences: string[]) {
    const normalizedText = text.trim();

    if (!normalizedText) {
        return [];
    }

    if (normalizedText.length <= MAX_TRANSLATION_CHUNK_CHARS) {
        return [normalizedText];
    }

    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
        const normalizedSentence = sentence.trim();

        if (!normalizedSentence) {
            continue;
        }

        const separator = currentChunk ? " " : "";
        const candidate = `${currentChunk}${separator}${normalizedSentence}`;

        if (candidate.length > MAX_TRANSLATION_CHUNK_CHARS && currentChunk) {
            chunks.push(currentChunk);
            currentChunk = normalizedSentence;
            continue;
        }

        if (normalizedSentence.length > MAX_TRANSLATION_CHUNK_CHARS) {
            if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = "";
            }

            for (let offset = 0; offset < normalizedSentence.length; offset += MAX_TRANSLATION_CHUNK_CHARS) {
                chunks.push(normalizedSentence.slice(offset, offset + MAX_TRANSLATION_CHUNK_CHARS));
            }
            continue;
        }

        currentChunk = candidate;
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}
