const test = require("node:test");
const assert = require("node:assert/strict");
const { parseRepoUrl } = require("../services/github.service");

test("GitHub Service - parseRepoUrl", async (t) => {
    await t.test("parses standard https repo url", () => {
        const result = parseRepoUrl("https://github.com/facebook/react");
        assert.deepEqual(result, { owner: "facebook", repo: "react" });
    });

    await t.test("parses url with .git extension", () => {
        const result = parseRepoUrl("https://github.com/pallets/flask.git");
        assert.deepEqual(result, { owner: "pallets", repo: "flask" });
    });

    await t.test("parses ssh format", () => {
        const result = parseRepoUrl("git@github.com:torvalds/linux.git");
        assert.deepEqual(result, { owner: "torvalds", repo: "linux" });
    });

    await t.test("rejects malformed url", () => {
        assert.throws(() => {
            parseRepoUrl("not-a-valid-url");
        }, /Invalid GitHub repository URL/);
    });

    await t.test("rejects non-github domains", () => {
        assert.throws(() => {
            parseRepoUrl("https://gitlab.com/owner/repo");
        }, /Invalid GitHub repository URL/);
    });

    await t.test("rejects invalid characters / path traversal attempts", () => {
        assert.throws(() => {
            parseRepoUrl("https://github.com/../../etc/passwd");
        }, /Invalid GitHub repository URL/);
    });

    await t.test("rejects empty or null url", () => {
        assert.throws(() => {
            parseRepoUrl("");
        }, /Repository URL must be a valid string/);

        assert.throws(() => {
            parseRepoUrl(null);
        }, /Repository URL must be a valid string/);
    });
});
