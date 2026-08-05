"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

import type { GistComment } from "../../lib/github";

const LazyCommentList = lazy(() =>
    import("./gist-comment-list").then((module) => ({ default: module.GistCommentList }))
);

interface GistCommentsProps {
    gistId: string;
    gistUrl: string;
    totalComments: number;
}

type LoadState = "idle" | "loading" | "loaded" | "error";

export function GistComments({ gistId, gistUrl, totalComments }: GistCommentsProps) {
    const section = useRef<HTMLElement>(null);
    const [state, setState] = useState<LoadState>(
        totalComments === 0 ? "loaded" : "idle"
    );
    const [comments, setComments] = useState<GistComment[]>([]);
    const commentUrl = `${gistUrl}#new_comment_field`;

    useEffect(() => {
        if (totalComments === 0) return;

        const controller = new AbortController();
        let requested = false;

        async function loadComments() {
            if (requested) return;
            requested = true;
            setState("loading");

            try {
                const response = await fetch(
                    `/api/gists/${encodeURIComponent(gistId)}/comments?count=${totalComments}`,
                    {
                        headers: { Accept: "application/json" },
                        signal: controller.signal,
                    }
                );
                if (!response.ok) throw new Error("Unable to load comments");
                const payload = (await response.json()) as { comments?: unknown };
                if (!Array.isArray(payload.comments)) {
                    throw new Error("Invalid comments response");
                }
                setComments(payload.comments as GistComment[]);
                setState("loaded");
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") return;
                setState("error");
            }
        }

        const target = section.current;
        if (!target || !("IntersectionObserver" in window)) {
            void loadComments();
            return () => controller.abort();
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    observer.disconnect();
                    void loadComments();
                }
            },
            { rootMargin: "400px 0px" }
        );
        observer.observe(target);

        return () => {
            observer.disconnect();
            controller.abort();
        };
    }, [gistId, totalComments]);

    return (
        <section
            className="comments-section"
            aria-labelledby="comments-heading"
            ref={section}
        >
            <div className="comments-layout">
                <div className="comments-kicker" aria-hidden="true">
                    <span>DISCUSSION</span>
                    <strong>{totalComments.toLocaleString("en-US")}</strong>
                </div>
                <div className="comments-content">
                    <header className="comments-header">
                        <div>
                            <p className="eyebrow">GITHUB COMMENTS</p>
                            <h2 id="comments-heading">
                                {totalComments === 0
                                    ? "Join the discussion."
                                    : `${totalComments.toLocaleString("en-US")} ${
                                          totalComments === 1 ? "comment" : "comments"
                                      }`}
                            </h2>
                        </div>
                        <a
                            className="action-button"
                            href={commentUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Add a comment on GitHub ↗
                        </a>
                    </header>

                    {state === "idle" || state === "loading" ? (
                        <div className="comments-loading" role="status" aria-live="polite">
                            <span />
                            <span />
                            <span />
                            <strong>Loading comments…</strong>
                        </div>
                    ) : state === "error" ? (
                        <div className="comments-empty">
                            <strong>Comments are temporarily unavailable.</strong>
                            <p>You can still read or add them on the source gist.</p>
                        </div>
                    ) : totalComments === 0 ? (
                        <div className="comments-empty">
                            <strong>No comments yet.</strong>
                            <p>Start the conversation on GitHub.</p>
                        </div>
                    ) : (
                        <Suspense
                            fallback={
                                <div className="comments-loading" role="status">
                                    <strong>Rendering comments…</strong>
                                </div>
                            }
                        >
                            <LazyCommentList
                                comments={comments}
                                totalComments={totalComments}
                            />
                        </Suspense>
                    )}
                </div>
            </div>
        </section>
    );
}
