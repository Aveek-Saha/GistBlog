const FALLBACK_SITE_URL = "https://gistblog.vercel.app";

export function getSiteUrl(): string {
    const configured = process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL;
    try {
        const url = new URL(configured);
        if (url.protocol !== "https:" && url.hostname !== "localhost") {
            return FALLBACK_SITE_URL;
        }
        return url.origin;
    } catch {
        return FALLBACK_SITE_URL;
    }
}

export function absoluteUrl(path: string): string {
    return new URL(path, `${getSiteUrl()}/`).toString();
}
