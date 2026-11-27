import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import Panel from "./ui/Panel";

const lineStyle = (line) => {
  if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff") || line.startsWith("index"))
    return { row: "", text: "text-bone-3", mark: "" };
  if (line.startsWith("+")) return { row: "bg-verdigris/[0.09]", text: "text-verdigris", mark: "border-l-verdigris" };
  if (line.startsWith("-")) return { row: "bg-madder/[0.09]", text: "text-madder", mark: "border-l-madder" };
  if (line.startsWith("@@")) return { row: "bg-ember/[0.06]", text: "text-ember", mark: "" };
  return { row: "", text: "text-bone-2", mark: "" };
};

const PatchCard = ({ diff }) => {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => (diff ? diff.split("\n") : []), [diff]);

  if (!diff) return null;

  const added = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
  const removed = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;

  const copyDiff = async () => {
    try {
      await navigator.clipboard.writeText(diff);
      setCopied(true);
      toast.success("Diff copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the diff");
    }
  };

  return (
    <Panel
      eyebrow="Proof"
      title="Synthesized patch"
      meta={
        <span className="font-mono text-[12px]">
          <span className="text-verdigris">+{added}</span>{" "}
          <span className="text-madder">-{removed}</span>
          <span className="text-bone-3"> · {lines.length} lines</span>
        </span>
      }
      actions={
        <button
          type="button"
          onClick={copyDiff}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-rule-strong px-2.5 text-[12px] text-bone-2 transition hover:border-bone-3 hover:text-bone"
        >
          {copied ? <Check className="h-3 w-3 text-verdigris" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      }
      collapsible
      bodyClassName="bg-ink"
    >
      <div className="overflow-x-auto py-3">
        <pre className="m-0 min-w-max text-[12.5px] leading-[1.7]">
          {lines.map((line, i) => {
            const s = lineStyle(line);
            return (
              <div key={i} className={`flex border-l-2 border-transparent ${s.row} ${s.mark}`}>
                <span className="diff-gutter w-12 shrink-0 pr-4 text-right text-bone-4 tabular-nums">{i + 1}</span>
                <span className={`flex-1 pr-6 whitespace-pre ${s.text}`}>{line || " "}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </Panel>
  );
};

export default PatchCard;
