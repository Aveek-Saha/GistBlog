import type { BlogPost, Owner } from "./github";
import { escapeXml } from "./markdown";
import { absoluteUrl } from "./site";

function safeDate(value: string): Date {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

export function createRssFeed(owner: Owner, posts: BlogPost[]): string {
    const blogUrl = absoluteUrl(`/${owner.login}`);
    const items = posts
        .map((post) => {
            const url = absoluteUrl(`/post/${post.id}`);
            return `<item>
<title>${escapeXml(post.title)}</title>
<link>${escapeXml(url)}</link>
<guid isPermaLink="true">${escapeXml(url)}</guid>
<description>${escapeXml(post.description)}</description>
<pubDate>${safeDate(post.createdAt).toUTCString()}</pubDate>
${(post.metadata.tags ?? []).map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n")}
</item>`;
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(`${owner.name || owner.login}'s GistBlog`)}</title>
<link>${escapeXml(blogUrl)}</link>
<description>${escapeXml(owner.bio || `GistBlog posts by ${owner.login}`)}</description>
<language>en</language>
<atom:link href="${escapeXml(absoluteUrl(`/${owner.login}/feed.xml`))}" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`;
}

export function createAtomFeed(owner: Owner, posts: BlogPost[]): string {
    const blogUrl = absoluteUrl(`/${owner.login}`);
    const updated = posts[0]?.updatedAt ?? new Date(0).toISOString();
    const entries = posts
        .map((post) => {
            const url = absoluteUrl(`/post/${post.id}`);
            return `<entry>
<title>${escapeXml(post.title)}</title>
<id>${escapeXml(url)}</id>
<link href="${escapeXml(url)}" />
<published>${safeDate(post.createdAt).toISOString()}</published>
<updated>${safeDate(post.updatedAt).toISOString()}</updated>
<summary>${escapeXml(post.description)}</summary>
${(post.metadata.tags ?? []).map((tag) => `<category term="${escapeXml(tag)}" />`).join("\n")}
</entry>`;
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>${escapeXml(`${owner.name || owner.login}'s GistBlog`)}</title>
<id>${escapeXml(blogUrl)}</id>
<link href="${escapeXml(blogUrl)}" />
<link href="${escapeXml(absoluteUrl(`/${owner.login}/atom.xml`))}" rel="self" />
<updated>${safeDate(updated).toISOString()}</updated>
<author><name>${escapeXml(owner.name || owner.login)}</name></author>
${entries}
</feed>`;
}
