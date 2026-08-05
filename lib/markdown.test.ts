import assert from "node:assert/strict";
import { test } from "node:test";

import {
    escapeXml,
    extractTableOfContents,
    readingTime,
    stripDuplicateTitle,
} from "./markdown";

test("removes only a duplicated leading article title", () => {
    assert.equal(
        stripDuplicateTitle("# My **Post**\n\nBody", "My Post"),
        "Body"
    );
    assert.equal(stripDuplicateTitle("## Introduction\n\nBody", "My Post"), "## Introduction\n\nBody");
});

test("extracts unique level-two and level-three headings outside code fences", () => {
    const markdown = "## Setup\n### Install\n## Setup\n```md\n## ignored\n```";
    assert.deepEqual(extractTableOfContents(markdown), [
        { depth: 2, id: "setup", label: "Setup" },
        { depth: 3, id: "install", label: "Install" },
        { depth: 2, id: "setup-1", label: "Setup" },
    ]);
});

test("computes a minimum reading time and escapes XML", () => {
    assert.equal(readingTime("A short post"), 1);
    assert.equal(escapeXml(`<tag title="x">&`), "&lt;tag title=&quot;x&quot;&gt;&amp;");
});
