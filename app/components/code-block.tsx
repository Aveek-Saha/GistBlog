"use client";

import { ReactNode, useRef, useState } from "react";

export function CodeBlock({ children }: { children: ReactNode }) {
    const container = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [copyFailed, setCopyFailed] = useState(false);

    async function copyCode() {
        const code = container.current?.querySelector("code")?.textContent ?? "";
        try {
            await navigator.clipboard.writeText(code.replace(/\n$/, ""));
            setCopyFailed(false);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
        } catch {
            setCopyFailed(true);
        }
    }

    return (
        <div className="code-block" ref={container}>
            <button type="button" onClick={copyCode} aria-label="Copy code block" aria-live="polite">
                {copyFailed ? "Copy failed" : copied ? "Copied" : "Copy"}
            </button>
            <pre>{children}</pre>
        </div>
    );
}
