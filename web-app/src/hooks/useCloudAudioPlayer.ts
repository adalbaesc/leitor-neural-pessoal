"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
    buildAudioChunks,
    clampPlaybackRate,
    CLOUD_VOICE_OPTIONS,
    type AudioChunk,
    type CloudVoiceOption,
    FALLBACK_VOICE_ID,
} from "@/lib/cloudReader";

const VOICE_STORAGE_KEY = "cloud-reader-voice";
const RATE_STORAGE_KEY = "cloud-reader-rate";

interface UseCloudAudioPlayerOptions {
    sentences: string[];
    contentKey?: string | number;
}

interface UseCloudAudioPlayerReturn {
    voiceOptions: CloudVoiceOption[];
    selectedVoiceId: string;
    setSelectedVoiceId: (voiceId: string) => void;
    rate: number;
    setRate: (rate: number) => void;
    isPlaying: boolean;
    isPaused: boolean;
    isLoadingAudio: boolean;
    playbackError: string | null;
    currentChunkIndex: number;
    totalChunks: number;
    activeSentenceRange: { start: number; end: number } | null;
    play: (startSentenceIndex?: number) => Promise<void>;
    pause: () => void;
    resume: () => Promise<void>;
    stop: () => void;
}

export function useCloudAudioPlayer({
    sentences,
    contentKey,
}: UseCloudAudioPlayerOptions): UseCloudAudioPlayerReturn {
    const pathname = usePathname();
    const chunks = buildAudioChunks(sentences);

    const [selectedVoiceId, setSelectedVoiceIdState] = useState(FALLBACK_VOICE_ID);
    const [rate, setRateState] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [playbackError, setPlaybackError] = useState<string | null>(null);
    const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chunksRef = useRef<AudioChunk[]>(chunks);
    const currentChunkIndexRef = useRef(-1);
    const sessionRef = useRef(0);
    const previousContentKeyRef = useRef<string | number | undefined>(undefined);
    const previousPathnameRef = useRef<string | null>(null);
    const previousVoiceIdRef = useRef<string | null>(null);
    const previousRateRef = useRef<number | null>(null);
    const cachedAudioRef = useRef<Map<number, string>>(new Map());
    const pendingControllersRef = useRef<Map<number, AbortController>>(new Map());
    const pendingPromisesRef = useRef<Map<number, Promise<string>>>(new Map());

    const totalChunks = chunks.length;
    const activeChunk = currentChunkIndex >= 0 ? chunks[currentChunkIndex] ?? null : null;
    const activeSentenceRange = activeChunk
        ? { start: activeChunk.startSentenceIndex, end: activeChunk.endSentenceIndex }
        : null;

    useEffect(() => {
        chunksRef.current = chunks;
    }, [chunks]);

    useEffect(() => {
        const savedVoiceId = window.localStorage.getItem(VOICE_STORAGE_KEY);
        const savedRate = window.localStorage.getItem(RATE_STORAGE_KEY);

        if (savedVoiceId) {
            const matchedVoice = CLOUD_VOICE_OPTIONS.find((voice) => voice.id === savedVoiceId)?.id;
            if (matchedVoice) {
                setSelectedVoiceIdState(matchedVoice);
            }
        }

        if (savedRate) {
            setRateState(clampPlaybackRate(Number(savedRate)));
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem(VOICE_STORAGE_KEY, selectedVoiceId);
    }, [selectedVoiceId]);

    useEffect(() => {
        window.localStorage.setItem(RATE_STORAGE_KEY, String(rate));
    }, [rate]);

    useEffect(() => {
        currentChunkIndexRef.current = currentChunkIndex;
    }, [currentChunkIndex]);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = "auto";
        }
    }, []);

    const clearCachedAudio = useCallback(() => {
        for (const url of cachedAudioRef.current.values()) {
            URL.revokeObjectURL(url);
        }

        cachedAudioRef.current.clear();
        pendingPromisesRef.current.clear();

        for (const controller of pendingControllersRef.current.values()) {
            controller.abort();
        }

        pendingControllersRef.current.clear();
    }, []);

    const stopInternal = useCallback(
        (clearQueue: boolean) => {
            sessionRef.current += 1;
            const audio = audioRef.current;

            if (audio) {
                audio.pause();
                audio.currentTime = 0;
                audio.onended = null;
                audio.onerror = null;
                audio.removeAttribute("src");
                audio.load();
            }

            setIsPlaying(false);
            setIsPaused(false);
            setIsLoadingAudio(false);
            setCurrentChunkIndex(-1);

            if (clearQueue) {
                setPlaybackError(null);
                clearCachedAudio();
            }
        },
        [clearCachedAudio]
    );

    const fetchChunkAudio = useCallback(
        (chunkIndex: number, playbackSession: number) => {
            const cachedUrl = cachedAudioRef.current.get(chunkIndex);
            if (cachedUrl) {
                return Promise.resolve(cachedUrl);
            }

            const pendingPromise = pendingPromisesRef.current.get(chunkIndex);
            if (pendingPromise) {
                return pendingPromise;
            }

            const chunk = chunksRef.current[chunkIndex];

            if (!chunk) {
                return Promise.reject(new Error("Trecho de audio indisponivel."));
            }

            const controller = new AbortController();
            pendingControllersRef.current.set(chunkIndex, controller);

            const promise = fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: chunk.text,
                    voiceId: selectedVoiceId,
                    rate,
                }),
                signal: controller.signal,
            })
                .then(async (response) => {
                    if (!response.ok) {
                        const contentType = response.headers.get("content-type") ?? "";
                        let message = "Falha ao gerar o audio agora.";

                        if (contentType.includes("application/json")) {
                            const data = (await response.json()) as { error?: string };
                            message = data.error || message;
                        } else {
                            const text = await response.text();
                            if (text) {
                                message = text;
                            }
                        }

                        throw new Error(message);
                    }

                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);

                    if (playbackSession !== sessionRef.current) {
                        URL.revokeObjectURL(objectUrl);
                        throw new Error("Leitura cancelada.");
                    }

                    cachedAudioRef.current.set(chunkIndex, objectUrl);
                    return objectUrl;
                })
                .finally(() => {
                    pendingPromisesRef.current.delete(chunkIndex);
                    pendingControllersRef.current.delete(chunkIndex);
                });

            pendingPromisesRef.current.set(chunkIndex, promise);
            return promise;
        },
        [rate, selectedVoiceId]
    );

    const prefetchNextChunk = useCallback(
        (chunkIndex: number, playbackSession: number) => {
            if (chunkIndex >= chunksRef.current.length) {
                return;
            }

            void fetchChunkAudio(chunkIndex, playbackSession).catch((error: unknown) => {
                if (error instanceof Error && error.message === "Leitura cancelada.") {
                    return;
                }

                console.warn("Audio prefetch failed:", error);
            });
        },
        [fetchChunkAudio]
    );

    const playChunk = useCallback(
        async (chunkIndex: number, playbackSession: number) => {
            if (playbackSession !== sessionRef.current) {
                return;
            }

            const chunk = chunksRef.current[chunkIndex];

            if (!chunk) {
                stopInternal(false);
                return;
            }

            setPlaybackError(null);
            setIsLoadingAudio(true);
            setCurrentChunkIndex(chunkIndex);

            try {
                const objectUrl = await fetchChunkAudio(chunkIndex, playbackSession);

                if (playbackSession !== sessionRef.current) {
                    return;
                }

                const audio = audioRef.current;

                if (!audio) {
                    throw new Error("Player de audio indisponivel.");
                }

                audio.pause();
                audio.currentTime = 0;
                audio.src = objectUrl;
                audio.playbackRate = 1;
                audio.onended = () => {
                    if (playbackSession !== sessionRef.current) {
                        return;
                    }

                    const nextChunkIndex = chunkIndex + 1;

                    if (nextChunkIndex >= chunksRef.current.length) {
                        stopInternal(false);
                        return;
                    }

                    void playChunk(nextChunkIndex, playbackSession);
                };
                audio.onerror = () => {
                    if (playbackSession !== sessionRef.current) {
                        return;
                    }

                    setPlaybackError("Nao foi possivel reproduzir o audio agora.");
                    stopInternal(false);
                };

                await audio.play();
                setIsPlaying(true);
                setIsPaused(false);
                setIsLoadingAudio(false);
                prefetchNextChunk(chunkIndex + 1, playbackSession);
            } catch (error) {
                if (playbackSession !== sessionRef.current) {
                    return;
                }

                const message =
                    error instanceof Error && error.message !== "Leitura cancelada."
                        ? error.message
                        : "Falha ao gerar o audio agora.";

                setPlaybackError(message);
                setIsPlaying(false);
                setIsPaused(false);
                setIsLoadingAudio(false);
                setCurrentChunkIndex(-1);
            }
        },
        [fetchChunkAudio, prefetchNextChunk, stopInternal]
    );

    const play = useCallback(
        async (startSentenceIndex = 0) => {
            const nextSession = sessionRef.current + 1;
            const chunkIndex = chunksRef.current.findIndex(
                (chunk) =>
                    startSentenceIndex >= chunk.startSentenceIndex &&
                    startSentenceIndex <= chunk.endSentenceIndex
            );

            stopInternal(true);
            sessionRef.current = nextSession;

            if (chunkIndex === -1) {
                setPlaybackError("Nenhum audio disponivel para reproducao.");
                return;
            }

            await playChunk(chunkIndex, nextSession);
        },
        [playChunk, stopInternal]
    );

    const pause = useCallback(() => {
        const audio = audioRef.current;

        if (!audio || !isPlaying) {
            return;
        }

        audio.pause();
        setIsPlaying(false);
        setIsPaused(true);
    }, [isPlaying]);

    const resume = useCallback(async () => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        try {
            await audio.play();
            setIsPlaying(true);
            setIsPaused(false);
            setPlaybackError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Falha ao reproduzir o audio agora.";
            setPlaybackError(message);
        }
    }, []);

    const stop = useCallback(() => {
        stopInternal(true);
    }, [stopInternal]);

    useEffect(() => {
        const previousContentKey = previousContentKeyRef.current;
        previousContentKeyRef.current = contentKey;

        if (previousContentKey !== undefined && previousContentKey !== contentKey) {
            stopInternal(true);
            setPlaybackError(null);
        }
    }, [contentKey, stopInternal]);

    useEffect(() => {
        const previousPathname = previousPathnameRef.current;
        previousPathnameRef.current = pathname;

        if (previousPathname !== null && previousPathname !== pathname) {
            stopInternal(true);
        }
    }, [pathname, stopInternal]);

    useEffect(() => {
        const previousVoiceId = previousVoiceIdRef.current;
        previousVoiceIdRef.current = selectedVoiceId;

        if (previousVoiceId !== null && previousVoiceId !== selectedVoiceId) {
            stopInternal(true);
        }
    }, [selectedVoiceId, stopInternal]);

    useEffect(() => {
        const previousRate = previousRateRef.current;
        previousRateRef.current = rate;

        if (previousRate !== null && previousRate !== rate) {
            stopInternal(true);
        }
    }, [rate, stopInternal]);

    useEffect(() => {
        const handlePageExit = () => {
            stopInternal(true);
        };

        window.addEventListener("pagehide", handlePageExit);
        window.addEventListener("beforeunload", handlePageExit);

        return () => {
            window.removeEventListener("pagehide", handlePageExit);
            window.removeEventListener("beforeunload", handlePageExit);
        };
    }, [stopInternal]);

    useEffect(() => {
        return () => {
            stopInternal(true);
        };
    }, [stopInternal]);

    return {
        voiceOptions: CLOUD_VOICE_OPTIONS,
        selectedVoiceId,
        setSelectedVoiceId: (voiceId: string) => {
            const nextVoice = CLOUD_VOICE_OPTIONS.find((item) => item.id === voiceId)?.id ?? FALLBACK_VOICE_ID;
            setSelectedVoiceIdState(nextVoice);
        },
        rate,
        setRate: (nextRate: number) => {
            setRateState(clampPlaybackRate(nextRate));
        },
        isPlaying,
        isPaused,
        isLoadingAudio,
        playbackError,
        currentChunkIndex,
        totalChunks,
        activeSentenceRange,
        play,
        pause,
        resume,
        stop,
    };
}
