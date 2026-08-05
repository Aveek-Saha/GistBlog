import {
    fetchGistComments,
    GitHubError,
    validateGistId,
} from "../../../../../lib/github";

export const revalidate = 300;

function expectedCount(request: Request): number | undefined {
    const value = new URL(request.url).searchParams.get("count");
    if (!value || !/^\d{1,6}$/.test(value)) return undefined;
    const count = Number(value);
    return Number.isSafeInteger(count) && count <= 100_000 ? count : undefined;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ gistId: string }> }
) {
    const { gistId } = await params;
    const count = expectedCount(request);

    try {
        validateGistId(gistId);
    } catch {
        return Response.json(
            { error: "Invalid gist ID" },
            { status: 400, headers: { "Cache-Control": "no-store" } }
        );
    }

    if (count === 0) {
        return Response.json(
            { comments: [] },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
                },
            }
        );
    }

    try {
        const comments = await fetchGistComments(gistId, count);
        return Response.json(
            { comments },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
                },
            }
        );
    } catch (error) {
        const status = error instanceof GitHubError ? error.status : 500;
        return Response.json(
            { error: "Unable to load comments" },
            { status, headers: { "Cache-Control": "no-store" } }
        );
    }
}
