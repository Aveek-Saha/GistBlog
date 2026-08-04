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

    const { owner, posts, pageCount } = blog;

    return (
        <main>
            <header className="header">
                <h1 className="user-info">
                    <a href={owner.html_url} className="link">
                        {owner.login}
                    </a>
                    &apos;s Blog
                    {/* GitHub controls this URL; native img avoids configuring every avatar host. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className="profile-picture"
                        src={owner.avatar_url}
                        alt={`${owner.login}'s avatar`}
                    />
                </h1>
            </header>

            <section className="posts" aria-label="Blog posts">
                {posts.length === 0 ? (
                    <p>No published gist posts found.</p>
                ) : (
                    <ul className="post-list">
                        {posts.map((post) => (
                            <li key={post.id}>
                                <Link href={`/post/${post.id}`} className="link">
                                    <div className="post-content">
                                        <h2>{post.title}</h2>
                                        {post.description ? (
                                            <p className="post-description">
                                                {post.description}
                                            </p>
                                        ) : null}
                                    </div>
                                    <time
                                        className="post-date"
                                        dateTime={post.createdAt}
                                    >
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
            </section>

            {pageCount > 1 ? (
                <nav className="pagination" aria-label="Blog pagination">
                    {page > 1 ? (
                        <Link href={`/${owner.login}?page=${page - 1}`}>
                            Previous
                        </Link>
                    ) : (
                        <span />
                    )}
                    <span>
                        Page {page} of {pageCount}
                    </span>
                    {page < pageCount ? (
                        <Link href={`/${owner.login}?page=${page + 1}`}>Next</Link>
                    ) : (
                        <span />
                    )}
                </nav>
            ) : null}
        </main>
    );
}
