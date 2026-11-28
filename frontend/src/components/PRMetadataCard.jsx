import { ExternalLink } from "lucide-react";
import Panel from "./ui/Panel";

const Row = ({ label, children, mono = false }) => (
  <div className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
    <dt className="eyebrow pt-0.5">{label}</dt>
    <dd className={`min-w-0 text-[14px] break-words text-bone ${mono ? "font-mono text-[13px] text-bone-2" : ""}`}>
      {children}
    </dd>
  </div>
);

const PRMetadataCard = ({ prMetadata, pullRequest }) => {
  if (!prMetadata && !pullRequest) return null;

  const meta = prMetadata || {};
  const pr = pullRequest || {};
  const title = meta.pr_title || meta.title;
  const branch = meta.branch_name || pr.branch;
  const commit = meta.commit_message || pr.commit;
  const body = meta.pr_body || meta.body;

  return (
    <Panel
      eyebrow="Pull request"
      title={title || "Pull request"}
      meta={pr.number ? `#${pr.number}${pr.isDraft ? " · Draft" : ""}` : null}
      actions={
        pr.url && (
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ember/40 px-3.5 text-[13px] text-ember transition hover:bg-ember/10"
          >
            View on GitHub
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )
      }
      bodyClassName="px-6"
    >
      <dl className="divide-y divide-rule">
        {branch && <Row label="Branch" mono>{branch}</Row>}
        {commit && <Row label={meta.commit_message ? "Commit" : "Commit SHA"} mono>{commit}</Row>}
        {body && (
          <Row label="Description">
            <p className="leading-relaxed whitespace-pre-wrap text-bone-2">{body}</p>
          </Row>
        )}
      </dl>
    </Panel>
  );
};

export default PRMetadataCard;
