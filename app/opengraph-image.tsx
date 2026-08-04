import { ImageResponse } from "next/og";

export const alt = "GistBlog — Your GitHub Gists, beautifully readable";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
                fontFamily: "monospace",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 28 }}>
                <div style={{ display: "flex", width: 36, height: 36, background: "#211e1e" }} />
                <strong>GistBlog</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", fontSize: 68, fontWeight: 700, letterSpacing: "-4px", lineHeight: 1.05 }}>
                    <span>Your GitHub Gists,</span>
                    <span>beautifully readable.</span>
                </div>
                <div style={{ fontSize: 24, color: "#646262" }}>
                    Markdown in. A readable home for your ideas out.
                </div>
            </div>
        </div>,
        size
    );
}
