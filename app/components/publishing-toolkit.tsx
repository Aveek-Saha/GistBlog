"use client";

import { useMemo, useState } from "react";

function yamlString(value: string): string {
    return value
        .replace(/[\r\n]+/g, " ")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .trim();
}

export function PublishingToolkit({ siteUrl }: { siteUrl: string }) {
    const [title, setTitle] = useState("My article title");
    const [description, setDescription] = useState("A concise description of the post.");
    const [tags, setTags] = useState("javascript, notes");
    const [copied, setCopied] = useState<"frontmatter" | "bookmarklet" | null>(null);
    const [copyFailed, setCopyFailed] = useState(false);

    const frontmatter = useMemo(() => {
        const safeTitle = yamlString(title);
        const safeDescription = yamlString(description);
        const safeTags = tags
            .split(",")
            .map(yamlString)
            .filter(Boolean)
            .slice(0, 10)
            .map((tag) => `"${tag}"`)
            .join(", ");
        return `---\ntitle: "${safeTitle}"\ndescription: "${safeDescription}"\ntags: [${safeTags}]\ndraft: false\n---`;
    }, [description, tags, title]);

    const bookmarklet = `javascript:(()=>{const p=location.pathname.split('/').filter(Boolean);const id=p[p.length-1];if(location.hostname==='gist.github.com'&&/^[a-f0-9]+$/i.test(id)){location.href='${siteUrl}/post/'+id}else{alert('Open a GitHub Gist first')}})()`;

    async function copy(value: string, type: "frontmatter" | "bookmarklet") {
        try {
            await navigator.clipboard.writeText(value);
            setCopyFailed(false);
            setCopied(type);
            window.setTimeout(() => setCopied(null), 1600);
        } catch {
            setCopyFailed(true);
        }
    }

    return (
        <div className="toolkit-grid">
            <div className="generator-fields">
                <label>
                    Title
                    <input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
                </label>
                <label>
                    Description
                    <input
                        value={description}
                        maxLength={500}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                </label>
                <label>
                    Tags, separated by commas
                    <input value={tags} onChange={(event) => setTags(event.target.value)} />
                </label>
            </div>
            <div className="frontmatter-output">
                <div>
                    <span>post_frontmatter.yaml</span>
                    <button type="button" onClick={() => copy(frontmatter, "frontmatter")}>
                        {copied === "frontmatter" ? "Copied" : "Copy"}
                    </button>
                </div>
                <pre>{frontmatter}</pre>
            </div>
            <div className="bookmarklet-card">
                <div>
                    <strong>Publish from any gist</strong>
                    <p>
                        Copy this bookmarklet, create a browser bookmark, and paste it into
                        the bookmark URL field.
                    </p>
                </div>
                <button
                    className="secondary-button"
                    type="button"
                    onClick={() => copy(bookmarklet, "bookmarklet")}
                >
                    {copied === "bookmarklet" ? "Bookmarklet copied" : "Copy bookmarklet"}
                </button>
            </div>
            <p className="copy-status" role="status" aria-live="polite">
                {copyFailed ? "Copy failed. Select the text and copy it manually." : ""}
            </p>
        </div>
    );
}
