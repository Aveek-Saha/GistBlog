const GITHUB_API_URL = "https://api.github.com";

interface GistFile {
    filename: string;
    type: string;
    raw_url: string;
    language: string;
}

interface Gist {
    id: string;
    files: Record<string, GistFile>;
    description: string;
}

interface Metadata {
    date?: string;
    time?: string;
    heading?: string;
    [key: string]: any;
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
                if (gist.description.trim().startsWith('{') && gist.description.trim().endsWith('}')) {
                    console.log(gist.description);
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

export async function fetchGistById(gistId: string): Promise<string> {
    const response = await fetch(`${GITHUB_API_URL}/gists/${gistId}`);
    const data: Gist = await response.json();

    const markdownFile = Object.values(data.files).find((file) =>
        file.filename.endsWith(".md")
    );
    if (!markdownFile) {
        throw new Error(`No markdown file found in gist: ${gistId}`);
    }

    const rawResponse = await fetch(markdownFile.raw_url);
    
    return rawResponse.text();
}
