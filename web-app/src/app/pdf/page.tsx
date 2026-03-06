"use client";

import { useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import ReaderView from "@/components/ReaderView";
import { splitIntoSentences, detectNonPortuguese } from "@/lib/textProcessor";

function isPdfFile(file: File) {
    const normalizedType = file.type.toLowerCase();
    const normalizedName = file.name.toLowerCase();

    return (
        normalizedName.endsWith(".pdf") ||
        normalizedType === "application/pdf" ||
        normalizedType === "application/x-pdf" ||
        normalizedType.includes("pdf")
    );
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "";
}

export default function PdfPage() {
    const [sentences, setSentences] = useState<string[]>([]);
    const [rawText, setRawText] = useState("");
    const [fileName, setFileName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [showTranslate, setShowTranslate] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const extractTextFromPdf = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setWarning(null);
        setSentences([]);
        setFileName(file.name);
        setRawText("");
        setShowTranslate(false);
        setStatusMessage("Lendo arquivo PDF...");

        try {
            const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();

            let pdf;
            try {
                pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            } catch (workerError) {
                console.warn("PDF loader failed, trying fallback mode without worker...", workerError);
                pdfjsLib.GlobalWorkerOptions.workerSrc = "";
                pdf = await pdfjsLib.getDocument({
                    data: arrayBuffer,
                    isEvalSupported: false,
                    useWorkerFetch: false,
                }).promise;
            }

            let fullText = "";
            setStatusMessage("Extraindo texto...");

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                    .map((item) => {
                        if ("str" in item) return item.str;
                        return "";
                    })
                    .join(" ");

                fullText += `${pageText}\n\n`;
            }

            const cleanText = fullText.trim();

            if (!cleanText) {
                setError("Não foi possível extrair texto deste PDF. O arquivo pode conter apenas imagens.");
                return;
            }

            setRawText(cleanText);

            if (detectNonPortuguese(cleanText)) {
                setStatusMessage("Traduzindo para português...");

                try {
                    const res = await fetch("/api/translate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: cleanText }),
                    });
                    const data = await res.json();

                    if (!res.ok) throw new Error(data.error || "Erro na tradução.");

                    setSentences(splitIntoSentences(data.translatedText));
                    setShowTranslate(false);
                } catch (translationError: unknown) {
                    console.error("Auto-translation failed:", translationError);
                    setSentences(splitIntoSentences(cleanText));
                    setShowTranslate(true);
                    setWarning(
                        "A tradução automática falhou. O texto original foi carregado para leitura. " +
                            getErrorMessage(translationError)
                    );
                }
            } else {
                setSentences(splitIntoSentences(cleanText));
                setShowTranslate(false);
            }
        } catch (processingError) {
            console.error("Erro ao processar PDF:", processingError);
            setError("Erro ao processar o arquivo PDF. Verifique se o arquivo é válido.");
        } finally {
            setIsLoading(false);
            setStatusMessage("");
        }
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file && isPdfFile(file)) {
            extractTextFromPdf(file);
            return;
        }

        if (file) {
            setError("Por favor, selecione um arquivo PDF válido.");
            setWarning(null);
        }
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files?.[0];

        if (file && isPdfFile(file)) {
            extractTextFromPdf(file);
            return;
        }

        setError("Por favor, solte um arquivo PDF válido.");
        setWarning(null);
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
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
        setWarning(null);
        setStatusMessage("");
        setShowTranslate(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleTranslate = async () => {
        if (!rawText) return;

        setIsTranslating(true);
        setError(null);
        setWarning(null);

        try {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: rawText }),
            });

            const data = await res.json();

            if (!res.ok) {
                setWarning(data.error || "Erro na tradução.");
                return;
            }

            setSentences(splitIntoSentences(data.translatedText));
            setShowTranslate(false);
        } catch (translationError: unknown) {
            setWarning("Não foi possível traduzir o texto agora. " + getErrorMessage(translationError));
            console.error(translationError);
        } finally {
            setIsTranslating(false);
        }
    };

    const showUploader = sentences.length === 0 && !isLoading;
    const loadingSkeletonWidths = ["74%", "86%", "68%", "92%", "79%"];

    return (
        <main className="min-h-screen">
            <Navbar />

            {showUploader ? (
                <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-12 animate-fade-in-up">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-cyan/15 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-8 h-8 text-accent-cyan"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Ler PDF</h1>
                        <p className="text-gray-400">
                            Faça upload de um arquivo PDF para extrair e ler o conteúdo. Traduções automáticas suportadas.
                        </p>
                    </div>

                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                            isDragging
                                ? "border-accent-cyan bg-accent-cyan/5 scale-[1.02]"
                                : "border-neural-500/20 hover:border-neural-500/40 bg-surface"
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="pdf-input"
                        />

                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neural-500/10 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-8 h-8 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                />
                            </svg>
                        </div>

                        <p className="text-white font-medium mb-1">
                            {isDragging ? "Solte o arquivo aqui" : "Arraste um PDF ou clique para selecionar"}
                        </p>
                        <p className="text-xs text-gray-500">Apenas arquivos .pdf</p>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm text-red-200/80">
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-4">
                        <button
                            onClick={handleReset}
                            className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Novo PDF
                        </button>
                    </div>

                    {isLoading || statusMessage ? (
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
                                    {loadingSkeletonWidths.map((width, index) => (
                                        <div key={index} className="skeleton h-5" style={{ width }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ReaderView
                            sentences={sentences}
                            title={fileName || "Documento PDF"}
                            isLoading={false}
                            error={error}
                            warning={warning}
                            onTranslate={handleTranslate}
                            isTranslating={isTranslating}
                            showTranslateButton={showTranslate}
                        />
                    )}
                </div>
            )}
        </main>
    );
}
