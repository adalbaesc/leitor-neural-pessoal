"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ReaderView from "@/components/ReaderView";
import { splitIntoSentences, stripHtml, needsTranslation } from "@/lib/textProcessor";

function ReadPageContent() {
    const searchParams = useSearchParams();
    const urlParam = searchParams.get("url");

    const [sentences, setSentences] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [siteName, setSiteName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("");

    // ── Manual URL input ──
    const [manualUrl, setManualUrl] = useState("");

    // ── Translate text via DeepL API ──
    const translateText = useCallback(async (text: string): Promise<string> => {
        const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Erro na tradução.");
        }

        return data.translatedText;
    }, []);

    const fetchArticle = useCallback(async (url: string) => {
        setIsLoading(true);
        setError(null);
        setSentences([]);
        setStatusMessage("Extraindo conteúdo...");

        try {
            const res = await fetch(`/api/fetch-article?url=${encodeURIComponent(url)}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao buscar o artigo.");
                return;
            }

            const cleanText = stripHtml(data.content || data.htmlContent || "");
            setTitle(data.title || "");
            setSiteName(data.siteName || "");

            // Check if translation is needed (not PT, not ES)
            if (needsTranslation(cleanText)) {
                setStatusMessage("Traduzindo para português...");
                try {
                    const translated = await translateText(cleanText);
                    const sents = splitIntoSentences(translated);
                    setSentences(sents);
                } catch (translationError) {
                    // If translation fails, show original text
                    console.error("Translation failed:", translationError);
                    const sents = splitIntoSentences(cleanText);
                    setSentences(sents);
                }
            } else {
                // Text is already in PT or ES, no translation needed
                const sents = splitIntoSentences(cleanText);
                setSentences(sents);
            }
        } catch (err) {
            setError("Não foi possível conectar ao servidor.");
            console.error(err);
        } finally {
            setIsLoading(false);
            setStatusMessage("");
        }
    }, [translateText]);

    // Auto-fetch if URL is provided
    useEffect(() => {
        if (urlParam) {
            fetchArticle(urlParam);
        }
    }, [urlParam, fetchArticle]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualUrl.trim()) {
            fetchArticle(manualUrl.trim());
        }
    };

    return (
        <main className="min-h-screen">
            <Navbar />

            {/* ── URL Input (when no URL param) ── */}
            {!urlParam && sentences.length === 0 && !isLoading && (
                <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-12">
                    <div className="text-center mb-8 animate-fade-in-up">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neural-500/15 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-neural-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Ler URL</h1>
                        <p className="text-gray-400">Cole a URL de um artigo para extrair e ler o conteúdo.</p>
                    </div>

                    <form onSubmit={handleManualSubmit} className="flex gap-3">
                        <input
                            id="url-input"
                            type="url"
                            value={manualUrl}
                            onChange={(e) => setManualUrl(e.target.value)}
                            placeholder="https://exemplo.com/artigo..."
                            className="flex-1 bg-surface border border-neural-500/20 rounded-xl px-4 py-3 
                         text-white placeholder-gray-500 focus:border-neural-500 focus:outline-none
                         transition-colors text-sm"
                            required
                        />
                        <button type="submit" className="btn-neural px-6 rounded-xl">
                            Ler
                        </button>
                    </form>
                </div>
            )}

            {/* ── Loading with status message ── */}
            {isLoading && statusMessage && (
                <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="skeleton h-8 w-3/4" />
                        <div className="skeleton h-4 w-1/4" />
                        <div className="flex items-center gap-3 mt-4">
                            <svg className="w-5 h-5 animate-spin text-neural-400" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            <span className="text-sm text-neural-300">{statusMessage}</span>
                        </div>
                        <div className="mt-8 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="skeleton h-5" style={{ width: `${60 + Math.random() * 40}%` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reader ── */}
            {!isLoading && (
                <ReaderView
                    sentences={sentences}
                    title={title}
                    siteName={siteName}
                    isLoading={false}
                    error={error}
                />
            )}
        </main>
    );
}

export default function ReadPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen">
                    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
                        <div className="space-y-4 animate-fade-in-up">
                            <div className="skeleton h-8 w-3/4" />
                            <div className="skeleton h-4 w-1/4" />
                            <div className="mt-8 space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="skeleton h-5" style={{ width: `${60 + Math.random() * 40}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            }
        >
            <ReadPageContent />
        </Suspense>
    );
}
