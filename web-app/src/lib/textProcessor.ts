/**
 * Represents a paragraph containing sentences.
 */
export interface Paragraph {
    sentences: string[];
    isEmpty: boolean;
}

/**
 * Represents the structured content with paragraphs.
 */
export interface StructuredContent {
    paragraphs: Paragraph[];
    flatSentences: string[];
}

const SENTENCE_END_PUNCTUATION = /[.!?…]+[\s]?/g;
const PARAGRAPH_SEPARATORS = /\n\s*\n|\r\n\s*\r\n/g;

function splitIntoSentencesArray(text: string): string[] {
    if (!text || typeof text !== "string") return [];

    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return [];

    const raw = cleaned.match(/[^.!?;]+[.!?;]+[\s]?|[^.!?;]+$/g);
    if (!raw) return [cleaned];

    return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function normalizeText(text: string): string {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\t/g, " ")
        .replace(/\u00A0/g, " ")
        .trim();
}

function cleanParagraphText(text: string): string {
    return text
        .replace(/\s+/g, " ")
        .replace(/^[\s.,;:!?'")}\]–—•]+|[\s.,;:!?'")}\]–—•]+$/g, "")
        .trim();
}

export function parseStructuredContent(text: string): StructuredContent {
    const normalized = normalizeText(text);

    if (!normalized) {
        return { paragraphs: [], flatSentences: [] };
    }

    const paragraphTexts = normalized.split(PARAGRAPH_SEPARATORS);
    const paragraphs: Paragraph[] = [];

    for (const paraText of paragraphTexts) {
        const cleaned = cleanParagraphText(paraText);

        if (!cleaned) {
            paragraphs.push({ sentences: [], isEmpty: true });
            continue;
        }

        const sentences = splitIntoSentencesArray(cleaned);

        if (sentences.length > 0) {
            paragraphs.push({ sentences, isEmpty: false });
        }
    }

    const flatSentences = paragraphs
        .filter((p) => !p.isEmpty)
        .flatMap((p) => p.sentences);

    return { paragraphs, flatSentences };
}

export function splitIntoSentences(text: string): string[] {
    return parseStructuredContent(text).flatSentences;
}

export function hasParagraphs(text: string): boolean {
    return text.includes("\n\n") || text.includes("\r\n\r\n");
}

/**
 * Strip HTML tags from text content.
 */
export function stripHtml(html: string): string {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Detect if text needs translation.
 * Returns true if text is NOT in Portuguese or Spanish.
 * Uses multiple language markers to detect various languages.
 */
export function needsTranslation(text: string): boolean {
    if (!text || text.length < 50) return false;

    const sample = text.substring(0, 1000).toLowerCase();

    // ── Portuguese markers ──
    const ptMarkers = [
        " que ", " não ", " com ", " uma ", " para ", " mais ", " como ",
        " dos ", " das ", " são ", " tem ", " foi ", " está ", " pelo ",
        " pela ", " isso ", " muito ", " ainda ", " também ", " quando ",
        " pode ", " esse ", " essa ", " entre ", " depois ", " outro ",
        " ção ", " ções ", " mente ", " ência ", " sobre ",
    ];

    // ── Spanish markers ──
    const esMarkers = [
        " que ", " con ", " una ", " para ", " más ", " como ",
        " los ", " las ", " son ", " tiene ", " fue ", " está ",
        " por ", " esto ", " muy ", " también ", " cuando ",
        " puede ", " este ", " esta ", " entre ", " después ",
        " otro ", " ción ", " mente ", " sobre ", " pero ",
        " del ", " hay ",
    ];

    // Count PT/ES markers
    let ptCount = 0;
    let esCount = 0;

    for (const marker of ptMarkers) {
        if (sample.includes(marker)) ptCount++;
    }
    for (const marker of esMarkers) {
        if (sample.includes(marker)) esCount++;
    }

    // If PT or ES markers are dominant, no translation needed
    if (ptCount >= 4 || esCount >= 4) {
        return false;
    }

    // If very few PT/ES markers, it's likely a foreign language → needs translation
    return true;
}

/**
 * @deprecated Use needsTranslation() instead
 */
export function detectNonPortuguese(text: string): boolean {
    return needsTranslation(text);
}
