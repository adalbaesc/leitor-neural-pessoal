"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import ReaderView from "@/components/ReaderView";
import { splitIntoSentences, detectNonPortuguese } from "@/lib/textProcessor";

export default function PastePage() {
    const [sentences, setSentences] = useState<string[]>([]);
    const [rawText, setRawText] = useState("");
    const [inputText, setInputText] = useState("");
    const [showEditor, setShowEditor] = useState(true);
    const [showTranslate, setShowTranslate] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!inputText.trim()) return;

        const text = inputText.trim();
        setRawText(text);
        setShowEditor(false);
        setError(null);

        if (detectNonPortuguese(text)) {
            // Try to auto-translate
            try {
                const res = await fetch("/api/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Erro na tradução.");

                setSentences(splitIntoSentences(data.translatedText));
                setShowTranslate(false);
            } catch (err: any) {
                console.error("Auto-translation failed:", err);
                // Fallback to English text
                setSentences(splitIntoSentences(text));
                setShowTranslate(true); // they can still try manual
                setError("A tradução automática falhou. Verifique a API na Vercel. " + (err.message || ""));
            }
        } else {
            setSentences(splitIntoSentences(text));
            setShowTranslate(false);
        }
    };

    const handleReset = useCallback(() => {
        setSentences([]);
        setRawText("");
        setInputText("");
        setShowEditor(true);
        setShowTranslate(false);
        setError(null);
    }, []);

    const handleTranslate = async () => {
        if (!rawText) return;

        setIsTranslating(true);
        setError(null);
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
        } catch (err: any) {
            setError("Erro ao traduzir o texto. " + (err.message || ""));
            console.error(err);
        } finally {
            setIsTranslating(false);
        }
    };

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

                    <ReaderView
                        sentences={sentences}
                        title="Texto Colado"
                        isLoading={false}
                        error={error}
                        onTranslate={handleTranslate}
                        isTranslating={isTranslating}
                        showTranslateButton={showTranslate}
                    />
                </div>
            )}
        </main>
    );
}
