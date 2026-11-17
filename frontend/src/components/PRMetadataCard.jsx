import { GitPullRequest, GitBranch, GitCommit, ExternalLink, FileText } from "lucide-react";

const PRMetadataCard = ({ prMetadata, pullRequest }) => {
  if (!prMetadata && !pullRequest) return null;

  const meta = prMetadata || {};
  const pr = pullRequest || {};

  return (
    <div className="rounded-2xl border border-white/6 bg-[#111111] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/15">
            <GitPullRequest className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#E8E8E3]">
              Pull Request
            </h3>
            {pr.number && (
              <span className="text-[11px] text-[#525250] font-mono">
                #{pr.number} {pr.isDraft ? "· Draft" : ""}
              </span>
            )}
          </div>
        </div>

        {pr.url && (
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2.5 py-1.5 text-[11px] font-medium text-orange-400 hover:text-orange-300 hover:border-orange-500/30 transition"
          >
            View on GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* PR Title */}
        {(meta.pr_title || meta.title) && (
          <div className="space-y-1 sm:col-span-2">
            <span className="text-[11px] font-medium text-[#525250] uppercase tracking-wider">
              Title
            </span>
            <p className="text-[13px] text-[#E8E8E3] font-medium">
              {meta.pr_title || meta.title}
            </p>
          </div>
        )}

        {/* Branch */}
        {(meta.branch_name || pr.branch) && (
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-[#525250] uppercase tracking-wider flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              Branch
            </span>
            <p className="font-mono text-[12px] text-[#A8A8A0] truncate">
              {meta.branch_name || pr.branch}
            </p>
          </div>
        )}

        {/* Commit */}
        {(meta.commit_message || pr.commit) && (
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-[#525250] uppercase tracking-wider flex items-center gap-1">
              <GitCommit className="h-3 w-3" />
              {meta.commit_message ? "Commit Message" : "Commit SHA"}
            </span>
            <p className="font-mono text-[12px] text-[#A8A8A0] truncate">
              {meta.commit_message || pr.commit}
            </p>
          </div>
        )}
      </div>

      {/* PR Body */}
      {(meta.pr_body || meta.body) && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-[#525250] uppercase tracking-wider flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Description
          </span>
          <div className="rounded-xl bg-white/2 border border-white/4 p-3">
            <p className="text-[12px] text-[#737370] leading-relaxed whitespace-pre-wrap">
              {meta.pr_body || meta.body}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PRMetadataCard;
