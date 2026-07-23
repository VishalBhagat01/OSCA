const simpleGit = require("simple-git");

class GitService {

    async cloneRepository(repoUrl, localPath) {

    }

    async createBranch(repoPath, branchName) {

        try {

            const git = simpleGit(repoPath);

            await git.checkoutLocalBranch(branchName);

        } catch (error) {

            throw new Error(`Failed to create branch: ${error.message}`);

        }

    }

    async commitChanges(repoPath, message) {
        const git = simpleGit(repoPath);

        await git.add(".");

        await git.commit(message);
    }

    async pushBranch(repoPath, branchName) {
        const git = simpleGit(repoPath);

        await git.push("origin", branchName);
    }

}

module.exports = new GitService();