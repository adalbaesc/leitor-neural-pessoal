"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

export interface VoiceInfo {
    voice: SpeechSynthesisVoice;
    name: string;
    lang: string;
}

interface UseNeuralReaderOptions {
    preferredLang?: string;
}

interface UseNeuralReaderReturn {
    voices: VoiceInfo[];
    selectedVoice: VoiceInfo | null;
    setSelectedVoice: (voice: VoiceInfo) => void;
    selectBestVoiceForLang: (lang: string) => VoiceInfo | null;
    rate: number;
    setRate: (rate: number) => void;
    isPlaying: boolean;
    isPaused: boolean;
    currentSentenceIndex: number;
    speak: (sentences: string[], startIndex?: number) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    speakFromIndex: (sentences: string[], index: number) => void;
}

const VOICE_KEY = "neural-reader-voice";
const RATE_KEY = "neural-reader-rate";

function getVoiceScore(voice: VoiceInfo, targetLang: string) {
    const normalizedTarget = targetLang.toLowerCase();
    const normalizedVoiceLang = voice.lang.toLowerCase();
    const normalizedName = voice.name.toLowerCase();
    const targetPrefix = normalizedTarget.split("-")[0];
    let score = 0;

    if (normalizedVoiceLang === normalizedTarget) score += 50;
    if (normalizedVoiceLang.startsWith(`${targetPrefix}-`)) score += 35;
    if (normalizedVoiceLang.startsWith(targetPrefix)) score += 25;
    if (normalizedName.includes("microsoft")) score += 8;
    if (normalizedName.includes("natural")) score += 7;
    if (normalizedName.includes("online")) score += 6;
    if (normalizedName.includes("neural")) score += 5;

    return score;
}

export function useNeuralReader(
    options: UseNeuralReaderOptions = {}
): UseNeuralReaderReturn {
    const { preferredLang = "pt-BR" } = options;
    const pathname = usePathname();

    const [voices, setVoices] = useState<VoiceInfo[]>([]);
    const [selectedVoice, setSelectedVoiceState] = useState<VoiceInfo | null>(null);
    const [rate, setRateState] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(RATE_KEY);
            return saved ? parseFloat(saved) : 1.0;
        }
        return 1.0;
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);

    const currentIndexRef = useRef(0);
    const isStoppingRef = useRef(false);
    const playbackSessionRef = useRef(0);
    const pendingSpeakTimeoutRef = useRef<number | null>(null);
    const selectedVoiceRef = useRef<VoiceInfo | null>(null);
    const voicesRef = useRef<VoiceInfo[]>([]);
    const rateRef = useRef(rate);
    const previousPathnameRef = useRef<string | null>(null);

    const resetPlaybackState = useCallback(() => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSentenceIndex(-1);
        currentIndexRef.current = 0;
    }, []);

    const clearPendingSpeakTimeout = useCallback(() => {
        if (typeof window === "undefined") {
            return;
        }

        if (pendingSpeakTimeoutRef.current !== null) {
            window.clearTimeout(pendingSpeakTimeoutRef.current);
            pendingSpeakTimeoutRef.current = null;
        }
    }, []);

    const setSelectedVoice = useCallback((voice: VoiceInfo) => {
        selectedVoiceRef.current = voice;
        setSelectedVoiceState(voice);
        if (typeof window !== "undefined") {
            localStorage.setItem(VOICE_KEY, voice.name);
        }
    }, []);

    const selectBestVoiceForLang = useCallback(
        (lang: string) => {
            const availableVoices = voicesRef.current;

            if (availableVoices.length === 0) {
                return null;
            }

            const bestMatch = [...availableVoices]
                .map((voice) => ({ voice, score: getVoiceScore(voice, lang) }))
                .filter((item) => item.score > 0)
                .sort((left, right) => right.score - left.score)[0]?.voice;

            const fallbackVoice = selectedVoiceRef.current || availableVoices[0] || null;
            const chosenVoice = bestMatch || fallbackVoice;

            if (chosenVoice) {
                setSelectedVoice(chosenVoice);
            }

            return chosenVoice;
        },
        [setSelectedVoice]
    );

    const stopPlayback = useCallback(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            return;
        }

        playbackSessionRef.current += 1;
        isStoppingRef.current = true;
        clearPendingSpeakTimeout();
        window.speechSynthesis.cancel();
        resetPlaybackState();
    }, [clearPendingSpeakTimeout, resetPlaybackState]);

    useEffect(() => {
        selectedVoiceRef.current = selectedVoice;
    }, [selectedVoice]);

    useEffect(() => {
        voicesRef.current = voices;
    }, [voices]);

    useEffect(() => {
        rateRef.current = rate;
    }, [rate]);

    const setRate = useCallback((newRate: number) => {
        setRateState(newRate);
        if (typeof window !== "undefined") {
            localStorage.setItem(RATE_KEY, String(newRate));
        }
    }, []);

    useEffect(() => {
        const loadVoices = () => {
            const synth = window.speechSynthesis;
            const availableVoices = synth.getVoices();

            if (availableVoices.length === 0) {
                return;
            }

            const voiceInfos: VoiceInfo[] = availableVoices.map((voice) => ({
                voice,
                name: voice.name,
                lang: voice.lang,
            }));

            setVoices(voiceInfos);

            const savedVoiceName =
                typeof window !== "undefined" ? localStorage.getItem(VOICE_KEY) : null;

            if (savedVoiceName) {
                const savedVoice = voiceInfos.find((voice) => voice.name === savedVoiceName);
                if (savedVoice) {
                    selectedVoiceRef.current = savedVoice;
                    setSelectedVoiceState(savedVoice);
                    return;
                }
            }

            if (!selectedVoiceRef.current) {
                const bestVoice =
                    [...voiceInfos]
                        .map((voice) => ({
                            voice,
                            score: getVoiceScore(voice, preferredLang),
                        }))
                        .sort((left, right) => right.score - left.score)[0]?.voice ||
                    voiceInfos[0];

                if (bestVoice) {
                    selectedVoiceRef.current = bestVoice;
                    setSelectedVoiceState(bestVoice);
                    if (typeof window !== "undefined") {
                        localStorage.setItem(VOICE_KEY, bestVoice.name);
                    }
                }
            }
        };

        loadVoices();

        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            if (typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, [preferredLang]);

    const speakSentence = useCallback(
        function runSpeech(sentences: string[], index: number, playbackSession: number) {
            if (isStoppingRef.current || playbackSession !== playbackSessionRef.current) {
                return;
            }

            if (index >= sentences.length) {
                resetPlaybackState();
                return;
            }

            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(sentences[index]);
            const voice = selectedVoiceRef.current;

            if (voice) {
                utterance.voice = voice.voice;
                utterance.lang = voice.lang;
            }

            utterance.rate = rateRef.current;
            utterance.pitch = 1;

            currentIndexRef.current = index;
            setCurrentSentenceIndex(index);

            utterance.onend = () => {
                if (!isStoppingRef.current && playbackSession === playbackSessionRef.current) {
                    runSpeech(sentences, index + 1, playbackSession);
                }
            };

            utterance.onerror = (event) => {
                if (event.error !== "interrupted" && event.error !== "canceled") {
                    console.error("Speech error:", event.error);
                }

                if (!isStoppingRef.current && playbackSession === playbackSessionRef.current) {
                    runSpeech(sentences, index + 1, playbackSession);
                }
            };

            synth.speak(utterance);
        },
        [resetPlaybackState]
    );

    const speak = useCallback(
        (sentences: string[], startIndex = 0) => {
            const playbackSession = playbackSessionRef.current + 1;

            playbackSessionRef.current = playbackSession;
            isStoppingRef.current = false;
            clearPendingSpeakTimeout();
            window.speechSynthesis.cancel();

            setIsPlaying(true);
            setIsPaused(false);

            pendingSpeakTimeoutRef.current = window.setTimeout(() => {
                pendingSpeakTimeoutRef.current = null;
                speakSentence(sentences, startIndex, playbackSession);
            }, 50);
        },
        [clearPendingSpeakTimeout, speakSentence]
    );

    const pause = useCallback(() => {
        const synth = window.speechSynthesis;
        if (synth.speaking && !synth.paused) {
            synth.pause();
            setIsPaused(true);
        }
    }, []);

    const resume = useCallback(() => {
        const synth = window.speechSynthesis;
        if (synth.paused) {
            synth.resume();
            setIsPaused(false);
        }
    }, []);

    const stop = useCallback(() => {
        stopPlayback();
    }, [stopPlayback]);

    const speakFromIndex = useCallback(
        (sentences: string[], index: number) => {
            const playbackSession = playbackSessionRef.current + 1;

            playbackSessionRef.current = playbackSession;
            isStoppingRef.current = true;
            clearPendingSpeakTimeout();
            window.speechSynthesis.cancel();

            pendingSpeakTimeoutRef.current = window.setTimeout(() => {
                pendingSpeakTimeoutRef.current = null;
                isStoppingRef.current = false;
                setIsPlaying(true);
                setIsPaused(false);
                speakSentence(sentences, index, playbackSession);
            }, 100);
        },
        [clearPendingSpeakTimeout, speakSentence]
    );

    useEffect(() => {
        const previousPathname = previousPathnameRef.current;
        previousPathnameRef.current = pathname;

        if (previousPathname !== null && previousPathname !== pathname) {
            stopPlayback();
        }
    }, [pathname, stopPlayback]);

    useEffect(() => {
        const handlePageExit = () => {
            stopPlayback();
        };

        window.addEventListener("pagehide", handlePageExit);
        window.addEventListener("beforeunload", handlePageExit);

        return () => {
            window.removeEventListener("pagehide", handlePageExit);
            window.removeEventListener("beforeunload", handlePageExit);
        };
    }, [stopPlayback]);

    useEffect(() => {
        return () => {
            stopPlayback();
        };
    }, [stopPlayback]);

    return {
        voices,
        selectedVoice,
        setSelectedVoice,
        selectBestVoiceForLang,
        rate,
        setRate,
        isPlaying,
        isPaused,
        currentSentenceIndex,
        speak,
        pause,
        resume,
        stop,
        speakFromIndex,
    };
}
