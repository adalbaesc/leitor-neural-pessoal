"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

export function useNeuralReader(
    options: UseNeuralReaderOptions = {}
): UseNeuralReaderReturn {
    const { preferredLang = "pt-BR" } = options;

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

    const sentencesRef = useRef<string[]>([]);
    const currentIndexRef = useRef(0);
    const isStoppingRef = useRef(false);
    const selectedVoiceRef = useRef<VoiceInfo | null>(null);
    const rateRef = useRef(rate);

    // Keep refs in sync with state
    useEffect(() => {
        selectedVoiceRef.current = selectedVoice;
    }, [selectedVoice]);

    useEffect(() => {
        rateRef.current = rate;
    }, [rate]);

    // ── Persist voice selection ──
    const setSelectedVoice = useCallback((voice: VoiceInfo) => {
        setSelectedVoiceState(voice);
        if (typeof window !== "undefined") {
            localStorage.setItem(VOICE_KEY, voice.name);
        }
    }, []);

    // ── Persist rate ──
    const setRate = useCallback((newRate: number) => {
        setRateState(newRate);
        if (typeof window !== "undefined") {
            localStorage.setItem(RATE_KEY, String(newRate));
        }
    }, []);

    // ── Load available voices ──
    useEffect(() => {
        const loadVoices = () => {
            const synth = window.speechSynthesis;
            const availableVoices = synth.getVoices();

            if (availableVoices.length === 0) return;

            const voiceInfos: VoiceInfo[] = availableVoices.map((v) => ({
                voice: v,
                name: v.name,
                lang: v.lang,
            }));

            setVoices(voiceInfos);

            // Try to restore saved voice from localStorage
            const savedVoiceName = typeof window !== "undefined"
                ? localStorage.getItem(VOICE_KEY)
                : null;

            if (savedVoiceName) {
                const savedVoice = voiceInfos.find((v) => v.name === savedVoiceName);
                if (savedVoice) {
                    setSelectedVoiceState(savedVoice);
                    return;
                }
            }

            // Auto-select preferred voice if no saved voice
            if (!selectedVoiceRef.current) {
                // Priority: Microsoft Neural pt-BR voices > any pt-BR voice > first voice
                const neuralPtBr = voiceInfos.find(
                    (v) =>
                        v.lang.startsWith("pt") &&
                        (v.name.includes("Online") || v.name.includes("Natural"))
                );
                const anyPtBr = voiceInfos.find((v) => v.lang.startsWith("pt"));
                const fallback = voiceInfos[0];

                const chosen = neuralPtBr || anyPtBr || fallback;
                setSelectedVoiceState(chosen);
                if (chosen && typeof window !== "undefined") {
                    localStorage.setItem(VOICE_KEY, chosen.name);
                }
            }
        };

        loadVoices();

        // Chrome/Edge loads voices asynchronously
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            if (typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Speak a single sentence and move to next ──
    const speakSentence = useCallback(
        (sentences: string[], index: number) => {
            if (isStoppingRef.current) return;
            if (index >= sentences.length) {
                setIsPlaying(false);
                setIsPaused(false);
                setCurrentSentenceIndex(-1);
                currentIndexRef.current = 0;
                return;
            }

            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(sentences[index]);

            // Use ref to always get the latest voice (not stale closure)
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
                if (!isStoppingRef.current) {
                    speakSentence(sentences, index + 1);
                }
            };

            utterance.onerror = (event) => {
                if (event.error !== "interrupted" && event.error !== "canceled") {
                    console.error("Speech error:", event.error);
                }
                if (!isStoppingRef.current) {
                    speakSentence(sentences, index + 1);
                }
            };

            synth.speak(utterance);
        },
        [] // Using refs, no deps needed
    );

    // ── Public Controls ──
    const speak = useCallback(
        (sentences: string[], startIndex = 0) => {
            const synth = window.speechSynthesis;
            isStoppingRef.current = false;
            synth.cancel();

            sentencesRef.current = sentences;
            setIsPlaying(true);
            setIsPaused(false);

            // Small delay to ensure cancel completes
            setTimeout(() => {
                speakSentence(sentences, startIndex);
            }, 50);
        },
        [speakSentence]
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
        const synth = window.speechSynthesis;
        isStoppingRef.current = true;
        synth.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSentenceIndex(-1);
        currentIndexRef.current = 0;
    }, []);

    const speakFromIndex = useCallback(
        (sentences: string[], index: number) => {
            const synth = window.speechSynthesis;
            isStoppingRef.current = true;
            synth.cancel();

            sentencesRef.current = sentences;

            setTimeout(() => {
                isStoppingRef.current = false;
                setIsPlaying(true);
                setIsPaused(false);
                speakSentence(sentences, index);
            }, 100);
        },
        [speakSentence]
    );

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            const synth = window.speechSynthesis;
            isStoppingRef.current = true;
            synth.cancel();
        };
    }, []);

    return {
        voices,
        selectedVoice,
        setSelectedVoice,
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
