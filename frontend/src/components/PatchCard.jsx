import { useState, useMemo } from "react";
import { Code2, Copy, Check, FileCode, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

const PatchCard = ({ diff }) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => {
    if (!diff) return [];
    return diff.split("\n");
  }, [diff]);

  if (!diff) return null;

  const copyDiff = async () => {
    try {
      await navigator.clipboard.writeText(diff);
      setCopied(true);
      toast.success("Diff copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy diff");
    }
  };

  return (
    <div className="rounded-2xl border border-white/6 bg-[#111111] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/6">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#E8E8E3]">Synthesized Patch</h3>
            <span className="text-[11px] text-[#525250]">
              {lines.length} lines
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyDiff}
            className="inline-flex items-center gap-1 rounded-lg border border-white/8 px-2.5 py-1 text-[11px] font-medium text-[#737370] hover:text-[#E8E8E3] hover:border-white/12 transition"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-[#525250] hover:text-[#A8A8A0] transition"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          <pre className="text-[12px] leading-[1.6] font-mono p-0 m-0">
            {lines.map((line, i) => {
              let bg = "bg-transparent";
              let textColor = "text-[#A8A8A0]";
              let gutterColor = "text-[#525250]";

              if (line.startsWith("+") && !line.startsWith("+++")) {
                bg = "bg-emerald-500/8";
                textColor = "text-emerald-300";
              } else if (line.startsWith("-") && !line.startsWith("---")) {
                bg = "bg-red-500/8";
                textColor = "text-red-300";
              } else if (line.startsWith("@@")) {
                bg = "bg-orange-500/5";
                textColor = "text-orange-400";
              } else if (line.startsWith("diff") || line.startsWith("index")) {
                textColor = "text-[#737370]";
              }

              return (
                <div
                  key={i}
                  className={`flex ${bg} hover:bg-white/3 transition-colors duration-75`}
                >
                  <span
                    className={`diff-gutter w-12 shrink-0 text-right pr-3 pl-3 ${gutterColor} border-r border-white/4`}
                  >
                    {i + 1}
                  </span>
                  <span className={`flex-1 px-4 ${textColor} whitespace-pre`}>
                    {line}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PatchCard;