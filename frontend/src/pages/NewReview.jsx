import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Sparkles, Copy, Save } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import CodeEditor from "@/components/code/CodeEditor";
import ScoreRing from "@/components/code/ScoreRing";
import IssueGroup from "@/components/code/IssueGroup";
import { submitCode } from "@/services/api";
import { useReviewStore } from "@/store/reviewStore";

const LANGUAGES = [
  "Auto-detect",
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "SQL",
  "PostgreSQL",
  "HTML",
  "CSS",
  "Bash",
  "PowerShell",
  "Ruby",
  "PHP",
  "Kotlin",
  "Swift",
  "Dart",
  "R",
  "YAML",
  "JSON",
];

function toMonacoLanguage(label) {
  const m = {
    "Auto-detect": "plaintext",
    Python: "python",
    JavaScript: "javascript",
    TypeScript: "typescript",
    Java: "java",
    "C++": "cpp",
    "C#": "csharp",
    Go: "go",
    Rust: "rust",
    SQL: "sql",
    PostgreSQL: "sql",
    HTML: "html",
    CSS: "css",
    Bash: "shell",
    PowerShell: "powershell",
    Ruby: "ruby",
    PHP: "php",
    Kotlin: "kotlin",
    Swift: "swift",
    Dart: "dart",
    R: "r",
    YAML: "yaml",
    JSON: "json",
  };
  return m[label] || "plaintext";
}

function groupBySeverity(issues) {
  const groups = { High: [], Medium: [], Low: [] };
  for (const issue of issues || []) {
    const s = issue?.severity || issue?.level || "Medium";
    const key =
      s.toString().toLowerCase().startsWith("h") ? "High" : s.toString().toLowerCase().startsWith("l") ? "Low" : "Medium";
    groups[key].push({
      ...issue,
      severity: key,
      category: issue?.category || issue?.review_type || "Style",
      line: issue?.line ?? issue?.line_number ?? null,
      message: issue?.message || issue?.description || issue?.title || "Issue detected.",
      title: issue?.title || issue?.issue_type || issue?.category || "Issue",
      suggestedFixCode: issue?.code_example || issue?.suggested_fix || issue?.suggestedFixCode,
    });
  }
  return groups;
}

export default function NewReview() {
  const currentReview = useReviewStore((s) => s.currentReview);
  const isAnalyzing = useReviewStore((s) => s.isAnalyzing);
  const setReview = useReviewStore((s) => s.setReview);
  const clearReview = useReviewStore((s) => s.clearReview);
  const setAnalyzing = useReviewStore((s) => s.setAnalyzing);

  const [language, setLanguage] = useState("Auto-detect");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);

  const charCount = code.length;
  const maxChars = 10_000;

  const results = currentReview;
  const score = results?.score ?? results?.overall_score ?? 0;
  const summary = results?.summary || "—";
  const issues = results?.issues || results?.review_issues || [];

  const grouped = useMemo(() => groupBySeverity(issues), [issues]);

  const analyze = async () => {
    if (!code.trim()) {
      toast.error("Paste some code first.");
      return;
    }
    if (charCount > maxChars) {
      toast.error("Max 10,000 characters.");
      return;
    }

    setError(null);
    setAnalyzing(true);
    clearReview();
    try {
      const data = await submitCode({ code, language: language === "Auto-detect" ? "" : language });
      setReview(data);
    } catch (e) {
      setError(e);
      // Provide a realistic fallback so the UI never goes blank.
      setReview({
        score: 78,
        summary:
          "The code is generally solid, but there are a few correctness and style issues that could cause edge-case failures. Consider tightening validation and handling nullish values.",
        issues: [
          {
            id: 1,
            severity: "High",
            category: "Bug",
            line: 24,
            title: "Potential null dereference",
            description: "A value is used without checking for null/undefined.",
            code_example: "if (!user) return;\nconst name = user.name ?? 'Unknown';",
          },
          {
            id: 2,
            severity: "Medium",
            category: "Performance",
            line: 51,
            title: "Unnecessary re-render",
            description: "A function is recreated on every render.",
            code_example: "const onClick = useCallback(() => { /* ... */ }, []);",
          },
          {
            id: 3,
            severity: "Low",
            category: "Style",
            line: 9,
            title: "Prefer early returns",
            description: "Reducing nesting improves readability.",
            code_example: "if (!items.length) return null;\n// ...",
          },
        ],
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppShell
      topbar={({ openMobileNav }) => (
        <TopBar
          onOpenMobileNav={openMobileNav}
          title="New Review"
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "New Review" },
          ]}
          actions={
            <Button
              variant="secondary"
              className="border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
              onClick={() => {
                clearReview();
                setCode("");
                toast.success("Cleared.");
              }}
            >
              Clear
            </Button>
          }
        />
      )}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="space-y-2">
              <div className="text-lg font-semibold text-zinc-50">Code Input</div>
              <div className="text-sm text-zinc-400">Paste code and choose a language.</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-zinc-300">Language</div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="rounded-lg border-zinc-800 bg-zinc-950">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <CodeEditor
                value={code}
                onChange={setCode}
                language={toMonacoLanguage(language)}
                minHeight={440}
              />

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-mono">
                  {charCount.toLocaleString()} chars
                </span>
                <span>Max 10,000 characters</span>
              </div>

              <Button
                onClick={analyze}
                disabled={isAnalyzing}
                className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-violet-500/25 shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-4" />
                    Analyze Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="space-y-1">
              <div className="text-lg font-semibold text-zinc-50">Results</div>
              <div className="text-sm text-zinc-400">Your review results will appear here.</div>
            </CardHeader>
            <CardContent>
              {error ? (
                <ErrorState
                  title="Couldn’t analyze code"
                  description="We’re showing a realistic placeholder result so you can review the UI. Fix your API and retry anytime."
                  onRetry={analyze}
                />
              ) : null}

              <AnimatePresence mode="wait">
                {!results ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <EmptyState
                      className="border-dashed"
                      title="Your review results will appear here"
                      description="Run an analysis to see score, summary, and issues grouped by severity."
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="space-y-4"
                  >
                    <Card className="border-zinc-800 bg-zinc-950/40">
                      <CardContent className="p-6">
                        <ScoreRing score={score} />
                      </CardContent>
                    </Card>

                    <Card className="border-zinc-800 bg-zinc-950/40">
                      <CardHeader className="space-y-1">
                        <div className="text-sm font-semibold text-zinc-100">Summary</div>
                        <div className="text-xs text-zinc-500">AI-generated overview</div>
                      </CardHeader>
                      <CardContent className="text-sm text-zinc-300">{summary}</CardContent>
                    </Card>

                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.05 } },
                      }}
                    >
                      <IssueGroup groups={grouped} />
                    </motion.div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="rounded-lg bg-violet-600 hover:bg-violet-500 shadow-violet-500/25 shadow-lg"
                        onClick={() => toast.success("Saved (placeholder).")}
                      >
                        <Save className="mr-2 size-4" />
                        Save Review
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                        onClick={async () => {
                          const report = JSON.stringify(results, null, 2);
                          await navigator.clipboard.writeText(report);
                          toast.success("Copied report to clipboard.");
                        }}
                      >
                        <Copy className="mr-2 size-4" />
                        Copy Report
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

