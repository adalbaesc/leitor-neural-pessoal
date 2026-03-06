import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isPdfUpload(fileName: string, mimeType: string) {
    const normalizedName = fileName.toLowerCase();
    const normalizedType = mimeType.toLowerCase();

    return (
        normalizedName.endsWith(".pdf") ||
        normalizedType === "application/pdf" ||
        normalizedType === "application/x-pdf" ||
        normalizedType.includes("pdf")
    );
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Erro desconhecido ao extrair o PDF.";
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
            return NextResponse.json({ error: "Arquivo PDF não enviado." }, { status: 400 });
        }

        if (!isPdfUpload(file.name || "", file.type || "")) {
            return NextResponse.json({ error: "Envie um arquivo PDF válido." }, { status: 400 });
        }

        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({
            data,
            isEvalSupported: false,
            useWorkerFetch: false,
            disableFontFace: true,
            useSystemFonts: true,
        }).promise;

        let fullText = "";

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
                .map((item) => ("str" in item ? item.str : ""))
                .join(" ");

            fullText += `${pageText}\n\n`;
        }

        const text = fullText.trim();

        if (!text) {
            return NextResponse.json(
                { error: "Não foi possível extrair texto deste PDF. O arquivo pode conter apenas imagens." },
                { status: 422 }
            );
        }

        return NextResponse.json({
            text,
            pages: pdf.numPages,
            fileName: file.name || null,
        });
    } catch (error) {
        console.error("PDF extraction API error:", error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}