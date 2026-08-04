import { fetchGistById, GitHubError } from "../../../../lib/github";

export const revalidate = 300;

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ gistId: string }> }
) {
    const { gistId } = await params;
    try {
        const post = await fetchGistById(gistId);
        if (post.metadata.draft) return new Response("Not found", { status: 404 });
        const filename = post.filename.replace(/[^A-Za-z0-9._-]/g, "_");
        return new Response(post.sourceMarkdown, {
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
            },
        });
    } catch (error) {
        const status = error instanceof GitHubError ? error.status : 500;
        return new Response("Unable to load Markdown", { status });
    }
}
