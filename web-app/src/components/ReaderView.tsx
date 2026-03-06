"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCloudAudioPlayer } from "@/hooks/useCloudAudioPlayer";
import KaraokeDisplay from "./KaraokeDisplay";

interface ReaderViewProps {
    sentences: string[];
    title?: string;
    siteName?: string;
    isLoading?: boolean;
    error?: string | null;
    warning?: string | null;
    autoPlay?: boolean;
    contentKey?: string | number;
    translationSuccessToken?: number;
    restartPlaybackToken?: number;
    onTranslate?: (options: { restartPlayback: boolean }) => void | Promise<void>;
    isTranslating?: boolean;
    showTranslateButton?: boolean;
}

const loadingSkeletonWidths = ["72%", "84%", "67%", "91%", "76%", "88%", "69%", "95%"];

export default function ReaderView({
    sentences,
    title,
    siteName,
    isLoading = false,
    error = null,
    warning = null,
    autoPlay = false,
    contentKey,
    translationSuccessToken = 0,
    restartPlaybackToken = 0,
    onTranslate,
    isTranslating = false,
    showTranslateButton = false,
}: ReaderViewProps) {
    const {
        voiceOptions,
        selectedVoiceId,
        setSelectedVoiceId,
        rate,
        setRate,
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
    } = useCloudAudioPlayer({
        sentences,
        contentKey,
    });

    const hasAutoPlayed = useRef(false);
    const previousContentKeyRef = useRef<string | number | undefined>(undefined);

    useEffect(() => {
        if (
            autoPlay &&
            sentences.length > 0 &&
            !hasAutoPlayed.current &&
            !isPlaying &&
            !isLoading &&
            !isTranslating &&
            !error
        ) {
            hasAutoPlayed.current = true;
            void play(0);
        }
    }, [autoPlay, error, isLoading, isPlaying, isTranslating, play, sentences]);

    useEffect(() => {
        hasAutoPlayed.current = false;
    }, [title]);

    useEffect(() => {
        const previousContentKey = previousContentKeyRef.current;
        previousContentKeyRef.current = contentKey;

        if (previousContentKey !== undefined && previousContentKey !== contentKey) {
            hasAutoPlayed.current = false;
            stop();
        }
    }, [contentKey, stop]);

    useEffect(() => {
        if (translationSuccessToken > 0) {
            stop();
        }
    }, [translationSuccessToken, stop]);

    useEffect(() => {
        if (
            restartPlaybackToken > 0 &&
            sentences.length > 0 &&
            !isLoading &&
            !isTranslating &&
            !error
        ) {
            hasAutoPlayed.current = true;
            void play(0);
        }
    }, [restartPlaybackToken, sentences, isLoading, isTranslating, error, play]);

    const handlePlay = useCallback(() => {
        if (isPaused) {
            void resume();
        } else if (!isPlaying) {
            void play(0);
        }
    }, [isPaused, isPlaying, play, resume]);

    const handlePause = useCallback(() => {
        pause();
    }, [pause]);

    const handleStop = useCallback(() => {
        stop();
    }, [stop]);

    const handleTranslate = useCallback(async () => {
        if (!onTranslate) {
            return;
        }

        await onTranslate({
            restartPlayback: isPlaying || isPaused,
        });
    }, [isPaused, isPlaying, onTranslate]);

    const handleSentenceClick = useCallback(
        (index: number) => {
            void play(index);
        },
        [play]
    );

    const rateOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    const notice = warning ?? playbackError ?? (sentences.length > 0 ? error : null);

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
                <div className="space-y-4 animate-fade-in-up">
                    <div className="skeleton h-8 w-3/4" />
                    <div className="skeleton h-4 w-1/4" />
                    <div className="text-sm text-gray-400 mt-2">Carregando conteudo...</div>
                    <div className="mt-8 space-y-3">
                        {loadingSkeletonWidths.map((width, index) => (
                            <div key={index} className="skeleton h-5" style={{ width }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error && sentences.length === 0) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center animate-fade-in-up">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-7 h-7 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-300 mb-2">Erro</h3>
                    <p className="text-red-200/70 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {notice && (
                <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-6">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 animate-fade-in-up">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5 text-amber-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m0 3.75h.008v.008H12v-.008zm8.25-3.75a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-amber-200">Aviso</h3>
                                <p className="text-sm text-amber-100/80">{notice}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <KaraokeDisplay
                sentences={sentences}
                activeRange={activeSentenceRange}
                onSentenceClick={handleSentenceClick}
                title={title}
                siteName={siteName}
            />

            <div className="glass fixed bottom-0 left-0 right-0 z-50 px-4 py-3 sm:px-8">
                <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3 sm:gap-4">
                    {showTranslateButton && onTranslate && (
                        <div className="flex-shrink-0">
                            <button
                                onClick={handleTranslate}
                                disabled={isTranslating}
                                className="px-4 py-2 rounded-xl bg-neural-500/10 border border-neural-500/20 text-sm font-medium text-neural-300 hover:bg-neural-500/20 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isTranslating ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin text-neural-400" viewBox="0 0 24 24" fill="none">
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                className="opacity-25"
                                            />
                                            <path
                                                d="M4 12a8 8 0 018-8"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        Traduzindo...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                            />
                                        </svg>
                                        Traduzir Texto
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {isPlaying && !isPaused ? (
                            <button
                                id="btn-pause"
                                onClick={handlePause}
                                className="w-11 h-11 rounded-full bg-linear-to-br from-neural-500 to-neural-700 flex items-center justify-center text-white hover:from-neural-400 hover:to-neural-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-neural-500/20 animate-pulse-glow"
                                title="Pausar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                id="btn-play"
                                onClick={handlePlay}
                                disabled={sentences.length === 0 || isLoadingAudio}
                                className="w-11 h-11 rounded-full bg-linear-to-br from-neural-500 to-neural-700 flex items-center justify-center text-white hover:from-neural-400 hover:to-neural-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-neural-500/20"
                                title={isPaused ? "Continuar" : "Reproduzir"}
                            >
                                {isLoadingAudio ? (
                                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                id="btn-stop"
                                onClick={handleStop}
                                disabled={!isPlaying && !isPaused && !isLoadingAudio}
                                className="w-9 h-9 rounded-full bg-surface hover:bg-surface-alt border border-neural-500/20 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                                title="Parar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            </button>

                            {(isPlaying || isPaused || isLoadingAudio) && (
                                <span className="text-xs font-medium text-gray-300 whitespace-nowrap">
                                    Parar audio
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="speed-control" className="text-xs text-gray-400 hidden sm:inline">
                            Velocidade
                        </label>
                        <select
                            id="speed-control"
                            value={rate}
                            onChange={(event) => setRate(parseFloat(event.target.value))}
                            className="bg-surface border border-neural-500/20 rounded-lg px-2 py-1.5 text-sm text-gray-200 focus:border-neural-500 focus:outline-none cursor-pointer min-w-[70px]"
                        >
                            {rateOptions.map((rateOption) => (
                                <option key={rateOption} value={rateOption}>
                                    {rateOption}x
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-[170px]">
                        <label htmlFor="voice-selector" className="text-xs text-gray-400 hidden sm:inline">
                            Voz
                        </label>
                        <select
                            id="voice-selector"
                            value={selectedVoiceId}
                            onChange={(event) => setSelectedVoiceId(event.target.value)}
                            className="bg-surface border border-neural-500/20 rounded-lg px-2 py-1.5 text-sm text-gray-200 focus:border-neural-500 focus:outline-none cursor-pointer flex-1 truncate"
                        >
                            {voiceOptions.map((voice) => (
                                <option key={voice.id} value={voice.id}>
                                    {voice.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="text-xs text-gray-500 hidden md:block">
                        {currentChunkIndex >= 0 && totalChunks > 0 ? (
                            <span className="text-neural-400 font-medium">
                                Audio {currentChunkIndex + 1} / {totalChunks}
                            </span>
                        ) : (
                            <span>{sentences.length} frases</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
