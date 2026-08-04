"use client";

import { useEffect } from "react";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="state-page">
            <p className="state-code">UPSTREAM ERROR</p>
            <h1>Unable to load this page</h1>
            <p>GitHub may be unavailable or temporarily rate limited.</p>
            <button className="action-button" type="button" onClick={reset}>
                Try again
            </button>
        </main>
    );
}
