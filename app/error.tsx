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
        <main>
            <h1>Unable to load this page</h1>
            <p>GitHub may be unavailable or temporarily rate limited.</p>
            <button type="button" onClick={reset}>
                Try again
            </button>
        </main>
    );
}
