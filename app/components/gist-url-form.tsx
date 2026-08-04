"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { extractGistId } from "../../lib/gist-url";

export function GistUrlForm() {
    const router = useRouter();
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const gistId = extractGistId(value);
        if (!gistId) {
            setError("Paste a valid gist.github.com URL or gist ID.");
            return;
        }
        setError("");
        router.push(`/post/${gistId}`);
    }

    return (
        <form className="gist-form" onSubmit={handleSubmit} noValidate>
            <label className="sr-only" htmlFor="gist-url">
                GitHub Gist URL
            </label>
            <div className="gist-input-shell">
                <span className="input-prompt" aria-hidden="true">
                    &gt;
                </span>
                <input
                    id="gist-url"
                    name="gist-url"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    spellCheck={false}
                    placeholder="https://gist.github.com/username/gist-id"
                    value={value}
                    onChange={(event) => {
                        setValue(event.target.value);
                        if (error) setError("");
                    }}
                    aria-describedby={error ? "gist-url-error" : "gist-url-hint"}
                    aria-invalid={Boolean(error)}
                />
                <button type="submit">
                    Open post
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                        <path
                            d="M3.75 9h10.5m-4-4.25L14.5 9l-4.25 4.25"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="square"
                        />
                    </svg>
                </button>
            </div>
            <div className="form-meta">
                <p id={error ? "gist-url-error" : "gist-url-hint"} role={error ? "alert" : undefined}>
                    {error || "No account required. Your gist stays on GitHub."}
                </p>
                <a href="/post/62538a714d95ae8b2aafdb5c6751f2c5">
                    View an example
                </a>
            </div>
        </form>
    );
}
