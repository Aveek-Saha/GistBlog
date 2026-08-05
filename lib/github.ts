const GITHUB_API_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_REVALIDATE_SECONDS = 300;
const GITHUB_REQUEST_TIMEOUT_MS = 8_000;
const MAX_MARKDOWN_BYTES = 512_000;
const MAX_COMMENT_CHARACTERS = 32_000;
const GISTS_PER_GITHUB_PAGE = 100;
const MAX_GITHUB_PAGES = 10;
const COMMENTS_PER_GITHUB_PAGE = 100;
const MAX_GITHUB_COMMENT_PAGES = 3;

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
    comments?: number;
    history?: Array<{ version: string }>;
}

export interface PostMetadata {
    date?: string;
    title?: string;
    description?: string;
    tags?: string[];
    canonical?: string;
    image?: string;
    draft?: boolean;
}

export interface Owner {
    login: string;
    avatar_url: string;
    html_url: string;
    name?: string;
    bio?: string;
    blog?: string;
    location?: string;
}

export interface BlogPost {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    metadata: PostMetadata;
    filename: string;
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
    sourceMarkdown: string;
    filename: string;
    comments: number;
    revisions: number;
}

export interface PostNavigationItem {
    id: string;
    title: string;
}

export interface PostNavigation {
    previous?: PostNavigationItem;
    next?: PostNavigationItem;
}

export interface GistComment {
    id: number;
    body: string;
    createdAt: string;
    updatedAt: string;
    author: Owner | null;
    authorAssociation?: string;
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
            cache: "force-cache",
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

export function normalizeHttpUrl(value: string): string | undefined {
    try {
        const url = new URL(value.trim());
        if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
        return url.toString().slice(0, 500);
    } catch {
        return undefined;
    }
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
        if (key === "canonical" && value) {
            metadata.canonical = normalizeHttpUrl(value);
        }
        if ((key === "image" || key === "cover") && value) {
            metadata.image = normalizeHttpUrl(value);
        }
        if (key === "draft" && value) {
            metadata.draft = ["true", "yes", "1"].includes(value.toLowerCase());
        }
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

function postTitleFromFilename(filename: string): string {
    return filename
        .replace(/_post\.md$/i, "")
        .replace(/\.md$/i, "")
        .replace(/[_-]+/g, " ")
        .trim();
}

function publishedDate(metadata: PostMetadata, fallback: string): string {
    if (!metadata.date) return fallback;
    const value = new Date(metadata.date);
    return Number.isNaN(value.getTime()) ? fallback : value.toISOString();
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
                cache: "force-cache",
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

export async function fetchGitHubUser(username: string): Promise<Owner> {
    const data = await githubFetch<unknown>(
        `/users/${encodeURIComponent(validateGitHubUsername(username))}`
    );
    if (!isRecord(data)) throw new GitHubError("Invalid GitHub response", 502);

    return {
        login: String(data.login ?? username),
        avatar_url: String(data.avatar_url ?? ""),
        html_url: String(data.html_url ?? ""),
        name: typeof data.name === "string" ? data.name.slice(0, 200) : undefined,
        bio: typeof data.bio === "string" ? data.bio.slice(0, 500) : undefined,
        blog:
            typeof data.blog === "string" && data.blog
                ? normalizeHttpUrl(
                      data.blog.startsWith("http") ? data.blog : `https://${data.blog}`
                  )
                : undefined,
        location:
            typeof data.location === "string" ? data.location.slice(0, 200) : undefined,
    };
}

async function fetchGist(gistId: string): Promise<GitHubGist> {
    return githubFetch<GitHubGist>(
        `/gists/${encodeURIComponent(validateGistId(gistId))}`
    );
}

function parseCommentAuthor(value: unknown): Owner | null {
    if (!isRecord(value)) return null;
    if (
        typeof value.login !== "string" ||
        typeof value.avatar_url !== "string" ||
        typeof value.html_url !== "string"
    ) {
        return null;
    }

    return {
        login: value.login.slice(0, 100),
        avatar_url: value.avatar_url.slice(0, 500),
        html_url: value.html_url.slice(0, 500),
    };
}

function parseGistComment(value: unknown): GistComment | null {
    if (!isRecord(value)) return null;
    if (
        typeof value.id !== "number" ||
        !Number.isSafeInteger(value.id) ||
        typeof value.body !== "string" ||
        typeof value.created_at !== "string" ||
        typeof value.updated_at !== "string"
    ) {
        return null;
    }

    return {
        id: value.id,
        body: value.body.slice(0, MAX_COMMENT_CHARACTERS),
        createdAt: value.created_at.slice(0, 50),
        updatedAt: value.updated_at.slice(0, 50),
        author: parseCommentAuthor(value.user),
        authorAssociation:
            typeof value.author_association === "string"
                ? value.author_association.slice(0, 30)
                : undefined,
    };
}

export async function fetchGistComments(
    gistId: string,
    expectedCount?: number
): Promise<GistComment[]> {
    const safeGistId = validateGistId(gistId);
    const comments: GistComment[] = [];
    const knownCount =
        typeof expectedCount === "number" && Number.isSafeInteger(expectedCount)
            ? Math.max(0, expectedCount)
            : undefined;
    const totalPages = knownCount
        ? Math.max(1, Math.ceil(knownCount / COMMENTS_PER_GITHUB_PAGE))
        : MAX_GITHUB_COMMENT_PAGES;
    const firstPage = Math.max(1, totalPages - MAX_GITHUB_COMMENT_PAGES + 1);

    for (let page = firstPage; page <= totalPages; page += 1) {
        const data = await githubFetch<unknown>(
            `/gists/${encodeURIComponent(safeGistId)}/comments?per_page=${COMMENTS_PER_GITHUB_PAGE}&page=${page}`
        );
        if (!Array.isArray(data)) {
            throw new GitHubError("Invalid GitHub comments response", 502);
        }

        comments.push(
            ...data
                .map(parseGistComment)
                .filter((comment): comment is GistComment => comment !== null)
        );
        if (knownCount === undefined && data.length < COMMENTS_PER_GITHUB_PAGE) break;
    }

    return comments;
}

async function fetchAllUserGists(username: string): Promise<GitHubGist[]> {
    const safeUsername = validateGitHubUsername(username);
    const allGists: GitHubGist[] = [];

    for (let page = 1; page <= MAX_GITHUB_PAGES; page += 1) {
        const gists = await githubFetch<GitHubGist[]>(
            `/users/${encodeURIComponent(safeUsername)}/gists?per_page=${GISTS_PER_GITHUB_PAGE}&page=${page}`
        );
        allGists.push(...gists);
        if (gists.length < GISTS_PER_GITHUB_PAGE) break;
    }

    return allGists;
}

function sortedPostGists(gists: GitHubGist[]): GitHubGist[] {
    return gists
        .filter((gist) => findPostFile(gist.files) !== undefined)
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
}

async function gistToBlogPost(gistOrSummary: GitHubGist): Promise<BlogPost | null> {
    const gist = await fetchGist(gistOrSummary.id);
    const file = findPostFile(gist.files);
    if (!file) return null;

    const markdown = await getMarkdownContent(file);
    const { metadata } = parsePostMarkdown(markdown);
    if (metadata.draft) return null;

    return {
        id: gist.id,
        title: metadata.title || postTitleFromFilename(file.filename) || "Untitled post",
        description: metadata.description || gist.description || "",
        createdAt: publishedDate(metadata, gist.created_at),
        updatedAt: gist.updated_at,
        metadata,
        filename: file.filename,
    };
}

export async function fetchBlogPage(
    username: string,
    requestedPage = 1
): Promise<BlogPage> {
    const safeUsername = validateGitHubUsername(username);
    const page = validatePage(requestedPage);
    const [gists, owner] = await Promise.all([
        fetchAllUserGists(safeUsername),
        fetchGitHubUser(safeUsername),
    ]);
    const postGists = sortedPostGists(gists);
    const pageCount = Math.max(1, Math.ceil(postGists.length / BLOG_POSTS_PER_PAGE));

    if (page > pageCount) {
        throw new GitHubError("Blog page not found", 404);
    }

    const selectedGists = postGists.slice(
        (page - 1) * BLOG_POSTS_PER_PAGE,
        page * BLOG_POSTS_PER_PAGE
    );

    const posts = (
        await Promise.all(selectedGists.map((summary) => gistToBlogPost(summary)))
    ).filter((post): post is BlogPost => post !== null);

    return {
        owner,
        posts,
        page,
        pageCount,
        totalPosts: Math.max(0, postGists.length - (selectedGists.length - posts.length)),
    };
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

    return {
        gistUrl: gist.html_url,
        markdownContent: content,
        metadata,
        title: metadata.title || postTitleFromFilename(markdownFile.filename) || "Untitled post",
        description: metadata.description || gist.description || "",
        owner: gist.owner,
        createdAt: publishedDate(metadata, gist.created_at),
        updatedAt: gist.updated_at,
        sourceMarkdown: markdown,
        filename: markdownFile.filename,
        comments: gist.comments ?? 0,
        revisions: gist.history?.length ?? 1,
    };
}

export async function fetchRecentBlogPosts(
    username: string,
    limit = 20
): Promise<{ owner: Owner; posts: BlogPost[] }> {
    const safeUsername = validateGitHubUsername(username);
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);
    const [owner, gists] = await Promise.all([
        fetchGitHubUser(safeUsername),
        fetchAllUserGists(safeUsername),
    ]);
    const candidates = sortedPostGists(gists).slice(0, safeLimit + 10);
    const posts: BlogPost[] = [];

    for (let index = 0; index < candidates.length && posts.length < safeLimit; index += 5) {
        const batch = await Promise.all(
            candidates.slice(index, index + 5).map((gist) => gistToBlogPost(gist))
        );
        posts.push(...batch.filter((post): post is BlogPost => post !== null));
    }

    return { owner, posts: posts.slice(0, safeLimit) };
}

export async function fetchPostNavigation(
    username: string,
    gistId: string
): Promise<PostNavigation> {
    const safeGistId = validateGistId(gistId);
    const gists = sortedPostGists(await fetchAllUserGists(username));
    const index = gists.findIndex((gist) => gist.id.toLowerCase() === safeGistId);
    if (index === -1) return {};

    async function nearestPublished(
        candidates: GitHubGist[]
    ): Promise<PostNavigationItem | undefined> {
        for (const gist of candidates) {
            const post = await gistToBlogPost(gist);
            if (post) return { id: post.id, title: post.title };
        }
        return undefined;
    }

    const [previous, next] = await Promise.all([
        nearestPublished(gists.slice(index + 1)),
        nearestPublished(gists.slice(0, index).reverse()),
    ]);

    return { previous, next };
}
