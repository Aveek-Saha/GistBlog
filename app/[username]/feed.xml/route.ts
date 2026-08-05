import { createRssFeed } from "../../../lib/feed";
import { fetchRecentBlogPosts, GitHubError } from "../../../lib/github";

export const revalidate = 900;

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    try {
        const { owner, posts } = await fetchRecentBlogPosts(username, 20);
        return new Response(createRssFeed(owner, posts), {
            headers: {
                "Content-Type": "application/rss+xml; charset=utf-8",
                "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400",
            },
        });
    } catch (error) {
        const status = error instanceof GitHubError ? error.status : 500;
        return new Response("Unable to generate feed", { status });
    }
}
