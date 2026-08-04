import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { fetchGistById, GitHubError } from "../../../lib/github";

export const revalidate = 300;

interface PostPageProps {
    params: Promise<{ gistId: string }>;
}

function readingTime(markdown: string): number {
    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
}

export default async function PostPage({ params }: PostPageProps) {
    const { gistId } = await params;

    let post;
    try {
        post = await fetchGistById(gistId);
    } catch (error) {
        if (
            error instanceof GitHubError &&
            (error.status === 400 || error.status === 404)
        ) {
            notFound();
        }
        throw error;
    }

    const { markdownContent, metadata, owner } = post;
    const minutes = readingTime(markdownContent);
    const wasUpdated = post.updatedAt !== post.createdAt;

    return (
        <main className="article-page">
            <header className="article-hero">
                <div className="article-breadcrumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={owner.avatar_url} alt="" />
                    <Link href={`/${owner.login}`}>{owner.login}</Link>
                    <span aria-hidden="true">/</span>
                    <a href={post.gistUrl} target="_blank" rel="noreferrer">
                        source gist ↗
                    </a>
                </div>

                <div className="article-heading">
                    <p className="eyebrow">GIST ARTICLE</p>
                    <h1>{post.title}</h1>
                    {post.description ? (
                        <p className="article-deck">{post.description}</p>
                    ) : null}
                    <div className="article-meta">
                        <time dateTime={post.createdAt}>
                            {new Date(post.createdAt).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </time>
                        <span aria-hidden="true">·</span>
                        <span>{minutes} min read</span>
                        {wasUpdated ? (
                            <>
                                <span aria-hidden="true">·</span>
                                <span>
                                    Updated {new Date(post.updatedAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </>
                        ) : null}
                        {metadata.tags?.map((tag) => (
                            <span className="article-tag" key={tag}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            <div className="article-layout">
                <aside className="article-aside">
                    <span>ORIGINAL SOURCE</span>
                    <a href={post.gistUrl} target="_blank" rel="noreferrer">
                        View on GitHub <span aria-hidden="true">↗</span>
                    </a>
                </aside>

                <article className="prose">
                    <ReactMarkdown
                        skipHtml
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[[rehypeHighlight, { detect: false }]]}
                        components={{
                            a: ({ children, ...props }) => (
                                <a {...props} rel="nofollow noopener noreferrer">
                                    {children}
                                </a>
                            ),
                        }}
                    >
                        {markdownContent}
                    </ReactMarkdown>
                </article>
            </div>

            <footer className="article-footer">
                <div className="article-author">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={owner.avatar_url} alt="" />
                    <div>
                        <strong>{owner.login}</strong>
                        <span>Published from a GitHub Gist</span>
                    </div>
                </div>
                <Link className="action-button" href={`/${owner.login}`}>
                    More from {owner.login}
                </Link>
            </footer>
        </main>
    );
}
