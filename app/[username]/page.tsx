import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchBlogPage, GitHubError } from "../../lib/github";

export const revalidate = 300;

interface UserPostsPageProps {
    params: Promise<{ username: string }>;
    searchParams: Promise<{ page?: string | string[] }>;
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
                        <h1>{owner.login}</h1>
                        <p>
                            {totalPosts} published {totalPosts === 1 ? "post" : "posts"}
                        </p>
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
                    <ul className="post-list">
                        {posts.map((post) => (
                            <li key={post.id}>
                                <Link href={`/post/${post.id}`}>
                                    <div className="post-content">
                                        <h3>{post.title}</h3>
                                        {post.description ? (
                                            <p className="post-description">
                                                {post.description}
                                            </p>
                                        ) : null}
                                    </div>
                                    <time className="post-date" dateTime={post.createdAt}>
                                        {new Date(post.createdAt).toLocaleDateString(
                                            "en-US",
                                            {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            }
                                        )}
                                    </time>
                                </Link>
                            </li>
                        ))}
                    </ul>
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
