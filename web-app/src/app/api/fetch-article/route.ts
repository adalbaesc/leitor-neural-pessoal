import { NextRequest, NextResponse } from "next/server";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export const maxDuration = 30; // Vercel function timeout

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
        // Validate URL
        const parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return NextResponse.json(
                { error: "Apenas URLs HTTP/HTTPS são suportadas." },
                { status: 400 }
            );
        }

        // Fetch the page with robust headers
        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
                "Cache-Control": "no-cache",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1",
            },
            signal: AbortSignal.timeout(25000),
            redirect: "follow",
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
            // Fallback: try to extract body text directly
            const bodyText = dom.window.document.body?.textContent?.trim();
            if (bodyText && bodyText.length > 100) {
                return NextResponse.json({
                    title: dom.window.document.title || "Sem título",
                    content: bodyText,
                    htmlContent: "",
                    siteName: "",
                    excerpt: bodyText.substring(0, 200),
                    byline: "",
                    length: bodyText.length,
                });
            }

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

        if (err instanceof Error) {
            if (err.name === "AbortError" || err.message.includes("timeout")) {
                return NextResponse.json(
                    { error: "A requisição excedeu o tempo limite. Tente outra URL." },
                    { status: 504 }
                );
            }
            return NextResponse.json({ error: err.message }, { status: 500 });
        }

        return NextResponse.json(
            { error: "Erro desconhecido ao processar a URL." },
            { status: 500 }
        );
    }
}
