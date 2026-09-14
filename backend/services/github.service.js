const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const simpleGit = require("simple-git");
const { Octokit } = require("@octokit/rest");
const config = require("../config/env");

const octokit = new Octokit({
    auth: config.githubToken || undefined,
});

const TEMP_DIR = path.join(__dirname, "../tmp");

function parseRepoUrl(repoUrl) {
    if (!repoUrl || typeof repoUrl !== "string") {
        throw new Error("Repository URL must be a valid string");
    }

    const match = repoUrl.match(/^(?:https?:\/\/)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?\/?$/)
        || repoUrl.match(/^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/);

    if (!match || match[1] === ".." || match[2] === ".." || match[1].includes("/") || match[2].includes("/")) {
        throw new Error("Invalid GitHub repository URL");
    }

    return {
        owner: match[1],
        repo: match[2],
    };
}

async function cloneRepository(repoUrl) {
    await fsp.mkdir(TEMP_DIR, { recursive: true });

    const { owner, repo } = parseRepoUrl(repoUrl);
    const repoPath = path.join(TEMP_DIR, `${owner}_${repo}`);

    try {
        await fsp.access(repoPath);
        console.log("Repository already exists. Pulling latest changes...");
        await simpleGit(repoPath).pull();
    } catch {
        console.log("Cloning repository...");
        await simpleGit().clone(repoUrl, repoPath);
    }

    return repoPath;
}

async function getIssueDetails(repoUrl, issueNumber) {
    const { owner, repo } = parseRepoUrl(repoUrl);

    // Fetch issue and comments concurrently
    const [issueRes, commentsRes] = await Promise.all([
        octokit.issues.get({ owner, repo, issue_number: issueNumber }),
        octokit.issues.listComments({
            owner,
            repo,
            issue_number: issueNumber,
            per_page: 100,
        }),
    ]);

    const issue = issueRes.data;
    const comments = commentsRes.data;

    if (issue.pull_request) throw new Error("Pull requests cannot be processed as issues.");

    return {
        title: issue.title,
        body: issue.body || "",
        labels: issue.labels.map((label) => typeof label === "string" ? label : label.name),
        comments: comments.map((comment) => comment.body || ""),
    };
}

async function createBranch(repoPath, branchName) {
    const git = simpleGit(repoPath);

    await git.fetch();

    // Checkout default branch first
    const current = await git.branch();

    if (current.current !== "main") {
        try {
            await git.checkout("main");
            await git.pull();
        } catch {
            // Some repositories still use master
            await git.checkout("master");
            await git.pull();
        }
    }

    const branches = await git.branchLocal();

    if (branches.all.includes(branchName)) {
        console.log(`Checking out existing branch ${branchName}`);
        await git.checkout(branchName);
    } else {
        console.log(`Creating branch ${branchName}`);
        await git.checkoutLocalBranch(branchName);
    }

    return git;
}

async function commitChanges(git, message) {
    const status = await git.status();

    if (status.files.length === 0) {
        throw new Error("No modified files found to commit.");
    }

    await git.add(".");
    await git.commit(message);
}

async function pushBranch(git, branchName, force = false) {
    const options = {
        "--set-upstream": null,
    };
    if (force) {
        options["--force"] = null;
    }
    await git.push("origin", branchName, options);
}

async function openPullRequest(owner, repo, branchName, run, isDraft = true) {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    const { data: pr } = await octokit.pulls.create({
        owner,
        repo,
        title: run.title,
        head: branchName,
        base: defaultBranch,
        body: run.prDescription,
        draft: Boolean(isDraft),
    });

    return pr;
}

async function createPullRequest(run, diff, options = {}) {
    const repoPath = path.join(TEMP_DIR, `run-${run._id}`);
    try {
        const repoUrl = run.repository.url;
        const { owner, repo } = parseRepoUrl(repoUrl);

        await fsp.rm(repoPath, { recursive: true, force: true });
        await simpleGit().clone(repoUrl, repoPath);

        // Leverage PR metadata from agent if available, with robust fallbacks
        const prMeta = run.result?.pr_metadata || {};
        let branchName = prMeta.branch_name || `osa/issue-${run.issue.number}-${run._id}`;
        const commitMessage = prMeta.commit_message || `Fix issue #${run.issue.number}: ${run.issue.title}`;
        const prTitle = prMeta.pr_title || prMeta.title || run.issue.title;
        const prBody = prMeta.pr_body || prMeta.body || `Automated patch for issue #${run.issue.number}.`;
        const isDraft = options.isDraft !== undefined ? options.isDraft : (prMeta.is_draft !== false);

        // Check if an existing PR for this branch exists. If it was already closed/merged,
        // create a new unique branch name so GitHub allows opening a new pull request.
        try {
            const existingPrs = await octokit.pulls.list({
                owner,
                repo,
                head: `${owner}:${branchName}`,
                state: "all",
            });
            const closedPr = existingPrs.data?.find((p) => p.state === "closed");
            const openPr = existingPrs.data?.find((p) => p.state === "open");
            if (closedPr && !openPr) {
                branchName = `${branchName}-${run._id.toString().slice(-6)}`;
            }
        } catch {
            // Ignore pre-check failures
        }

        const git = await createBranch(repoPath, branchName);
        const patchPath = path.join(repoPath, ".osa.patch");
        await fsp.writeFile(patchPath, diff, "utf8");
        await git.raw(["apply", "--whitespace=fix", patchPath]);
        await fsp.unlink(patchPath);

        await commitChanges(git, commitMessage);
        await pushBranch(git, branchName, true);

        let pr;
        try {
            pr = await openPullRequest(
                owner,
                repo,
                branchName,
                { title: prTitle, prDescription: prBody },
                isDraft
            );
        } catch (openErr) {
            // Check if PR already exists or was opened for this branch
            try {
                const existingPrs = await octokit.pulls.list({
                    owner,
                    repo,
                    head: `${owner}:${branchName}`,
                    state: "all",
                });
                if (existingPrs.data && existingPrs.data.length > 0) {
                    pr = existingPrs.data[0];
                    try {
                        const updatedPr = await octokit.pulls.update({
                            owner,
                            repo,
                            pull_number: pr.number,
                            title: prTitle,
                            body: prBody,
                        });
                        pr = updatedPr.data;
                    } catch {
                        // Retain original PR info if update call fails
                    }
                }
            } catch (listErr) {
                // Ignore list error
            }

            if (!pr) {
                if (openErr.status === 403) {
                    throw new Error(
                        "GitHub returned 403 Forbidden: Personal Access Token does not have 'Pull requests: Read and write' permission on this repository."
                    );
                }
                throw openErr;
            }
        }

        let commitSha = "";
        try {
            commitSha = (await git.revparse(["HEAD"])).trim();
        } catch (revErr) {
            commitSha = "";
        }

        return {
            number: pr.number,
            url: pr.html_url,
            branch: branchName,
            commit: commitSha,
            isDraft: Boolean(pr.draft),
        };
    } catch (err) {
        console.error("Failed to create pull request:", err);
        throw err;
    } finally {
        try {
            await fsp.rm(repoPath, { recursive: true, force: true });
        } catch (cleanErr) {
            // Ignore directory cleanup locks on Windows
        }
    }
}

module.exports = {
    parseRepoUrl,
    getIssueDetails,
    cloneRepository,
    createBranch,
    commitChanges,
    pushBranch,
    openPullRequest,
    createPullRequest,
};
