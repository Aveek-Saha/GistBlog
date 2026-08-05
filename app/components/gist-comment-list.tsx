"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { GistComment } from "../../lib/github";

function commentDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function GistCommentList({
    comments,
    totalComments,
}: {
    comments: GistComment[];
    totalComments: number;
}) {
    if (comments.length === 0) {
        return (
            <div className="comments-empty">
                <strong>No comments are currently available.</strong>
                <p>Open the source gist to view the complete discussion.</p>
            </div>
        );
    }

    return (
        <>
            <ol className="comment-list">
                {comments.map((comment) => {
                    const wasEdited = comment.updatedAt !== comment.createdAt;
                    return (
                        <li key={comment.id}>
                            <article className="gist-comment">
                                <header className="comment-header">
                                    <div className="comment-author">
                                        {comment.author?.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={comment.author.avatar_url}
                                                alt=""
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <span className="comment-avatar" aria-hidden="true">
                                                ?
                                            </span>
                                        )}
                                        {comment.author ? (
                                            <a
                                                href={comment.author.html_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {comment.author.login}
                                            </a>
                                        ) : (
                                            <span>Deleted user</span>
                                        )}
                                        {comment.authorAssociation === "OWNER" ? (
                                            <span className="comment-badge">Author</span>
                                        ) : null}
                                    </div>
                                    <span>
                                        <time dateTime={comment.createdAt}>
                                            {commentDate(comment.createdAt)}
                                        </time>
                                        {wasEdited ? " · edited" : ""}
                                    </span>
                                </header>
                                <div className="comment-body">
                                    <ReactMarkdown
                                        skipHtml
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ children, ...props }) => (
                                                <a
                                                    {...props}
                                                    target="_blank"
                                                    rel="nofollow noopener noreferrer"
                                                >
                                                    {children}
                                                </a>
                                            ),
                                            img: () => null,
                                        }}
                                    >
                                        {comment.body}
                                    </ReactMarkdown>
                                </div>
                            </article>
                        </li>
                    );
                })}
            </ol>

            {comments.length < totalComments ? (
                <p className="comments-note">
                    Showing {comments.length.toLocaleString("en-US")} of{" "}
                    {totalComments.toLocaleString("en-US")} comments. The complete
                    discussion is available on GitHub.
                </p>
            ) : null}
        </>
    );
}
