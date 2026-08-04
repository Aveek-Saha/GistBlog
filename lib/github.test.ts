import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
    fetchBlogPage,
    fetchGistById,
    findPostFile,
    GitHubError,
    parsePostMarkdown,
    validateGistId,
    validateGitHubUsername,
    validatePage,
} from "./github";

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

test("validates route parameters before using them in GitHub requests", () => {
    assert.equal(validateGitHubUsername("octocat"), "octocat");
    assert.equal(validateGistId("AA12bc"), "aa12bc");
    assert.equal(validatePage(2), 2);

    assert.throws(() => validateGitHubUsername("-invalid"), GitHubError);
    assert.throws(() => validateGitHubUsername("bad--name"), GitHubError);
    assert.throws(() => validateGistId("../../etc/passwd"), GitHubError);
    assert.throws(() => validatePage(0), GitHubError);
});

test("selects the _post.md file even when it is not the first gist file", () => {
    const files = {
        "notes.txt": {
            filename: "notes.txt",
            type: "text/plain",
            raw_url: "https://example.com/notes.txt",
            language: "Text",
        },
        "my_post.md": {
            filename: "my_post.md",
            type: "text/markdown",
            raw_url: "https://example.com/my_post.md",
            language: "Markdown",
        },
    };

    assert.equal(findPostFile(files)?.filename, "my_post.md");
});

test("parses only the supported bounded frontmatter fields", () => {
    const markdown = `---
title: "A safe title"
description: A short description
tags: [nextjs, security]
unknown: ignored
---
# Article

Hello.`;

    assert.deepEqual(parsePostMarkdown(markdown), {
        content: "# Article\n\nHello.",
        metadata: {
            title: "A safe title",
            description: "A short description",
            tags: ["nextjs", "security"],
        },
    });
});

test("loads blog post details concurrently", async () => {
    const owner = {
        login: "octocat",
        avatar_url: "https://avatars.githubusercontent.com/u/1",
        html_url: "https://github.com/octocat",
    };
    const summaries = Array.from({ length: 5 }, (_, index) => ({
        id: `abcde${index}`,
        html_url: `https://gist.github.com/abcde${index}`,
        files: {
            [`post_${index}_post.md`]: {
                filename: `post_${index}_post.md`,
                type: "text/markdown",
                raw_url: `https://example.com/post-${index}.md`,
                language: "Markdown",
            },
        },
        description: null,
        owner,
        created_at: `2026-08-0${index + 1}T00:00:00Z`,
        updated_at: `2026-08-0${index + 1}T00:00:00Z`,
    }));

    let activeDetailRequests = 0;
    let maxActiveDetailRequests = 0;

    globalThis.fetch = async (input) => {
        const url = String(input);
        if (url.includes("/users/octocat/gists")) {
            return Response.json(summaries);
        }

        const id = url.split("/").at(-1) ?? "";
        const summary = summaries.find((gist) => gist.id === id);
        assert.ok(summary);

        activeDetailRequests += 1;
        maxActiveDetailRequests = Math.max(
            maxActiveDetailRequests,
            activeDetailRequests
        );
        await new Promise((resolve) => setTimeout(resolve, 10));
        activeDetailRequests -= 1;

        const filename = Object.keys(summary.files)[0];
        return Response.json({
            ...summary,
            files: {
                [filename]: {
                    ...summary.files[filename],
                    content: `---\ntitle: Post ${id}\n---\nBody`,
                    truncated: false,
                },
            },
        });
    };

    const blog = await fetchBlogPage("octocat");
    assert.equal(blog.posts.length, 5);
    assert.ok(maxActiveDetailRequests > 1);
});

test("converts a missing GitHub gist into a typed 404 error", async () => {
    globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });

    await assert.rejects(fetchGistById("abcde"), (error: unknown) => {
        return error instanceof GitHubError && error.status === 404;
    });
});

test("does not fetch a truncated gist from an untrusted raw URL", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
        calls += 1;
        return Response.json({
            id: "abcde",
            html_url: "https://gist.github.com/abcde",
            files: {
                "unsafe_post.md": {
                    filename: "unsafe_post.md",
                    type: "text/markdown",
                    raw_url: "https://attacker.example/internal",
                    language: "Markdown",
                    content: "partial",
                    truncated: true,
                },
            },
            description: null,
            owner: {
                login: "octocat",
                avatar_url: "https://avatars.githubusercontent.com/u/1",
                html_url: "https://github.com/octocat",
            },
            created_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-01T00:00:00Z",
        });
    };

    await assert.rejects(fetchGistById("abcde"), (error: unknown) => {
        return error instanceof GitHubError && error.status === 502;
    });
    assert.equal(calls, 1);
});
