const GIST_ID_PATTERN = /^[a-f0-9]{5,64}$/i;
const USERNAME_PATTERN = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,39}(?<!-)$/;

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

export function extractGitHubUsername(value: string): string | null {
    const input = value.trim();
    if (USERNAME_PATTERN.test(input)) return input;

    try {
        const url = new URL(input);
        if (url.hostname !== "github.com" && url.hostname !== "gist.github.com") {
            return null;
        }
        const candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
        return USERNAME_PATTERN.test(candidate) ? candidate : null;
    } catch {
        return null;
    }
}
