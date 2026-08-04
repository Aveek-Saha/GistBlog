const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_REVALIDATE_SECONDS = 300;
const GITHUB_REQUEST_TIMEOUT_MS = 8_000;
const MAX_MARKDOWN_BYTES = 512_000;

export const BLOG_POSTS_PER_PAGE = 5;

interface GistFile {
    filename: string;
    type: string;
    raw_url: string;
    language: string | null;
    content?: string;
    truncated?: boolean;
    size?: number;
}

interface GitHubGist {
    id: string;
    html_url: string;
    files: Record<string, GistFile>;
    description: string | null;
    owner: Owner | null;
    created_at: string;
    updated_at: string;
}

export interface PostMetadata {
    date?: string;
    title?: string;
    description?: string;
    tags?: string[];
}

export interface Owner {
    login: string;
    avatar_url: string;
    html_url: string;
}

export interface BlogPost {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    metadata: PostMetadata;
}

export interface BlogPage {
    owner: Owner;
    posts: BlogPost[];
    page: number;
    pageCount: number;
    totalPosts: number;
}

export interface GistPost {
    gistUrl: string;
    markdownContent: string;
    metadata: PostMetadata;
    title: string;
    description: string;
    owner: Owner;
    createdAt: string;
    updatedAt: string;
}

export class GitHubError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly retryAfter?: string
    ) {
        super(message);
        this.name = "GitHubError";
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function validateGitHubUsername(username: string): string {
    const normalized = username.trim();
    const isValid =
        normalized.length <= 39 &&
        /^(?!-)(?!.*--)[A-Za-z0-9-]+(?<!-)$/.test(normalized);

    if (!isValid) {
        throw new GitHubError("Invalid GitHub username", 400);
    }

    return normalized;
}

export function validateGistId(gistId: string): string {
    const normalized = gistId.trim().toLowerCase();

    if (!/^[a-f0-9]{5,64}$/.test(normalized)) {
        throw new GitHubError("Invalid gist ID", 400);
    }

    return normalized;
}

export function validatePage(page: number): number {
    if (!Number.isSafeInteger(page) || page < 1 || page > 1_000) {
        throw new GitHubError("Invalid page number", 400);
    }

    return page;
}

function githubHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "GistBlog",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
    };

    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    return headers;
}

async function githubFetch<T>(path: string): Promise<T> {
    let response: Response;

    try {
        response = await fetch(`${GITHUB_API_URL}${path}`, {
            headers: githubHeaders(),
            signal: AbortSignal.timeout(GITHUB_REQUEST_TIMEOUT_MS),
            next: { revalidate: GITHUB_REVALIDATE_SECONDS },
        });
    } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
            throw new GitHubError("GitHub took too long to respond", 504);
        }
        throw new GitHubError("Unable to reach GitHub", 502);
    }

    if (!response.ok) {
        const retryAfter =
            response.headers.get("retry-after") ??
            response.headers.get("x-ratelimit-reset") ??
            undefined;

        if (response.status === 404) {
            throw new GitHubError("GitHub resource not found", 404);
        }
        if (response.status === 403 || response.status === 429) {
            throw new GitHubError("GitHub API rate limit exceeded", 429, retryAfter);
        }

        throw new GitHubError("GitHub request failed", 502, retryAfter);
    }

    return (await response.json()) as T;
}

export function findPostFile(
    files: Record<string, GistFile>,
    requirePostSuffix = true
): GistFile | undefined {
    const candidates = Object.values(files);
    const postFile = candidates.find((file) =>
        file.filename.toLowerCase().endsWith("_post.md")
    );

    if (postFile || requirePostSuffix) return postFile;

    return candidates.find((file) => file.filename.toLowerCase().endsWith(".md"));
}

function parseScalar(value: string): string {
    const trimmed = value.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

export function parsePostMarkdown(markdown: string): {
    content: string;
    metadata: PostMetadata;
} {
    if (!markdown.startsWith("---\n") && !markdown.startsWith("---\r\n")) {
        return { content: markdown, metadata: {} };
    }

    const normalized = markdown.replace(/\r\n/g, "\n");
    const closingIndex = normalized.indexOf("\n---\n", 4);
    if (closingIndex === -1 || closingIndex > 4_096) {
        return { content: markdown, metadata: {} };
    }

    const metadata: PostMetadata = {};
    const frontmatter = normalized.slice(4, closingIndex);

    for (const line of frontmatter.split("\n").slice(0, 50)) {
        const separator = line.indexOf(":");
        if (separator === -1) continue;

        const key = line.slice(0, separator).trim();
        const value = parseScalar(line.slice(separator + 1));

        if (key === "title" && value) metadata.title = value.slice(0, 200);
        if (key === "description" && value) {
            metadata.description = value.slice(0, 500);
        }
        if (key === "date" && value) metadata.date = value.slice(0, 50);
        if (key === "tags" && value) {
            const tagValue = value.replace(/^\[/, "").replace(/\]$/, "");
            metadata.tags = tagValue
                .split(",")
                .map((tag) => parseScalar(tag).trim())
                .filter(Boolean)
                .slice(0, 10);
        }
    }

    return {
        content: normalized.slice(closingIndex + 5),
        metadata,
    };
}

async function getMarkdownContent(file: GistFile): Promise<string> {
    let content = file.content;

    if (file.truncated || content === undefined) {
        let rawUrl: URL;
        try {
            rawUrl = new URL(file.raw_url);
        } catch {
            throw new GitHubError("Invalid gist content URL", 502);
        }
        if (
            rawUrl.protocol !== "https:" ||
            rawUrl.hostname !== "gist.githubusercontent.com"
        ) {
            throw new GitHubError("Invalid gist content URL", 502);
        }

        let response: Response;
        try {
            response = await fetch(rawUrl, {
                signal: AbortSignal.timeout(GITHUB_REQUEST_TIMEOUT_MS),
                next: { revalidate: GITHUB_REVALIDATE_SECONDS },
            });
        } catch {
            throw new GitHubError("Unable to load gist content", 502);
        }

        if (!response.ok) {
            throw new GitHubError("Unable to load gist content", 502);
        }
        content = await response.text();
    }

    if (Buffer.byteLength(content, "utf8") > MAX_MARKDOWN_BYTES) {
        throw new GitHubError("Gist Markdown is too large to render", 413);
    }

    return content;
}

async function fetchGitHubUser(username: string): Promise<Owner> {
    const data = await githubFetch<unknown>(
        `/users/${encodeURIComponent(validateGitHubUsername(username))}`
    );
    if (!isRecord(data)) throw new GitHubError("Invalid GitHub response", 502);

    return {
        login: String(data.login ?? username),
        avatar_url: String(data.avatar_url ?? ""),
        html_url: String(data.html_url ?? ""),
    };
}

async function fetchGist(gistId: string): Promise<GitHubGist> {
    return githubFetch<GitHubGist>(
        `/gists/${encodeURIComponent(validateGistId(gistId))}`
    );
}

export async function fetchBlogPage(
    username: string,
    requestedPage = 1
): Promise<BlogPage> {
    const safeUsername = validateGitHubUsername(username);
    const page = validatePage(requestedPage);
    const gists = await githubFetch<GitHubGist[]>(
        `/users/${encodeURIComponent(safeUsername)}/gists?per_page=100&page=1`
    );

    const postGists = gists
        .filter((gist) => findPostFile(gist.files) !== undefined)
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    const pageCount = Math.max(1, Math.ceil(postGists.length / BLOG_POSTS_PER_PAGE));

    if (page > pageCount) {
        throw new GitHubError("Blog page not found", 404);
    }

    const selectedGists = postGists.slice(
        (page - 1) * BLOG_POSTS_PER_PAGE,
        page * BLOG_POSTS_PER_PAGE
    );

    const [owner, posts] = await Promise.all([
        gists[0]?.owner ?? fetchGitHubUser(safeUsername),
        Promise.all(
            selectedGists.map(async (summary): Promise<BlogPost> => {
                const gist = await fetchGist(summary.id);
                const file = findPostFile(gist.files);
                if (!file) throw new GitHubError("Gist post not found", 404);

                const markdown = await getMarkdownContent(file);
                const { metadata } = parsePostMarkdown(markdown);
                const filenameTitle = file.filename
                    .replace(/_post\.md$/i, "")
                    .replace(/[_-]+/g, " ")
                    .trim();

                return {
                    id: gist.id,
                    title: metadata.title ?? filenameTitle ?? "Untitled post",
                    description: metadata.description ?? gist.description ?? "",
                    createdAt: gist.created_at,
                    updatedAt: gist.updated_at,
                    metadata,
                };
            })
        ),
    ]);

    if (!owner) throw new GitHubError("GitHub user not found", 404);

    return { owner, posts, page, pageCount, totalPosts: postGists.length };
}

export async function fetchGistById(gistId: string): Promise<GistPost> {
    const gist = await fetchGist(gistId);
    const markdownFile = findPostFile(gist.files, false);

    if (!markdownFile) {
        throw new GitHubError("No Markdown file found in this gist", 404);
    }
    if (!gist.owner) {
        throw new GitHubError("Gist owner not found", 404);
    }

    const markdown = await getMarkdownContent(markdownFile);
    const { content, metadata } = parsePostMarkdown(markdown);
    const filenameTitle = markdownFile.filename
        .replace(/_post\.md$/i, "")
        .replace(/\.md$/i, "")
        .replace(/[_-]+/g, " ")
        .trim();

    return {
        gistUrl: gist.html_url,
        markdownContent: content,
        metadata,
        title: metadata.title || filenameTitle || "Untitled post",
        description: metadata.description || gist.description || "",
        owner: gist.owner,
        createdAt: gist.created_at,
        updatedAt: gist.updated_at,
    };
}
