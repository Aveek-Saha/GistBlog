import GithubSlugger from "github-slugger";

export interface TableOfContentsItem {
    depth: number;
    id: string;
    label: string;
}

function plainHeading(value: string): string {
    return value
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[`*_~]/g, "")
        .replace(/\s+#+\s*$/, "")
        .trim();
}

function comparableHeading(value: string): string {
    return plainHeading(value)
        .toLocaleLowerCase("en-US")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

export function stripDuplicateTitle(markdown: string, title: string): string {
    const lines = markdown.split("\n");
    const firstContentLine = lines.findIndex((line) => line.trim() !== "");
    if (firstContentLine === -1) return markdown;

    const match = lines[firstContentLine].match(/^#\s+(.+?)\s*#*\s*$/);
    if (!match || comparableHeading(match[1]) !== comparableHeading(title)) {
        return markdown;
    }

    lines.splice(firstContentLine, 1);
    if (lines[firstContentLine]?.trim() === "") lines.splice(firstContentLine, 1);
    return lines.join("\n");
}

export function extractTableOfContents(markdown: string): TableOfContentsItem[] {
    const slugger = new GithubSlugger();
    const headings: TableOfContentsItem[] = [];
    let inFence = false;
    let fenceMarker = "";

    for (const line of markdown.split("\n")) {
        const fence = line.match(/^\s*(```+|~~~+)/);
        if (fence) {
            if (!inFence) {
                inFence = true;
                fenceMarker = fence[1][0];
            } else if (fence[1][0] === fenceMarker) {
                inFence = false;
            }
            continue;
        }
        if (inFence) continue;

        const match = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
        if (!match) continue;
        const label = plainHeading(match[2]);
        if (!label) continue;
        headings.push({
            depth: match[1].length,
            id: slugger.slug(label),
            label,
        });
    }

    return headings.slice(0, 30);
}

export function readingTime(markdown: string): number {
    const readable = markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`]*`/g, " ")
        .replace(/https?:\/\/\S+/g, " ");
    const words = readable.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
}

export function escapeXml(value: string): string {
    return value.replace(/[<>&'\"]/g, (character) => {
        const entities: Record<string, string> = {
            "<": "&lt;",
            ">": "&gt;",
            "&": "&amp;",
            "'": "&apos;",
            '"': "&quot;",
        };
        return entities[character];
    });
}
