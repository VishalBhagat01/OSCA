const fs = require("fs");
const path = require("path");

const simpleGit = require("simple-git");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

const TEMP_DIR = path.join(__dirname, "../tmp");

function parseRepoUrl(repoUrl) {
    const match = repoUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);

    if (!match) {
        throw new Error("Invalid GitHub repository URL");
    }

    return {
        owner: match[1],
        repo: match[2],
    };
}

async function cloneRepository(repoUrl) {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    const { owner, repo } = parseRepoUrl(repoUrl);

    const repoPath = path.join(TEMP_DIR, `${owner}_${repo}`);

    if (!fs.existsSync(repoPath)) {
        console.log("Cloning repository...");
        await simpleGit().clone(repoUrl, repoPath);
    } else {
        console.log("Repository already exists. Pulling latest changes...");
        await simpleGit(repoPath).pull();
    }

    return repoPath;
}

async function getIssueDetails(repoUrl, issueNumber) {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const { data: issue } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
    const { data: comments } = await octokit.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100,
    });

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

async function pushBranch(git, branchName) {
    await git.push("origin", branchName, {
        "--set-upstream": null,
    });
}

async function openPullRequest(owner, repo, branchName, run) {
    const { data: repoData } = await octokit.repos.get({
        owner,
        repo,
    });

    const defaultBranch = repoData.default_branch;

    const { data: pr } = await octokit.pulls.create({
        owner,
        repo,
        title: run.title,
        head: branchName,
        base: defaultBranch,
        body: run.prDescription,
    });

    return pr;
}

async function createPullRequest(run, diff) {
    const repoPath = path.join(TEMP_DIR, `run-${run._id}`);
    try {
        const repoUrl = run.repository.url;
        const { owner, repo } = parseRepoUrl(repoUrl);

        fs.rmSync(repoPath, { recursive: true, force: true });
        await simpleGit().clone(repoUrl, repoPath);

        const branchName = `osa/issue-${run.issue.number}-${run._id}`;

        const git = await createBranch(repoPath, branchName);
        const patchPath = path.join(repoPath, ".osa.patch");
        fs.writeFileSync(patchPath, diff, "utf8");
        await git.raw(["apply", "--whitespace=fix", patchPath]);
        fs.unlinkSync(patchPath);

        await commitChanges(
            git,
            `Fix issue #${run.issue.number}: ${run.issue.title}`
        );

        await pushBranch(git, branchName);

        const pr = await openPullRequest(
            owner,
            repo,
            branchName,
            { title: run.issue.title, prDescription: `Automated patch for issue #${run.issue.number}.` }
        );

        return {
            number: pr.number,
            url: pr.html_url,
            branch: branchName,
            commit: (await git.revparse(["HEAD"])).trim(),
        };
    } catch (err) {
        console.error("Failed to create pull request:", err);
        throw err;
    } finally {
        fs.rmSync(repoPath, { recursive: true, force: true });
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
