const GIST_ID_PATTERN = /^[a-f0-9]{5,64}$/i;

export function extractGistId(value: string): string | null {
    const input = value.trim();
    if (GIST_ID_PATTERN.test(input)) return input.toLowerCase();

    try {
        const url = new URL(input);
        if (url.hostname !== "gist.github.com") return null;
        const parts = url.pathname.split("/").filter(Boolean);
        const candidate = parts.at(-1)?.split(".")[0] ?? "";
        return GIST_ID_PATTERN.test(candidate) ? candidate.toLowerCase() : null;
    } catch {
        return null;
    }
}
