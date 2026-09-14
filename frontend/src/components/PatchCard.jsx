import { useState, useMemo } from "react";
import {
  FileCode2,
  Copy,
  Check,
  WrapText,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Parses unified diff into structured lines with line numbers and file boundaries
 */
function parseDiff(diffText) {
  if (!diffText) return [];

  const lines = diffText.split("\n");
  const parsed = [];
  let oldLineNum = 0;
  let newLineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // Check for git diff file header
    if (raw.startsWith("diff --git")) {
      const match = raw.match(/diff --git a\/(.+) b\/(.+)/);
      const currentFile = match ? match[2] : raw;
      parsed.push({
        type: "file-header",
        raw,
        file: currentFile,
      });
      continue;
    }

    if (raw.startsWith("--- ") || raw.startsWith("+++ ") || raw.startsWith("index ")) {
      parsed.push({
        type: "file-meta",
        raw,
      });
      continue;
    }

    // Check for hunk header @@ -o,l +n,l @@
    if (raw.startsWith("@@")) {
      const match = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLineNum = parseInt(match[1], 10);
        newLineNum = parseInt(match[2], 10);
      }
      parsed.push({
        type: "hunk-header",
        raw,
      });
      continue;
    }

    // Additions
    if (raw.startsWith("+")) {
      parsed.push({
        type: "addition",
        oldLine: null,
        newLine: newLineNum++,
        content: raw.slice(1),
        raw,
      });
      continue;
    }

    // Deletions
    if (raw.startsWith("-")) {
      parsed.push({
        type: "deletion",
        oldLine: oldLineNum++,
        newLine: null,
        content: raw.slice(1),
        raw,
      });
      continue;
    }

    // Context line
    parsed.push({
      type: "context",
      oldLine: oldLineNum++,
      newLine: newLineNum++,
      content: raw.startsWith(" ") ? raw.slice(1) : raw,
      raw,
    });
  }

  return parsed;
}

export const PatchCard = ({ diff }) => {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const parsedLines = useMemo(() => parseDiff(diff), [diff]);

  const { added, removed, files } = useMemo(() => {
    if (!diff) return { added: 0, removed: 0, files: [] };
    const lines = diff.split("\n");
    let add = 0;
    let rem = 0;
    const fileSet = new Set();

    lines.forEach((l) => {
      if (l.startsWith("+") && !l.startsWith("+++")) add++;
      if (l.startsWith("-") && !l.startsWith("---")) rem++;
      if (l.startsWith("diff --git")) {
        const m = l.match(/diff --git a\/(.+) b\/(.+)/);
        if (m) fileSet.add(m[2]);
      }
    });

    return { added: add, removed: rem, files: Array.from(fileSet) };
  }, [diff]);

  if (!diff) return null;

  const copyPatch = async () => {
    try {
      await navigator.clipboard.writeText(diff);
      setCopied(true);
      toast.success("Unified diff copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy diff");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 bg-zinc-950/90 px-5 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileCode2 className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Synthesized Code Patch
              </h2>
              <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                Unified Diff
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {files.length > 0
                ? `${files.length} file${files.length > 1 ? "s" : ""} modified`
                : "Exact lines changed by the code generation engine"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Stats Badges */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-400">
              +{added}
            </span>
            <span className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-400">
              -{removed}
            </span>
          </div>

          {/* Wrap Toggle */}
          <button
            type="button"
            onClick={() => setWrap(!wrap)}
            className={`rounded-lg border p-2 text-xs transition ${
              wrap
                ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
            title="Toggle word wrap"
            aria-label="Toggle word wrap"
          >
            <WrapText className="h-4 w-4" />
          </button>

          {/* Copy Full Patch */}
          <button
            type="button"
            onClick={copyPatch}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
            title="Copy full unified patch"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Patch</span>
              </>
            )}
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition"
            title={isExpanded ? "Collapse diff" : "Expand diff"}
            aria-label={isExpanded ? "Collapse diff" : "Expand diff"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* File List Chips (if multiple) */}
      {files.length > 1 && isExpanded && (
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 bg-zinc-950/60 px-6 py-2.5">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Files:
          </span>
          {files.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-300"
            >
              <FileText className="h-3 w-3 text-indigo-400" />
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Diff Code Container */}
      {isExpanded && (
        <div className="max-h-[600px] overflow-auto bg-[#09090d] font-mono text-xs">
          <table className="w-full border-collapse">
            <tbody>
              {parsedLines.map((line, idx) => {
                if (line.type === "file-header") {
                  return (
                    <tr
                      key={idx}
                      className="border-y border-zinc-800/90 bg-zinc-900/80 text-zinc-300"
                    >
                      <td colSpan={3} className="px-4 py-2 font-semibold text-indigo-300">
                        {line.raw}
                      </td>
                    </tr>
                  );
                }

                if (line.type === "file-meta") {
                  return (
                    <tr key={idx} className="bg-zinc-950/50 text-zinc-500">
                      <td colSpan={3} className="px-4 py-0.5 text-[11px]">
                        {line.raw}
                      </td>
                    </tr>
                  );
                }

                if (line.type === "hunk-header") {
                  return (
                    <tr
                      key={idx}
                      className="bg-indigo-950/20 text-indigo-300/80 border-y border-indigo-900/30 select-none"
                    >
                      <td
                        colSpan={3}
                        className="px-4 py-1 font-semibold text-[11px] tracking-wide"
                      >
                        {line.raw}
                      </td>
                    </tr>
                  );
                }

                const isAddition = line.type === "addition";
                const isDeletion = line.type === "deletion";

                const rowBg = isAddition
                  ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                  : isDeletion
                  ? "bg-rose-500/10 hover:bg-rose-500/15"
                  : "hover:bg-zinc-800/40";

                const textCol = isAddition
                  ? "text-emerald-300"
                  : isDeletion
                  ? "text-rose-300"
                  : "text-zinc-300";

                const gutterSymbol = isAddition ? "+" : isDeletion ? "-" : " ";

                return (
                  <tr key={idx} className={`leading-relaxed transition-colors ${rowBg}`}>
                    {/* Old Line Number */}
                    <td className="w-12 select-none px-2 py-0.5 text-right text-[11px] font-mono text-zinc-600 border-r border-zinc-800/60">
                      {line.oldLine ?? ""}
                    </td>

                    {/* New Line Number */}
                    <td className="w-12 select-none px-2 py-0.5 text-right text-[11px] font-mono text-zinc-600 border-r border-zinc-800/60">
                      {line.newLine ?? ""}
                    </td>

                    {/* Gutter Symbol & Content */}
                    <td
                      className={`px-3 py-0.5 ${textCol} ${
                        wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"
                      }`}
                    >
                      <span className="inline-block w-4 select-none font-bold opacity-70">
                        {gutterSymbol}
                      </span>
                      {line.content}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatchCard;