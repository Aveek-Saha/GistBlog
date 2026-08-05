"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { extractGistId, extractGitHubUsername } from "../../lib/gist-url";

export function GistUrlForm() {
    const router = useRouter();
    const [mode, setMode] = useState<"post" | "blog">("post");
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const target =
            mode === "post" ? extractGistId(value) : extractGitHubUsername(value);
        if (!target) {
            setError(
                mode === "post"
                    ? "Paste a valid gist.github.com URL or gist ID."
                    : "Enter a valid GitHub username or profile URL."
            );
            return;
        }
        setError("");
        router.push(mode === "post" ? `/post/${target}` : `/${target}`);
    }

    function changeMode(nextMode: "post" | "blog") {
        setMode(nextMode);
        setValue("");
        setError("");
    }

    return (
        <div className="publisher-entry">
            <div className="entry-tabs" role="tablist" aria-label="Choose what to open">
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "post"}
                    onClick={() => changeMode("post")}
                >
                    Gist post
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "blog"}
                    onClick={() => changeMode("blog")}
                >
                    Author blog
                </button>
            </div>
            <form className="gist-form" onSubmit={handleSubmit} noValidate>
                <label className="sr-only" htmlFor="publisher-url">
                    {mode === "post" ? "GitHub Gist URL" : "GitHub username"}
                </label>
                <div className="gist-input-shell">
                    <span className="input-prompt" aria-hidden="true">
                        &gt;
                    </span>
                    <input
                        id="publisher-url"
                        name="publisher-url"
                        type="text"
                        inputMode={mode === "post" ? "url" : "text"}
                        autoComplete={mode === "post" ? "url" : "username"}
                        spellCheck={false}
                        placeholder={
                            mode === "post"
                                ? "https://gist.github.com/username/gist-id"
                                : "GitHub username or profile URL"
                        }
                        value={value}
                        onChange={(event) => {
                            setValue(event.target.value);
                            if (error) setError("");
                        }}
                        aria-describedby={error ? "publisher-error" : "publisher-hint"}
                        aria-invalid={Boolean(error)}
                    />
                    <button type="submit">
                        {mode === "post" ? "Open post" : "Open blog"}
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
                    <p
                        id={error ? "publisher-error" : "publisher-hint"}
                        role={error ? "alert" : undefined}
                    >
                        {error || "No account required. Your content stays on GitHub."}
                    </p>
                    <a href="/post/62538a714d95ae8b2aafdb5c6751f2c5">
                        View an example
                    </a>
                </div>
            </form>
        </div>
    );
}
