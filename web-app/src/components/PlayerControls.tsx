"use client";

import { useNeuralReader, VoiceInfo } from "@/hooks/useNeuralReader";

interface PlayerControlsProps {
    sentences: string[];
    onSentenceChange?: (index: number) => void;
}

export default function PlayerControls({
    sentences,
    onSentenceChange,
}: PlayerControlsProps) {
    const {
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
    } = useNeuralReader();

    // Sync sentence index with parent
    if (onSentenceChange && currentSentenceIndex >= 0) {
        // We'll use a ref-based approach in the parent instead
    }

    const handlePlay = () => {
        if (isPaused) {
            resume();
        } else if (!isPlaying) {
            speak(sentences, 0);
        }
    };

    const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = voices.find((v) => v.name === e.target.value);
        if (selected) {
            setSelectedVoice(selected);
        }
    };

    const rateOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

    // Group voices by language
    const ptVoices = voices.filter((v) => v.lang.startsWith("pt"));
    const otherVoices = voices.filter((v) => !v.lang.startsWith("pt"));

    return (
        <div className="glass fixed bottom-0 left-0 right-0 z-50 px-4 py-3 sm:px-8">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3 sm:gap-4">
                {/* ── Playback Buttons ── */}
                <div className="flex items-center gap-2">
                    {/* Play / Pause */}
                    <button
                        id="btn-play"
                        onClick={handlePlay}
                        disabled={sentences.length === 0}
                        className="w-11 h-11 rounded-full bg-gradient-to-br from-neural-500 to-neural-700 
                       flex items-center justify-center text-white 
                       hover:from-neural-400 hover:to-neural-600 
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200 hover:scale-105 active:scale-95
                       shadow-lg shadow-neural-500/20"
                        title={isPaused ? "Continuar" : "Reproduzir"}
                    >
                        {isPlaying && !isPaused ? (
                            <svg onClick={(e) => { e.stopPropagation(); pause(); }} xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Stop */}
                    <button
                        id="btn-stop"
                        onClick={stop}
                        disabled={!isPlaying && !isPaused}
                        className="w-9 h-9 rounded-full bg-surface hover:bg-surface-alt 
                       border border-neural-500/20 flex items-center justify-center 
                       text-gray-400 hover:text-white
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-200"
                        title="Parar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                    </button>
                </div>

                {/* ── Speed Control ── */}
                <div className="flex items-center gap-2">
                    <label htmlFor="speed-control" className="text-xs text-gray-400 hidden sm:inline">
                        Velocidade
                    </label>
                    <select
                        id="speed-control"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="bg-surface border border-neural-500/20 rounded-lg px-2 py-1.5 
                       text-sm text-gray-200 focus:border-neural-500 focus:outline-none
                       cursor-pointer min-w-[70px]"
                    >
                        {rateOptions.map((r) => (
                            <option key={r} value={r}>
                                {r}x
                            </option>
                        ))}
                    </select>
                </div>

                {/* ── Voice Selector ── */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label htmlFor="voice-selector" className="text-xs text-gray-400 hidden sm:inline">
                        Voz
                    </label>
                    <select
                        id="voice-selector"
                        value={selectedVoice?.name || ""}
                        onChange={handleVoiceChange}
                        className="bg-surface border border-neural-500/20 rounded-lg px-2 py-1.5 
                       text-sm text-gray-200 focus:border-neural-500 focus:outline-none
                       cursor-pointer flex-1 truncate"
                    >
                        {ptVoices.length > 0 && (
                            <optgroup label="Português (BR)">
                                {ptVoices.map((v) => (
                                    <option key={v.name} value={v.name}>
                                        {v.name} ({v.lang})
                                    </option>
                                ))}
                            </optgroup>
                        )}
                        {otherVoices.length > 0 && (
                            <optgroup label="Outras">
                                {otherVoices.map((v) => (
                                    <option key={v.name} value={v.name}>
                                        {v.name} ({v.lang})
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>

                {/* ── Progress Info ── */}
                <div className="text-xs text-gray-500 hidden md:block">
                    {isPlaying && currentSentenceIndex >= 0 ? (
                        <span className="text-neural-400">
                            {currentSentenceIndex + 1}/{sentences.length}
                        </span>
                    ) : (
                        <span>{sentences.length} frases</span>
                    )}
                </div>
            </div>
        </div>
    );
}
