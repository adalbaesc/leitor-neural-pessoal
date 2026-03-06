"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import ReaderView from "@/components/ReaderView";
import { splitIntoSentences, needsTranslation } from "@/lib/textProcessor";

export default function PastePage() {
    const [sentences, setSentences] = useState<string[]>([]);
    const [rawText, setRawText] = useState("");
    const [inputText, setInputText] = useState("");
    const [showEditor, setShowEditor] = useState(true);
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("");

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

    const handleSubmit = useCallback(async () => {
        if (!inputText.trim()) return;

        setError(null);
        setRawText(inputText.trim());
        setShowEditor(false);

        if (needsTranslation(inputText)) {
            setIsTranslating(true);
            setStatusMessage("Traduzindo para português...");
            try {
                const translated = await translateText(inputText.trim());
                const sents = splitIntoSentences(translated);
                setSentences(sents);
            } catch (err) {
                console.error("Translation failed:", err);
                // Fallback to original
                setSentences(splitIntoSentences(inputText.trim()));
            } finally {
                setIsTranslating(false);
                setStatusMessage("");
            }
        } else {
            setSentences(splitIntoSentences(inputText.trim()));
        }
    }, [inputText, translateText]);

    const handleReset = useCallback(() => {
        setSentences([]);
        setRawText("");
        setInputText("");
        setShowEditor(true);
        setError(null);
    }, []);

    return (
        <main className="min-h-screen">
            <Navbar />

            {showEditor ? (
                <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-12 animate-fade-in-up">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/15 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Colar Texto</h1>
                        <p className="text-gray-400">Cole ou digite o texto que você deseja ouvir. Traduções automáticas suportadas.</p>
                    </div>

                    {/* Textarea */}
                    <textarea
                        id="text-input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Cole seu texto aqui..."
                        rows={12}
                        className="w-full bg-surface border border-neural-500/20 rounded-2xl px-5 py-4 
                       text-white placeholder-gray-500 focus:border-neural-500 focus:outline-none
                       transition-colors text-sm leading-relaxed resize-y min-h-[200px]"
                    />

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-gray-500">
                            {inputText.length > 0
                                ? `${inputText.length} caracteres • ~${splitIntoSentences(inputText).length} frases`
                                : "Nenhum texto inserido"}
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={!inputText.trim()}
                            className="btn-neural px-6 rounded-xl disabled:opacity-40"
                        >
                            Iniciar Leitura
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    {/* Back to editor button */}
                    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-4">
                        <button
                            onClick={handleReset}
                            className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Novo texto
                        </button>
                    </div>

                    {/* Loading State during Translation */}
                    {isTranslating ? (
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
                    ) : (
                        <ReaderView
                            sentences={sentences}
                            title="Texto Colado"
                            isLoading={false}
                            error={error}
                        />
                    )}
                </div>
            )}
        </main>
    );
}
