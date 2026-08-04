import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { fetchGistById, GitHubError } from "../../../lib/github";

export const revalidate = 300;

interface PostPageProps {
    params: Promise<{ gistId: string }>;
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

    return (
        <main>
            <header>
                <div className="user-info">
                    <a href={owner.html_url} className="link">
                        {owner.login}
                    </a>
                    <span aria-hidden="true">/</span>
                    <a href={post.gistUrl}>View source gist</a>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className="profile-picture"
                        src={owner.avatar_url}
                        alt={`${owner.login}'s avatar`}
                    />
                </div>

                {metadata.title ? <h1>{metadata.title}</h1> : null}
                {metadata.description ? <p>{metadata.description}</p> : null}
                <time dateTime={post.createdAt}>
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </time>
            </header>

            <article>
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
        </main>
    );
}
