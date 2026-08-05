import { ImageResponse } from "next/og";

import { fetchGistById } from "../../../lib/github";

export const alt = "A GistBlog article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PostOpenGraphImage({
    params,
}: {
    params: Promise<{ gistId: string }>;
}) {
    const { gistId } = await params;
    const post = await fetchGistById(gistId);
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
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 22 }}>
                <strong>GistBlog</strong>
                <span style={{ color: "#817b79" }}>@{post.owner.login}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ fontSize: post.title.length > 70 ? 50 : 64, fontWeight: 700, letterSpacing: "-3px", lineHeight: 1.08 }}>
                    {(post.metadata.draft ? "Draft" : post.title).slice(0, 140)}
                </div>
                <div style={{ fontSize: 23, color: "#646262" }}>
                    {(post.metadata.draft ? "" : post.description).slice(0, 180) || "Published from a GitHub Gist"}
                </div>
            </div>
        </div>,
        size
    );
}
