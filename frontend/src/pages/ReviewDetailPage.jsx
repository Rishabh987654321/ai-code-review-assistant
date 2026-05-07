import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Copy, Trash2 } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import CodeEditor from "@/components/code/CodeEditor";
import ScoreRing from "@/components/code/ScoreRing";
import IssueGroup from "@/components/code/IssueGroup";
import { deleteReview, getReview } from "@/services/api";

function groupBySeverity(issues) {
  const groups = { High: [], Medium: [], Low: [] };
  for (const issue of issues || []) {
    const s = issue?.severity || issue?.level || "Medium";
    const key =
      s.toString().toLowerCase().startsWith("h")
        ? "High"
        : s.toString().toLowerCase().startsWith("l")
        ? "Low"
        : "Medium";
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

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = async () => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await getReview(id);
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e, data: null });
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const review = state.data;
  const code = review?.code || review?.submitted_code || "";
  const language = review?.language || "plaintext";
  const score = review?.score ?? review?.overall_score ?? 0;
  const summary = review?.summary || "—";
  const issues = review?.issues || review?.review_issues || [];

  const grouped = useMemo(() => groupBySeverity(issues), [issues]);

  return (
    <AppShell
      topbar={({ openMobileNav }) => (
        <TopBar
          onOpenMobileNav={openMobileNav}
          title={`Review #${id}`}
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Reviews", to: "/history" },
            { label: `Review #${id}` },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                onClick={async () => {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied.");
                }}
              >
                <Copy className="mr-2 size-4" />
                Share
              </Button>
              <Button
                variant="destructive"
                className="rounded-lg"
                onClick={async () => {
                  if (!confirm("Delete this review?")) return;
                  try {
                    await deleteReview(id);
                    toast.success("Deleted.");
                    navigate("/history");
                  } catch {
                    toast.error("Delete failed.");
                  }
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </div>
          }
        />
      )}
    >
      {state.loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[520px] rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
          <div className="space-y-4">
            <div className="h-44 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
            <div className="h-32 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
            <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
          </div>
        </div>
      ) : state.error ? (
        <ErrorState
          title="Couldn’t load review"
          description="This review may not exist, or the API URL is misconfigured."
          onRetry={load}
        />
      ) : !review ? (
        <EmptyState title="Review not found" description="Try going back to history." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader className="space-y-1">
              <div className="text-lg font-semibold text-zinc-50">Submitted code</div>
              <div className="text-sm text-zinc-400">Read-only view of the original input.</div>
            </CardHeader>
            <CardContent>
              {code ? (
                <CodeEditor value={code} language={language} readOnly minHeight={520} />
              ) : (
                <EmptyState
                  title="No code payload found"
                  description="The backend response didn’t include the original submitted code."
                />
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-6">
                <ScoreRing score={score} />
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="space-y-1">
                <div className="text-sm font-semibold text-zinc-100">Summary</div>
                <div className="text-xs text-zinc-500">AI-generated overview</div>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300">{summary}</CardContent>
            </Card>

            <IssueGroup groups={grouped} />
          </div>
        </div>
      )}
    </AppShell>
  );
}

