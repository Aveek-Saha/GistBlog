import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { ArticleActions } from "../../components/article-actions";
import { CodeBlock } from "../../components/code-block";
import { GistComments } from "../../components/gist-comments";
import {
    fetchGistById,
    fetchPostNavigation,
    GitHubError,
} from "../../../lib/github";
import {
    extractTableOfContents,
    readingTime,
    stripDuplicateTitle,
} from "../../../lib/markdown";
import { absoluteUrl } from "../../../lib/site";

export const revalidate = 300;

interface PostPageProps {
    params: Promise<{ gistId: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
    const { gistId: rawGistId } = await params;
    const gistId = rawGistId.trim().toLowerCase();
    try {
        const post = await fetchGistById(gistId);
        if (post.metadata.draft) return { title: "Draft", robots: { index: false } };
        const internalUrl = absoluteUrl(`/post/${gistId}`);
        const canonical = post.metadata.canonical || internalUrl;
        return {
            title: post.title,
            description: post.description || `A GistBlog article by ${post.owner.login}.`,
            authors: [{ name: post.owner.name || post.owner.login, url: post.owner.html_url }],
            alternates: { canonical },
            openGraph: {
                type: "article",
                title: post.title,
                description: post.description,
                url: canonical,
                publishedTime: post.createdAt,
                modifiedTime: post.updatedAt,
                authors: [post.owner.html_url],
                tags: post.metadata.tags,
                images: post.metadata.image ? [post.metadata.image] : undefined,
            },
            twitter: {
                card: "summary_large_image",
                title: post.title,
                description: post.description,
                images: post.metadata.image ? [post.metadata.image] : undefined,
            },
        };
    } catch {
        return { title: "Gist article" };
    }
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
    if (post.metadata.draft) notFound();

    const markdownContent = stripDuplicateTitle(post.markdownContent, post.title);
    const tableOfContents = extractTableOfContents(markdownContent);
    const navigation = await fetchPostNavigation(post.owner.login, gistId);
    const minutes = readingTime(markdownContent);
    const wasUpdated = post.updatedAt !== post.createdAt;

    return (
        <main className="article-page">
            <ArticleActions title={post.title} />
            <header className="article-hero">
                <div className="article-breadcrumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.owner.avatar_url} alt="" />
                    <Link href={`/${post.owner.login}`}>{post.owner.login}</Link>
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
                        {post.metadata.tags?.map((tag) => (
                            <span className="article-tag" key={tag}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            <div className="article-layout">
                <aside className="article-aside">
                    <div className="article-source-links">
                        <span>ARTICLE ACTIONS</span>
                        <a href={post.gistUrl} target="_blank" rel="noreferrer">
                            View source ↗
                        </a>
                        <a href={`/post/${gistId}/raw`}>Download Markdown</a>
                        <a href="#comments-heading">
                            {post.comments} {post.comments === 1 ? "comment" : "comments"}
                        </a>
                        <span>{post.revisions} revisions</span>
                    </div>

                    {tableOfContents.length > 0 ? (
                        <nav className="table-of-contents" aria-label="On this page">
                            <span>ON THIS PAGE</span>
                            <ol>
                                {tableOfContents.map((heading) => (
                                    <li data-depth={heading.depth} key={heading.id}>
                                        <a href={`#${heading.id}`}>{heading.label}</a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    ) : null}
                </aside>

                <article className="prose">
                    <ReactMarkdown
                        skipHtml
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[
                            rehypeSlug,
                            [rehypeHighlight, { detect: false }],
                            [rehypeKatex, { strict: "warn" }],
                        ]}
                        components={{
                            a: ({ children, ...props }) => (
                                <a {...props} rel="nofollow noopener noreferrer">
                                    {children}
                                </a>
                            ),
                            pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
                            img: ({ title, ...props }) => (
                                <figure className="article-image">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        {...props}
                                        title={title ?? undefined}
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                    />
                                    {title ? <figcaption>{title}</figcaption> : null}
                                </figure>
                            ),
                        }}
                    >
                        {markdownContent}
                    </ReactMarkdown>
                </article>
            </div>

            <GistComments
                key={gistId}
                gistId={gistId}
                gistUrl={post.gistUrl}
                totalComments={post.comments}
            />

            {navigation.previous || navigation.next ? (
                <nav className="article-navigation" aria-label="More articles">
                    {navigation.previous ? (
                        <Link href={`/post/${navigation.previous.id}`}>
                            <span>← Previous</span>
                            <strong>{navigation.previous.title}</strong>
                        </Link>
                    ) : (
                        <span />
                    )}
                    {navigation.next ? (
                        <Link href={`/post/${navigation.next.id}`}>
                            <span>Next →</span>
                            <strong>{navigation.next.title}</strong>
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            ) : null}

            <footer className="article-footer">
                <div className="article-author">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.owner.avatar_url} alt="" />
                    <div>
                        <strong>{post.owner.name || post.owner.login}</strong>
                        <span>Published from a GitHub Gist</span>
                    </div>
                </div>
                <Link className="action-button" href={`/${post.owner.login}`}>
                    More from {post.owner.login}
                </Link>
            </footer>
        </main>
    );
}
