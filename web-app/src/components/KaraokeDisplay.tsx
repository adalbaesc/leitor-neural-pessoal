"use client";

import { useCallback, useEffect, useRef } from "react";

interface KaraokeDisplayProps {
    sentences: string[];
    activeRange?: { start: number; end: number } | null;
    onSentenceClick?: (index: number) => void;
    title?: string;
    siteName?: string;
}

export default function KaraokeDisplay({
    sentences,
    activeRange = null,
    onSentenceClick,
    title,
    siteName,
}: KaraokeDisplayProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active sentence
    useEffect(() => {
        if (!activeRange) return;

        const activeEl = document.getElementById(`sentence-${activeRange.start}`);
        if (activeEl && containerRef.current) {
            activeEl.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [activeRange]);

    const handleClick = useCallback(
        (index: number) => {
            onSentenceClick?.(index);
        },
        [onSentenceClick]
    );

    if (sentences.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-surface flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-8 h-8 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Nenhum texto para exibir</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="max-w-3xl mx-auto px-4 sm:px-8 pb-28 pt-6">
            {/* ── Article Header ── */}
            {title && (
                <header className="mb-8 animate-fade-in-up">
                    {siteName && (
                        <p className="text-xs text-neural-400 uppercase tracking-wider mb-2 font-semibold">
                            {siteName}
                        </p>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                        {title}
                    </h1>
                    <div className="mt-4 h-px bg-linear-to-r from-neural-500/50 via-accent-cyan/30 to-transparent" />
                </header>
            )}

            {/* ── Sentences ── */}
            <div className="text-lg leading-relaxed text-gray-300 space-y-1">
                {sentences.map((sentence, index) => {
                    const isActive =
                        activeRange !== null &&
                        index >= activeRange.start &&
                        index <= activeRange.end;

                    return (
                        <span
                            key={index}
                            id={`sentence-${index}`}
                            className={`sentence inline ${isActive ? "sentence-active" : ""}`}
                            onClick={() => handleClick(index)}
                            role={onSentenceClick ? "button" : undefined}
                            tabIndex={onSentenceClick ? 0 : undefined}
                            onKeyDown={(e) => {
                                if (onSentenceClick && (e.key === "Enter" || e.key === " ")) {
                                    handleClick(index);
                                }
                            }}
                        >
                            {sentence}{" "}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
