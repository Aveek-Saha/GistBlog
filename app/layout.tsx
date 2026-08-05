import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { SiteFooter, SiteHeader } from "./components/site-header";
import { getSiteUrl } from "../lib/site";
import "./globals.css";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});

const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata: Metadata = {
    metadataBase: new URL(getSiteUrl()),
    applicationName: "GistBlog",
    title: {
        default: "GistBlog — Turn GitHub Gists into blog posts",
        template: "%s · GistBlog",
    },
    description: "Turn your GitHub Gists into fast, readable blog posts.",
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        siteName: "GistBlog",
        title: "GistBlog — Turn GitHub Gists into blog posts",
        description: "Turn your GitHub Gists into fast, readable blog posts.",
        url: "/",
    },
    twitter: {
        card: "summary_large_image",
        title: "GistBlog — Turn GitHub Gists into blog posts",
        description: "Turn your GitHub Gists into fast, readable blog posts.",
    },
};

export const viewport: Viewport = {
    colorScheme: "light dark",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fcfbfb" },
        { media: "(prefers-color-scheme: dark)", color: "#130f0f" },
    ],
};

const themeScript = `
try {
  const saved = localStorage.getItem("gistblog-theme");
  const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = saved || preferred;
} catch (_) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <div className="page-shell">
                    <SiteHeader />
                    <div className="page-content">{children}</div>
                    <SiteFooter />
                </div>
            </body>
        </html>
    );
}
