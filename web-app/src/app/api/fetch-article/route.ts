import { NextRequest, NextResponse } from "next/server";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json(
            { error: "Parâmetro 'url' é obrigatório." },
            { status: 400 }
        );
    }

    try {
        // Fetch the page
        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Falha ao acessar a URL: ${response.status} ${response.statusText}` },
                { status: 502 }
            );
        }

        const html = await response.text();

        // Parse with JSDOM + Readability
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            return NextResponse.json(
                { error: "Não foi possível extrair o conteúdo principal da página." },
                { status: 422 }
            );
        }

        return NextResponse.json({
            title: article.title || "Sem título",
            content: article.textContent || "",
            htmlContent: article.content || "",
            siteName: article.siteName || "",
            excerpt: article.excerpt || "",
            byline: article.byline || "",
            length: article.length || 0,
        });
    } catch (err) {
        console.error("Erro ao buscar artigo:", err);

        const message =
            err instanceof Error ? err.message : "Erro desconhecido ao processar a URL.";

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
