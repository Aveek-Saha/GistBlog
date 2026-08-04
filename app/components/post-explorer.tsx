"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface ExplorerPost {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    tags: string[];
}

export function PostExplorer({ posts }: { posts: ExplorerPost[] }) {
    const [query, setQuery] = useState("");
    const [tag, setTag] = useState("");
    const tags = useMemo(
        () => Array.from(new Set(posts.flatMap((post) => post.tags))).sort(),
        [posts]
    );
    const filtered = posts.filter((post) => {
        const matchesQuery = `${post.title} ${post.description}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return matchesQuery && (!tag || post.tags.includes(tag));
    });

    return (
        <>
            {posts.length > 1 || tags.length > 0 ? (
                <div className="post-filters">
                    <label>
                        <span className="sr-only">Filter posts on this page</span>
                        <input
                            type="search"
                            placeholder="Filter posts on this page"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </label>
                    {tags.length > 0 ? (
                        <div className="tag-filters" aria-label="Filter by tag">
                            <button
                                type="button"
                                aria-pressed={!tag}
                                onClick={() => setTag("")}
                            >
                                All
                            </button>
                            {tags.map((item) => (
                                <button
                                    type="button"
                                    key={item}
                                    aria-pressed={tag === item}
                                    onClick={() => setTag(item)}
                                >
                                    #{item}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {filtered.length > 0 ? (
                <ul className="post-list">
                    {filtered.map((post) => (
                        <li key={post.id}>
                            <Link href={`/post/${post.id}`}>
                                <div className="post-content">
                                    <h3>{post.title}</h3>
                                    {post.description ? (
                                        <p className="post-description">{post.description}</p>
                                    ) : null}
                                    {post.tags.length > 0 ? (
                                        <div className="post-tags">
                                            {post.tags.map((postTag) => (
                                                <span key={postTag}>#{postTag}</span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                                <time className="post-date" dateTime={post.createdAt}>
                                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </time>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="empty-state compact-empty-state">
                    <strong>No matching posts.</strong>
                    <p>Try a different search or tag.</p>
                </div>
            )}
        </>
    );
}
