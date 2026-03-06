"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ReaderView from "@/components/ReaderView";
import { splitIntoSentences, stripHtml, detectNonPortuguese } from "@/lib/textProcessor";

function ReadPageContent() {
    const searchParams = useSearchParams();
    const urlParam = searchParams.get("url");

    const [sentences, setSentences] = useState<string[]>([]);
    const [rawText, setRawText] = useState("");
    const [title, setTitle] = useState("");
    const [siteName, setSiteName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Manual replace and translate states
    const [showTranslate, setShowTranslate] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    // ── Manual URL input ──
    const [manualUrl, setManualUrl] = useState("");

    const fetchArticle = useCallback(async (url: string) => {
        setIsLoading(true);
        setError(null);
        setSentences([]);
        setRawText("");
        setShowTranslate(false);

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

            setRawText(cleanText);
            setSentences(splitIntoSentences(cleanText));

            if (detectNonPortuguese(cleanText)) {
                setShowTranslate(true);
            }
        } catch (err) {
            setError("Não foi possível conectar ao servidor.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

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

    const handleTranslate = async () => {
        if (!rawText) return;

        setIsTranslating(true);
        try {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: rawText }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro na tradução.");
                return;
            }

            const translatedSentences = splitIntoSentences(data.translatedText);
            setSentences(translatedSentences);
            setShowTranslate(false);
        } catch (err) {
            setError("Erro ao traduzir o texto.");
            console.error(err);
        } finally {
            setIsTranslating(false);
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

            <ReaderView
                sentences={sentences}
                title={title}
                siteName={siteName}
                isLoading={isLoading}
                error={error}
                onTranslate={handleTranslate}
                isTranslating={isTranslating}
                showTranslateButton={showTranslate}
            />
        </main>
    );
}

export default function ReadPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-pulse flex items-center gap-3">
                    <svg className="w-6 h-6 animate-spin text-neural-400" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <span className="text-neural-300 font-medium tracking-wide">Iniciando leitor...</span>
                </div>
            </div>
        }>
            <ReadPageContent />
        </Suspense>
    );
}
