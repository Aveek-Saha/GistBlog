const GITHUB_API_URL = "https://api.github.com";

interface GistFile {
    filename: string;
    type: string;
    raw_url: string;
    language: string;
    content: string;
    owner: Owner;
}

interface Gist {
    id: string;
    files: Record<string, GistFile>;
    description: string;
    owner: Owner;
    created_at: string;
}

interface Metadata {
    date?: string;
    title?: string;
    description?: string;
    [key: string]: any;
}

export interface Owner {
    login: string;
    avatar_url: string;
    html_url: string;
}

export async function fetchGists(
    username: string,
    page: number = 1
): Promise<(Gist & { metadata: Metadata | null })[]> {
    const response = await fetch(
        `${GITHUB_API_URL}/users/${username}/gists?page=${page}`
    );
    const data: Gist[] = await response.json();

    // Filter and parse metadata from description
    return data
        .filter((gist) =>
            Object.values(gist.files).some((file) =>
                file.filename.endsWith(".md")
            )
        )
        .map((gist) => {
            let metadata: Metadata | null = null;
            try {
                if (
                    gist.description.trim().startsWith("{") &&
                    gist.description.trim().endsWith("}")
                ) {
                    metadata = JSON.parse(gist.description); // Parse JSON from the description
                }
            } catch (error) {
                console.error(
                    `Failed to parse metadata for gist ${gist.id}:`,
                    error
                );
            }
            return { ...gist, metadata };
        });
}

export async function fetchGistById(
    gistId: string
): Promise<{ markdownContent: string; owner: Owner }> {
    const response = await fetch(`${GITHUB_API_URL}/gists/${gistId}`);
    const data: Gist = await response.json();

    const markdownFile = Object.values(data.files).find((file) =>
        file.filename.endsWith(".md")
    );
    if (!markdownFile) {
        throw new Error(`No markdown file found in gist: ${gistId}`);
    }

    const markdownContent = markdownFile.content;
    var owner: Owner = data.owner;

    return { markdownContent, owner };
}
