import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostExplorer } from "../components/post-explorer";
import { fetchBlogPage, fetchGitHubUser, GitHubError } from "../../lib/github";
import { absoluteUrl } from "../../lib/site";

export const revalidate = 300;

interface UserPostsPageProps {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params }: UserPostsPageProps): Promise<Metadata> {
    const { username } = await params;
    try {
        const owner = await fetchGitHubUser(username);
        const title = `${owner.name || owner.login}'s GistBlog`;
        const description = owner.bio || `Technical notes and articles by ${owner.login}.`;
        return {
            title,
            description,
            alternates: {
                canonical: absoluteUrl(`/${owner.login}`),
                types: {
                    "application/rss+xml": absoluteUrl(`/${owner.login}/feed.xml`),
                    "application/atom+xml": absoluteUrl(`/${owner.login}/atom.xml`),
                },
            },
            openGraph: {
                type: "website",
                title,
                description,
                url: absoluteUrl(`/${owner.login}`),
            },
        };
    } catch {
        return { title: "Author blog" };
    }
}

function pageFromSearchParam(value: string | string[] | undefined): number {
    if (value === undefined) return 1;
    if (Array.isArray(value) || !/^\d+$/.test(value)) notFound();

    const page = Number(value);
    if (!Number.isSafeInteger(page) || page < 1) notFound();
    return page;
}

export default async function UserPostsPage({
    params,
    searchParams,
}: UserPostsPageProps) {
    const [{ username }, query] = await Promise.all([params, searchParams]);
    const page = pageFromSearchParam(query.page);

    let blog;
    try {
        blog = await fetchBlogPage(username, page);
    } catch (error) {
        if (
            error instanceof GitHubError &&
            (error.status === 400 || error.status === 404)
        ) {
            notFound();
        }
        throw error;
    }

    const { owner, posts, pageCount, totalPosts } = blog;

    return (
        <main className="blog-page">
            <header className="profile-header">
                <div className="profile-identity">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className="profile-picture"
                        src={owner.avatar_url}
                        alt={`${owner.login}'s avatar`}
                    />
                    <div>
                        <p className="eyebrow">PUBLIC GIST BLOG</p>
                        <h1>{owner.name || owner.login}</h1>
                        <p>
                            @{owner.login} · {totalPosts} published {totalPosts === 1 ? "post" : "posts"}
                        </p>
                        {owner.bio ? <p className="profile-bio">{owner.bio}</p> : null}
                        <div className="profile-details">
                            {owner.location ? <span>{owner.location}</span> : null}
                            {owner.blog ? (
                                <a href={owner.blog} target="_blank" rel="noreferrer">
                                    Website ↗
                                </a>
                            ) : null}
                            <a href={`/${owner.login}/feed.xml`}>RSS</a>
                        </div>
                    </div>
                </div>
                <a
                    href={owner.html_url}
                    className="profile-link"
                    target="_blank"
                    rel="noreferrer"
                >
                    View GitHub
                    <span aria-hidden="true">↗</span>
                </a>
            </header>

            <section className="posts-section" aria-label="Blog posts">
                <div className="posts-section-header">
                    <h2>POSTS</h2>
                    <span>Newest first</span>
                </div>

                {posts.length === 0 ? (
                    <div className="empty-state">
                        <strong>No published posts yet.</strong>
                        <p>Create a Markdown gist ending in `_post.md` to get started.</p>
                    </div>
                ) : (
                    <PostExplorer
                        posts={posts.map((post) => ({
                            id: post.id,
                            title: post.title,
                            description: post.description,
                            createdAt: post.createdAt,
                            tags: post.metadata.tags ?? [],
                        }))}
                    />
                )}

                {pageCount > 1 ? (
                    <nav className="pagination" aria-label="Blog pagination">
                        {page > 1 ? (
                            <Link href={`/${owner.login}?page=${page - 1}`}>← Previous</Link>
                        ) : (
                            <span />
                        )}
                        <span>
                            Page {page} of {pageCount}
                        </span>
                        {page < pageCount ? (
                            <Link href={`/${owner.login}?page=${page + 1}`}>Next →</Link>
                        ) : (
                            <span />
                        )}
                    </nav>
                ) : null}
            </section>
        </main>
    );
}
