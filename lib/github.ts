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
export async function fetchGists(
    username: string,
    page: number = 1
): Promise<Gist[]> {
    const response = await fetch(
        `${GITHUB_API_URL}/users/${username}/gists?page=${page}`
    );
    const data: Gist[] = await response.json();

    return data.filter(
        (gist) =>
            // gist.id.startsWith("gistblog") &&
            Object.values(gist.files).some((file) =>
                file.filename.endsWith(".md")
            )
    );
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
    const markdownContent = await rawResponse.text();
    console.log(markdownContent);

    return markdownContent;
}
