import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import runService from "../services/runService";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../utils/formatters";

const PRESET_ISSUES = [
  { name: "Flask", repo: "https://github.com/pallets/flask", issue: 5120, desc: "CLI runner error handling" },
  { name: "Requests", repo: "https://github.com/psf/requests", issue: 6042, desc: "Header encoding normalization" },
  { name: "FastAPI", repo: "https://github.com/fastapi/fastapi", issue: 9241, desc: "Query validation edge case" },
];

const STAGES = [
  { n: "01", title: "Read", body: "Indexes the repository and builds an AST skeleton so the model sees structure, not noise." },
  { n: "02", title: "Plan", body: "Finds the root cause and lists the files and steps that a fix will touch." },
  { n: "03", title: "Patch", body: "Writes a unified diff and applies it with a fuzzy matcher that survives drifting context." },
  { n: "04", title: "Verify", body: "Runs validators, the test suite and acceptance checks. Failures loop back with the trace." },
  { n: "05", title: "Review", body: "Stops for you. Approve to open a draft pull request, or send feedback for another pass." },
];

/** Line drawing of the agent loop. Purely decorative. */
const OrbitArt = () => (
  <svg
    viewBox="0 0 600 600"
    fill="none"
    aria-hidden
    className="pointer-events-none absolute -top-24 -right-48 h-[640px] w-[640px] text-bone opacity-[0.16] sm:-right-24 lg:-right-10 lg:opacity-[0.22]"
  >
    <g className="orbit-slow">
      <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1 7" transform="scale(.82) translate(66 66)" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 300 300)`}>
          <line x1="300" y1="20" x2="300" y2="34" stroke="currentColor" strokeWidth="1" />
          <circle cx="300" cy="20" r="3" fill="var(--color-ink)" stroke="currentColor" strokeWidth="1" />
        </g>
      ))}
    </g>
    <g className="orbit-rev">
      <circle cx="300" cy="300" r="190" stroke="currentColor" strokeWidth="0.75" />
      <path d="M300 110A190 190 0 0 1 490 300" stroke="var(--color-ember)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="490" cy="300" r="5" fill="var(--color-ember)" />
    </g>
    <circle cx="300" cy="300" r="100" stroke="currentColor" strokeWidth="0.75" />
    <circle cx="300" cy="300" r="34" stroke="currentColor" strokeWidth="0.75" />
    <circle cx="300" cy="300" r="9" fill="var(--color-ember)" />
    <line x1="20" y1="300" x2="580" y2="300" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 6" />
    <line x1="300" y1="20" x2="300" y2="580" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 6" />
  </svg>
);

export const Home = () => {
  const navigate = useNavigate();

  const [repoUrl, setRepoUrl] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentRuns, setRecentRuns] = useState([]);

  useEffect(() => {
    let active = true;
    runService
      .getRuns()
      .then((all) => active && setRecentRuns(all.slice(0, 4)))
      .catch(() => {
        // The recent list is optional; the form still works without it.
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAnalyze = async (e) => {
    e?.preventDefault();

    const trimmedUrl = repoUrl.trim();
    const issueNum = Number(issueNumber);

    if (!trimmedUrl) return toast.error("Please provide a GitHub repository URL");
    if (!trimmedUrl.includes("github.com"))
      return toast.error("Repository URL must be a valid GitHub repository");
    if (!issueNumber || Number.isNaN(issueNum) || issueNum <= 0)
      return toast.error("Please provide a valid positive issue number");

    try {
      setLoading(true);
      const data = await runService.createRun({ repoUrl: trimmedUrl, issueNumber: issueNum });
      toast.success("Run started. Opening the live trace.");
      navigate(`/runs/${data.runId}`);
    } catch (err) {
      console.error("[Home] Create run error:", err);
      toast.error(err.response?.data?.message || "Failed to start analysis run.");
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (preset) => {
    setRepoUrl(preset.repo);
    setIssueNumber(String(preset.issue));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <OrbitArt />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-14 px-5 pt-16 pb-24 sm:px-8 sm:pt-24 lg:grid-cols-12 lg:gap-10 lg:pt-28">
            <div className="rise lg:col-span-7" style={{ "--i": 0 }}>
              <p className="eyebrow flex items-center gap-3">
                <span className="h-px w-8 bg-ember" />
                Autonomous issue resolution
              </p>
              <h1 className="mt-7 max-w-3xl font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.98] font-normal text-bone">
                Hand it an issue.
                <br />
                Get back a{" "}
                <em className="font-normal text-ember italic">reviewed</em> patch.
              </h1>
              <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-bone-2">
                Sentra reads your repository, plans the fix, writes the diff and proves it against
                your tests. Nothing reaches GitHub until you approve it.
              </p>

              <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-rule pt-6">
                {[
                  ["Pipeline", "LangGraph, 5 stages"],
                  ["Context", "AST skeleton"],
                  ["Output", "Draft pull request"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="eyebrow">{k}</dt>
                    <dd className="mt-1.5 font-mono text-[13px] text-bone">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Requisition card */}
            <div className="rise lg:col-span-5" style={{ "--i": 2 }}>
              <form onSubmit={handleAnalyze} className="surface-raised space-y-8 p-7 sm:p-9" aria-label="Start a run">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-2xl text-bone">New run</h2>
                  <span className="eyebrow">Form 01</span>
                </div>

                <div className="space-y-6">
                  <label className="block">
                    <span className="eyebrow">Repository</span>
                    <input
                      type="text"
                      disabled={loading}
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo"
                      className="field mt-1"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>

                  <label className="block">
                    <span className="eyebrow">Issue number</span>
                    <input
                      type="number"
                      disabled={loading}
                      value={issueNumber}
                      onChange={(e) => setIssueNumber(e.target.value)}
                      placeholder="28140"
                      className="field mt-1"
                    />
                  </label>
                </div>

                <Button type="submit" size="lg" loading={loading} className="w-full" icon={ArrowRight}>
                  {loading ? "Starting" : "Launch analysis"}
                </Button>

                <div className="space-y-3 border-t border-rule pt-6">
                  <span className="eyebrow">Or try a known issue</span>
                  <ul className="divide-y divide-rule">
                    {PRESET_ISSUES.map((p) => (
                      <li key={p.issue}>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => selectPreset(p)}
                          className="group flex w-full cursor-pointer items-baseline justify-between gap-4 py-2.5 text-left"
                        >
                          <span className="flex items-baseline gap-3 truncate">
                            <span className="font-display text-[17px] text-bone transition-colors group-hover:text-ember">
                              {p.name}
                            </span>
                            <span className="truncate text-[13px] text-bone-3">{p.desc}</span>
                          </span>
                          <span className="font-mono text-[12px] text-bone-3">#{p.issue}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section className="border-y border-rule bg-ink-2/60">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <h2 className="max-w-md font-display text-4xl leading-tight font-light text-bone">
                Five stages, one <em className="text-ember italic">human</em> gate.
              </h2>
              <p className="eyebrow">How a run proceeds</p>
            </div>

            <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5">
              {STAGES.map((s) => (
                <li key={s.n} className="group relative bg-ink p-6 transition-colors duration-300 hover:bg-ink-3 lg:min-h-64">
                  <span className="font-mono text-[11px] tracking-widest text-ember">{s.n}</span>
                  <h3 className="mt-10 font-display text-3xl font-light text-bone">{s.title}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-bone-3 transition-colors group-hover:text-bone-2">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Recent runs */}
        {recentRuns.length > 0 && (
          <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-3xl font-light text-bone">Recent runs</h2>
              <Link
                to="/history"
                className="group inline-flex items-center gap-1 text-[13px] text-bone-3 transition-colors hover:text-ember"
              >
                All history <ArrowUpRight className="link-arrow h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>

            <ul className="mt-8 divide-y divide-rule border-y border-rule">
              {recentRuns.map((run) => (
                <li key={run._id}>
                  <Link
                    to={`/runs/${run._id}`}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-5 transition-colors hover:bg-bone/[0.03] sm:grid-cols-[5rem_1fr_auto_auto] sm:px-3"
                  >
                    <span className="font-mono text-[13px] text-ember sm:col-auto">
                      #{run.issue?.number || run.issueNumber}
                    </span>
                    <span className="col-span-2 row-start-2 truncate font-mono text-[13px] text-bone-2 sm:col-span-1 sm:row-start-auto">
                      {(run.repository?.url || run.repoUrl || "").replace("https://github.com/", "")}
                    </span>
                    <span className="hidden font-mono text-[11px] text-bone-3 sm:block">
                      {formatDate(run.createdAt)}
                    </span>
                    <StatusBadge status={run.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-5 py-8 text-[12px] text-bone-3 sm:flex-row sm:px-8">
          <span className="font-display text-base text-bone-2">Sentra</span>
          <span className="font-mono">Drafts only. You approve every pull request.</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
