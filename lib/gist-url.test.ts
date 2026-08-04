import assert from "node:assert/strict";
import { test } from "node:test";

import { extractGistId, extractGitHubUsername } from "./gist-url";

test("extracts gist IDs from supported user input", () => {
    assert.equal(extractGistId("A12bc"), "a12bc");
    assert.equal(
        extractGistId("https://gist.github.com/octocat/AA12bc"),
        "aa12bc"
    );
    assert.equal(
        extractGistId("https://gist.github.com/octocat/AA12bc.git"),
        "aa12bc"
    );
});

test("rejects non-GitHub and malformed gist URLs", () => {
    assert.equal(extractGistId("https://example.com/octocat/aa12bc"), null);
    assert.equal(extractGistId("https://gist.github.com/octocat/not-a-gist"), null);
    assert.equal(extractGistId("javascript:alert(1)"), null);
});

test("extracts usernames without accepting unrelated URLs", () => {
    assert.equal(extractGitHubUsername("Aveek-Saha"), "Aveek-Saha");
    assert.equal(extractGitHubUsername("https://github.com/Aveek-Saha"), "Aveek-Saha");
    assert.equal(extractGitHubUsername("https://gist.github.com/octocat/abcde"), "octocat");
    assert.equal(extractGitHubUsername("https://example.com/octocat"), null);
});
