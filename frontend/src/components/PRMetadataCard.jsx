import { useState } from "react";
import {
  GitPullRequest,
  GitBranch,
  GitCommit,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export const PRMetadataCard = ({ prMetadata, pullRequest }) => {
  const [copiedField, setCopiedField] = useState("");

  if (!prMetadata && !pullRequest) return null;

  const branchName =
    pullRequest?.branch || prMetadata?.branchName || prMetadata?.branch_name;
  const commitMessage =
    prMetadata?.commitMessage || prMetadata?.commit_message;
  const prTitle =
    pullRequest?.title || prMetadata?.prTitle || prMetadata?.pr_title;
  const prBody =
    pullRequest?.body || prMetadata?.prBody || prMetadata?.pr_body;

  if (!branchName && !commitMessage && !prTitle && !pullRequest?.url) return null;

  const copyToClipboard = async (text, field, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`Copied ${label}`);
      setTimeout(() => setCopiedField(""), 2000);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800 bg-zinc-950/90 px-5 sm:px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <GitPullRequest className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Pull Request Metadata
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                <Sparkles className="h-3 w-3 text-violet-400" />
                Automated
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Generated git branch, commit message, and PR description
            </p>
          </div>
        </div>

        {pullRequest?.url && (
          <a
            href={pullRequest.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-500 active:bg-emerald-700"
          >
            <span>Open PR #{pullRequest.number} on GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {/* Branch & Commit Row */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Branch Name */}
          {branchName && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <GitBranch className="h-3.5 w-3.5" />
                  Target Branch
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(branchName, "branch", "branch name")
                  }
                  className="text-zinc-500 hover:text-white transition p-1"
                  title="Copy branch name"
                >
                  {copiedField === "branch" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="font-mono text-xs font-medium text-indigo-300 break-all">
                {branchName}
              </p>
            </div>
          )}

          {/* Commit Message */}
          {commitMessage && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-1.5">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <GitCommit className="h-3.5 w-3.5" />
                  Commit Message
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(commitMessage, "commit", "commit message")
                  }
                  className="text-zinc-500 hover:text-white transition p-1"
                  title="Copy commit message"
                >
                  {copiedField === "commit" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="font-mono text-xs font-medium text-zinc-200 truncate">
                {commitMessage}
              </p>
            </div>
          )}
        </div>

        {/* PR Title */}
        {prTitle && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              PR Title
            </span>
            <p className="mt-1 text-sm font-semibold text-white">{prTitle}</p>
          </div>
        )}

        {/* PR Body */}
        {prBody && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              PR Description Body
            </span>
            <div className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-[#070709] p-3.5 font-mono text-xs text-zinc-300 leading-relaxed border border-zinc-800/80">
              {prBody}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PRMetadataCard;
