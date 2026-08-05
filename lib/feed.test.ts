import assert from "node:assert/strict";
import { test } from "node:test";

import { createAtomFeed, createRssFeed } from "./feed";
import type { BlogPost, Owner } from "./github";

const owner: Owner = {
    login: "octocat",
    name: "The <Octocat>",
    bio: "Code & notes",
    avatar_url: "https://avatars.githubusercontent.com/u/1",
    html_url: "https://github.com/octocat",
};

const post: BlogPost = {
    id: "abc123",
    filename: "hello_post.md",
    title: "Hello & goodbye",
    description: "A <short> post",
    metadata: { tags: ["next.js"] },
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
};

test("creates escaped RSS and Atom discovery feeds", () => {
    const rss = createRssFeed(owner, [post]);
    const atom = createAtomFeed(owner, [post]);

    assert.match(rss, /<rss version="2\.0"/);
    assert.match(rss, /Hello &amp; goodbye/);
    assert.match(rss, /A &lt;short&gt; post/);
    assert.match(atom, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
    assert.match(atom, /The &lt;Octocat&gt;/);
    assert.match(atom, /<category term="next\.js"/);
});
