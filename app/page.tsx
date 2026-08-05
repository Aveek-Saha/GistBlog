import Link from "next/link";

import { GistUrlForm } from "./components/gist-url-form";
import { PublishingToolkit } from "./components/publishing-toolkit";
import { getSiteUrl } from "../lib/site";

const features = [
    ["GitHub is the CMS", "Write and revise with the editor and workflow you already use."],
    ["Readable by default", "Responsive typography, syntax highlighting, tables, and task lists."],
    ["Fast and private", "Server-rendered pages with no analytics, advertising, or reader accounts."],
    ["Always connected", "Every article links directly to its original gist and revision history."],
];

export default function Home() {
    const siteUrl = getSiteUrl();

    return (
        <main>
            <section className="hero-section">
                <div className="announcement">
                    <span>Open source</span>
                    <p>Publish from the tools you already use.</p>
                </div>
                <div className="hero-copy">
                    <p className="eyebrow">GISTS, WITHOUT THE CHROME</p>
                    <h1>
                        Your GitHub Gists,
                        <br />
                        beautifully readable.
                    </h1>
                    <p className="hero-description">
                        Turn Markdown gists into clean, shareable articles in seconds. No
                        setup, no new editor, and no content lock-in.
                    </p>
                </div>
                <GistUrlForm />
            </section>

            <section className="product-preview" aria-label="GistBlog article preview">
                <div className="preview-toolbar">
                    <span className="preview-address">
                        gistblog.vercel.app/post/<strong>62538a...</strong>
                    </span>
                    <span className="preview-status">Rendered from GitHub</span>
                </div>
                <div className="preview-body">
                    <aside className="preview-author">
                        <div className="avatar-placeholder">AS</div>
                        <div>
                            <strong>Aveek Saha</strong>
                            <span>5 posts</span>
                        </div>
                    </aside>
                    <article className="preview-article">
                        <span className="preview-kicker">APR 30, 2021 · 4 MIN READ</span>
                        <h2>Welcome to a Gist blog post</h2>
                        <p>
                            A focused place for technical notes, experiments, and ideas that
                            deserve more than a raw Markdown view.
                        </p>
                        <pre>
                            <code>
                                <span>const</span> post = <span>await</span> publish(gist);
                            </code>
                        </pre>
                    </article>
                </div>
            </section>

            <section className="content-section" id="how-it-works">
                <div className="section-heading">
                    <p className="eyebrow">HOW IT WORKS</p>
                    <h2>From rough note to readable post.</h2>
                </div>
                <ol className="steps-list">
                    <li>
                        <span>1</span>
                        <div>
                            <strong>Write in Markdown</strong>
                            <p>Create a public GitHub Gist with a file ending in `_post.md`.</p>
                        </div>
                    </li>
                    <li>
                        <span>2</span>
                        <div>
                            <strong>Paste the URL</strong>
                            <p>Drop the gist URL into GistBlog. We securely render the content.</p>
                        </div>
                    </li>
                    <li>
                        <span>3</span>
                        <div>
                            <strong>Share the clean version</strong>
                            <p>Send the article URL. Updates stay connected to the source gist.</p>
                        </div>
                    </li>
                </ol>
            </section>

            <section className="content-section feature-section">
                <div className="section-heading">
                    <p className="eyebrow">BUILT FOR DEVELOPERS</p>
                    <h2>Small surface area. Useful details.</h2>
                </div>
                <ul className="feature-list">
                    {features.map(([title, description]) => (
                        <li key={title}>
                            <span aria-hidden="true">—</span>
                            <p>
                                <strong>{title}</strong>
                                {description}
                            </p>
                        </li>
                    ))}
                </ul>
                <Link className="primary-link" href="/post/62538a714d95ae8b2aafdb5c6751f2c5">
                    Read an example
                    <span aria-hidden="true">→</span>
                </Link>
            </section>

            <section className="content-section toolkit-section" id="publishing-tools">
                <div className="section-heading">
                    <p className="eyebrow">PUBLISHING TOOLS</p>
                    <h2>Everything your gist needs.</h2>
                    <p>
                        Generate safe frontmatter or add a one-click publishing shortcut to
                        your browser.
                    </p>
                </div>
                <PublishingToolkit siteUrl={siteUrl} />
            </section>

            <section className="content-section faq-section">
                <div className="section-heading">
                    <p className="eyebrow">FAQ</p>
                    <h2>The short version.</h2>
                </div>
                <div className="faq-list">
                    <details>
                        <summary>Does GistBlog copy or own my writing?</summary>
                        <p>No. GitHub remains the source of truth and every post links back to it.</p>
                    </details>
                    <details>
                        <summary>What Markdown is supported?</summary>
                        <p>
                            GitHub-flavored Markdown including tables, task lists, links, and
                            fenced code blocks. Raw HTML is intentionally disabled for safety.
                        </p>
                    </details>
                    <details>
                        <summary>How do I make an author page?</summary>
                        <p>
                            Visit `gistblog.vercel.app/your-github-username`. Files ending in
                            `_post.md` appear automatically.
                        </p>
                    </details>
                </div>
            </section>
        </main>
    );
}
