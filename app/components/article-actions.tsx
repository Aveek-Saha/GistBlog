"use client";

import { useEffect, useState } from "react";

export function ArticleActions({ title }: { title: string }) {
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const [copyFailed, setCopyFailed] = useState(false);

    useEffect(() => {
        function updateProgress() {
            const article = document.querySelector<HTMLElement>(".prose");
            if (!article) return;
            const rect = article.getBoundingClientRect();
            const start = window.scrollY + rect.top - window.innerHeight * 0.25;
            const end = start + article.offsetHeight - window.innerHeight * 0.5;
            const distance = Math.max(1, end - start);
            setProgress(Math.min(100, Math.max(0, ((window.scrollY - start) / distance) * 100)));
        }
        updateProgress();
        window.addEventListener("scroll", updateProgress, { passive: true });
        window.addEventListener("resize", updateProgress);
        return () => {
            window.removeEventListener("scroll", updateProgress);
            window.removeEventListener("resize", updateProgress);
        };
    }, []);

    async function share() {
        if (navigator.share) {
            try {
                await navigator.share({ title, url: window.location.href });
            } catch {
                // Closing the native share sheet is an expected user action.
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopyFailed(false);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
        } catch {
            setCopyFailed(true);
        }
    }

    return (
        <>
            <div className="reading-progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
            </div>
            <button className="text-button" type="button" onClick={share} aria-describedby="share-status">
                {copied ? "Link copied" : "Share article"}
            </button>
            <span id="share-status" className="sr-only" role="status" aria-live="polite">
                {copyFailed ? "Unable to copy the article link." : copied ? "Article link copied." : ""}
            </span>
        </>
    );
}
