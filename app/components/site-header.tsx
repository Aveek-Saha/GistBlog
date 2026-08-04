import Link from "next/link";

import { ThemeToggle } from "./theme-toggle";

export function Logo() {
    return (
        <span className="logo" aria-label="GistBlog">
            <span className="logo-mark" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
            </span>
            <span>GistBlog</span>
        </span>
    );
}

export function SiteHeader() {
    return (
        <header className="site-header">
            <Link href="/" className="logo-link">
                <Logo />
            </Link>
            <nav className="site-nav" aria-label="Main navigation">
                <Link href="/#how-it-works">How it works</Link>
                <a
                    href="https://github.com/Aveek-Saha/GistBlog"
                    target="_blank"
                    rel="noreferrer"
                >
                    GitHub
                </a>
                <ThemeToggle />
            </nav>
        </header>
    );
}

export function SiteFooter() {
    return (
        <footer className="site-footer">
            <div>
                <Logo />
                <p>Markdown in. A readable home for your ideas out.</p>
            </div>
            <div className="footer-links">
                <a href="https://gist.github.com">Create a gist</a>
                <a href="https://github.com/Aveek-Saha/GistBlog">Source code</a>
            </div>
        </footer>
    );
}
