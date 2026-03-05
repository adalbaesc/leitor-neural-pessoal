/**
 * Utility: Split text into sentences for karaoke display.
 * Uses regex to split on sentence-ending punctuation while preserving the punctuation.
 */
export function splitIntoSentences(text: string): string[] {
    if (!text || typeof text !== "string") return [];

    // Clean extra whitespace
    const cleaned = text
        .replace(/\s+/g, " ")
        .replace(/\n+/g, " ")
        .trim();

    if (!cleaned) return [];

    // Split on sentence-ending punctuation (., !, ?, ;) followed by space or end
    // Also handle ellipsis (...) and other punctuation
    const raw = cleaned.match(/[^.!?;]+[.!?;]+[\s]?|[^.!?;]+$/g);

    if (!raw) return [cleaned];

    return raw
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
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
 * Detect if text is likely in a non-Portuguese language.
 * Simple heuristic: looks for common non-Portuguese patterns.
 */
export function detectNonPortuguese(text: string): boolean {
    if (!text) return false;

    const sample = text.substring(0, 500).toLowerCase();

    // Common English words that rarely appear in Portuguese
    const englishMarkers = [
        " the ",
        " and ",
        " that ",
        " with ",
        " from ",
        " this ",
        " have ",
        " been ",
        " which ",
        " would ",
        " could ",
        " should ",
        " their ",
    ];

    let englishCount = 0;
    for (const marker of englishMarkers) {
        if (sample.includes(marker)) englishCount++;
    }

    // If 3+ English markers found, likely English
    return englishCount >= 3;
}
