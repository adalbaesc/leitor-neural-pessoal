"use client";

import { useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import ReaderView from "@/components/ReaderView";
import { splitIntoSentences, detectNonPortuguese } from "@/lib/textProcessor";

export default function PdfPage() {
    const [sentences, setSentences] = useState<string[]>([]);
    const [rawText, setRawText] = useState("");
    const [fileName, setFileName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Manual translate state
    const [showTranslate, setShowTranslate] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const extractTextFromPdf = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setSentences([]);
        setFileName(file.name);
        setRawText("");
        setShowTranslate(false);

        try {
            // Dynamic import of pdf.js (client-side only)
            const pdfjsLib = await import("pdfjs-dist");

            // Define reliable local worker src 
            pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';

            // Read file
            const arrayBuffer = await file.arrayBuffer();

            let pdf;
            try {
                pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            } catch {
                // Fallback: disable worker and eval execution if standard loading fails
                console.warn("PDF loader failed, trying fallback mode without worker...");
                pdfjsLib.GlobalWorkerOptions.workerSrc = "";
                pdf = await pdfjsLib.getDocument({
                    data: arrayBuffer,
                    isEvalSupported: false,
                    useWorkerFetch: false,
                }).promise;
            }

            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                    .map((item) => {
                        if ("str" in item) return item.str;
                        return "";
                    })
                    .join(" ");

                fullText += pageText + "\n\n";
            }

            const cleanText = fullText.trim();

            if (!cleanText) {
                setError("Não foi possível extrair texto deste PDF. O arquivo pode conter apenas imagens.");
                setIsLoading(false);
                return;
            }

            setRawText(cleanText);
            setSentences(splitIntoSentences(cleanText));

            if (detectNonPortuguese(cleanText)) {
                setShowTranslate(true);
            }

        } catch (err) {
            console.error("Erro ao processar PDF:", err);
            setError("Erro ao processar o arquivo PDF. Verifique se o arquivo é válido.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            extractTextFromPdf(file);
        } else if (file) {
            setError("Por favor, selecione um arquivo PDF válido.");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") {
            extractTextFromPdf(file);
        } else {
            setError("Por favor, solte um arquivo PDF válido.");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setSentences([]);
        setRawText("");
        setFileName("");
        setError(null);
        setShowTranslate(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
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

    const showUploader = sentences.length === 0 && !isLoading;

    return (
        <main className="min-h-screen">
            <Navbar />

            {showUploader ? (
                <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-12 animate-fade-in-up">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-cyan/15 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Ler PDF</h1>
                        <p className="text-gray-400">Faça upload de um arquivo PDF para extrair e ler o conteúdo.</p>
                    </div>

                    {/* Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
              transition-all duration-300
              ${isDragging
                                ? "border-accent-cyan bg-accent-cyan/5 scale-[1.02]"
                                : "border-neural-500/20 hover:border-neural-500/40 bg-surface"
                            }
            `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="pdf-input"
                        />

                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neural-500/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        </div>

                        <p className="text-white font-medium mb-1">
                            {isDragging ? "Solte o arquivo aqui" : "Arraste um PDF ou clique para selecionar"}
                        </p>
                        <p className="text-xs text-gray-500">Apenas arquivos .pdf</p>
                    </div>
                </div>
            ) : (
                <div>
                    {/* Back button */}
                    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-4">
                        <button
                            onClick={handleReset}
                            className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Novo PDF
                        </button>
                    </div>

                    {/* Display Error if any, otherwise hide the custom text when loading */}
                    <ReaderView
                        sentences={sentences}
                        title={fileName || "Documento PDF"}
                        isLoading={isLoading}
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
