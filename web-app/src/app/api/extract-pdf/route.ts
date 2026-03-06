import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

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

function getExtractionError(error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno ao extrair o PDF.";
    const normalizedMessage = message.toLowerCase();

    if (
        normalizedMessage.includes("invalid pdf") ||
        normalizedMessage.includes("malformed") ||
        normalizedMessage.includes("unexpected server response")
    ) {
        return {
            status: 400,
            error: "Arquivo PDF invalido ou corrompido.",
        };
    }

    return {
        status: 500,
        error: message,
    };
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
            return NextResponse.json({ error: "Arquivo PDF nao enviado." }, { status: 400 });
        }

        if (!isPdfUpload(file.name || "", file.type || "")) {
            return NextResponse.json({ error: "Envie um arquivo PDF valido." }, { status: 400 });
        }

        const data = new Uint8Array(await file.arrayBuffer());

        if (data.length === 0) {
            return NextResponse.json({ error: "Arquivo PDF vazio." }, { status: 400 });
        }

        const pdf = await getDocumentProxy(data);
        const extracted = await extractText(pdf, { mergePages: true });
        const text = extracted.text.trim();

        if (!text) {
            return NextResponse.json(
                { error: "Nenhum texto extraivel foi encontrado neste PDF. O arquivo pode conter apenas imagens." },
                { status: 422 }
            );
        }

        return NextResponse.json({
            text,
            pages: extracted.totalPages,
            fileName: file.name || null,
        });
    } catch (error) {
        console.error("PDF extraction API error:", error);
        const extractionError = getExtractionError(error);
        return NextResponse.json({ error: extractionError.error }, { status: extractionError.status });
    }
}
