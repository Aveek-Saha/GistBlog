import { ImageResponse } from "next/og";

import { fetchGitHubUser } from "../../lib/github";

export const alt = "A GistBlog author page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function AuthorOpenGraphImage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;
    const owner = await fetchGitHubUser(username);
    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "72px",
                background: "#fcfbfb",
                color: "#211e1e",
                border: "1px solid #d8d3d1",
                fontFamily: "sans-serif",
            }}
        >
            <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700 }}>GistBlog</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ color: "#817b79", fontFamily: "monospace", fontSize: 22 }}>PUBLIC GIST BLOG</div>
                <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-4px" }}>
                    {owner.name || owner.login}
                </div>
                <div style={{ fontSize: 24, color: "#646262" }}>@{owner.login}</div>
            </div>
        </div>,
        size
    );
}
