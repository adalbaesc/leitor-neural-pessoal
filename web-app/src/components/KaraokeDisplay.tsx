"use client";

import { useCallback, useEffect, useRef, type ReactElement } from "react";
import type { Paragraph } from "@/lib/textProcessor";

interface KaraokeDisplayProps {
    sentences: string[];
    paragraphs?: Paragraph[];
    activeRange?: { start: number; end: number } | null;
    onSentenceClick?: (index: number) => void;
    title?: string;
    siteName?: string;
}

export default function KaraokeDisplay({
    sentences,
    paragraphs,
    activeRange = null,
    onSentenceClick,
    title,
    siteName,
}: KaraokeDisplayProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sentenceRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

    useEffect(() => {
        if (!activeRange) return;

        const activeEl = sentenceRefs.current.get(activeRange.start);
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

    const setSentenceRef = useCallback((index: number, el: HTMLSpanElement | null) => {
        if (el) {
            sentenceRefs.current.set(index, el);
        } else {
            sentenceRefs.current.delete(index);
        }
    }, []);

    const getGlobalSentenceIndex = (paraIndex: number, sentenceIndex: number): number => {
        if (!paragraphs) return sentenceIndex;
        
        let count = 0;
        for (let i = 0; i < paraIndex; i++) {
            if (!paragraphs[i].isEmpty) {
                count += paragraphs[i].sentences.length;
            }
        }
        return count + sentenceIndex;
    };

    const isActive = (globalIndex: number): boolean => {
        if (!activeRange) return false;
        return globalIndex >= activeRange.start && globalIndex <= activeRange.end;
    };

    const renderParagraphs = () => {
        if (!paragraphs || paragraphs.length === 0) {
            return sentences.map((sentence, index) => (
                <span
                    key={index}
                    ref={(el) => setSentenceRef(index, el)}
                    id={`sentence-${index}`}
                    className={`sentence inline ${isActive(index) ? "sentence-active" : ""}`}
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
            ));
        }

        const elements: ReactElement[] = [];
        let globalIndex = 0;

        for (let paraIndex = 0; paraIndex < paragraphs.length; paraIndex++) {
            const paragraph = paragraphs[paraIndex];

            if (paragraph.isEmpty) {
                elements.push(<div key={`para-${paraIndex}`} className="h-4" />);
                continue;
            }

            elements.push(
                <p key={`para-${paraIndex}`} className="mb-4">
                    {paragraph.sentences.map((sentence, sentenceIndex) => {
                        const idx = getGlobalSentenceIndex(paraIndex, sentenceIndex);
                        const isCurrentlyActive = isActive(idx);

                        return (
                            <span
                                key={idx}
                                ref={(el) => setSentenceRef(idx, el)}
                                id={`sentence-${idx}`}
                                className={`sentence inline ${isCurrentlyActive ? "sentence-active" : ""}`}
                                onClick={() => handleClick(idx)}
                                role={onSentenceClick ? "button" : undefined}
                                tabIndex={onSentenceClick ? 0 : undefined}
                                onKeyDown={(e) => {
                                    if (onSentenceClick && (e.key === "Enter" || e.key === " ")) {
                                        handleClick(idx);
                                    }
                                }}
                            >
                                {sentence}{" "}
                            </span>
                        );
                    })}
                </p>
            );

            globalIndex += paragraph.sentences.length;
        }

        return elements;
    };

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
        <div ref={containerRef} className="flex flex-col h-full overflow-y-auto scroll-smooth px-4 sm:px-6">
            {title && (
                <header className="sticky top-0 bg-[#0b0920] z-10 pb-2 border-b border-neural-500/20 pt-1 flex-shrink-0">
                    {siteName && (
                        <p className="text-xs text-neural-400 uppercase tracking-wider font-semibold">
                            {siteName}
                        </p>
                    )}
                    <h1 className="text-xl font-bold text-white leading-tight truncate">
                        {title}
                    </h1>
                </header>
            )}

            <div className="flex-1 text-lg leading-7 text-gray-300 py-2">
                {renderParagraphs()}
            </div>
        </div>
    );
}