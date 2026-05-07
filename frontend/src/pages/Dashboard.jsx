import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Sparkles, FileText, Bug, Gauge, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import SkeletonCard from "@/components/shared/SkeletonCard";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import LanguageBadge from "@/components/shared/LanguageBadge";
import { getReviews } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

function scoreBadge(score) {
  if (score < 40) return "border-red-500/30 bg-red-500/15 text-red-300";
  if (score <= 70) return "border-amber-400/30 bg-amber-400/15 text-amber-200";
  return "border-emerald-400/30 bg-emerald-400/15 text-emerald-200";
}

function trend(delta) {
  if (delta >= 0) return { Icon: ArrowUpRight, cls: "text-emerald-300" };
  return { Icon: ArrowDownRight, cls: "text-red-300" };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user) || { name: "Rishabh" };

  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = async () => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await getReviews();
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e, data: null });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const { greeting, dateLabel } = useMemo(() => {
    const h = new Date().getHours();
    const greeting =
      h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    const dateLabel = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return { greeting, dateLabel };
  }, []);

  const reviews = useMemo(() => {
    const d = state.data;
    const list = Array.isArray(d) ? d : d?.results || d?.reviews || [];
    return list;
  }, [state.data]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const issues = reviews.reduce((acc, r) => acc + (r.issues_count ?? r.issues?.length ?? 0), 0);
    const scores = reviews
      .map((r) => r.score ?? r.overall_score ?? null)
      .filter((v) => typeof v === "number");
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const langs = new Set(reviews.map((r) => r.language).filter(Boolean));
    return [
      { label: "Total Reviews", value: total, icon: FileText, delta: +12 },
      { label: "Issues Found", value: issues, icon: Bug, delta: -4 },
      { label: "Avg Score", value: avg, icon: Gauge, delta: +3 },
      { label: "Languages Used", value: langs.size, icon: Braces, delta: +1 },
    ];
  }, [reviews]);

  return (
    <AppShell
      topbar={({ openMobileNav }) => (
        <TopBar
          onOpenMobileNav={openMobileNav}
          title="Dashboard"
          breadcrumbs={[{ label: "Dashboard" }]}
        />
      )}
    >
      <div className="space-y-6">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="space-y-1">
            <div className="text-sm text-zinc-400">{dateLabel}</div>
            <div className="text-2xl font-semibold text-zinc-50">
              {greeting}, {user?.name}{" "}
              <span className="text-zinc-300">👋</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {state.loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} className="h-[120px]" />
                  ))
                : stats.map((s) => {
                    const Icon = s.icon;
                    const t = trend(s.delta);
                    return (
                      <Card key={s.label} className="border-zinc-800 bg-zinc-950/40">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="text-xs text-zinc-400">{s.label}</div>
                              <div className="text-2xl font-semibold text-zinc-50">{s.value}</div>
                              <div className="flex items-center gap-1 text-xs">
                                <t.Icon className={`size-3 ${t.cls}`} />
                                <span className="text-zinc-400">
                                  {Math.abs(s.delta)}% this week
                                </span>
                              </div>
                            </div>
                            <div className="grid size-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200">
                              <Icon className="size-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900 lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-zinc-50">Recent Reviews</div>
                <div className="text-sm text-zinc-400">Latest analyses from your workspace.</div>
              </div>
              <Button
                className="rounded-lg bg-violet-600 hover:bg-violet-500 shadow-violet-500/25 shadow-lg"
                onClick={() => navigate("/review/new")}
              >
                <Sparkles className="mr-2 size-4" />
                New Review
              </Button>
            </CardHeader>
            <CardContent>
              {state.error ? (
                <ErrorState
                  title="Couldn’t load review history"
                  description="Check your API URL and backend server, then retry."
                  onRetry={load}
                />
              ) : state.loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
                      <div className="h-4 w-28 rounded bg-zinc-800 animate-pulse" />
                      <div className="mt-2 h-3 w-5/6 rounded bg-zinc-800 animate-pulse" />
                      <div className="mt-2 h-3 w-2/3 rounded bg-zinc-800 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No reviews yet"
                  description="Start a new code review and your history will show up here."
                  action={
                    <Button
                      className="rounded-lg bg-violet-600 hover:bg-violet-500 shadow-violet-500/25 shadow-lg"
                      onClick={() => navigate("/review/new")}
                    >
                      Start a new review
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead>Language</TableHead>
                        <TableHead>Snippet</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.slice(0, 8).map((r) => {
                        const id = r.id ?? r.review_id ?? r.pk;
                        const score = r.score ?? r.overall_score ?? 0;
                        const issues = r.issues_count ?? r.issues?.length ?? 0;
                        const snippet = (r.snippet || r.code || r.summary || "").toString().slice(0, 80);
                        return (
                          <TableRow key={id} className="border-zinc-800">
                            <TableCell>
                              <LanguageBadge language={r.language || "Auto-detect"} />
                            </TableCell>
                            <TableCell className="max-w-[360px]">
                              <div className="truncate font-mono text-xs text-zinc-300">
                                {snippet || "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`border ${scoreBadge(score)} font-mono`} variant="secondary">
                                {score}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-zinc-200">{issues}</TableCell>
                            <TableCell className="text-sm text-zinc-400">
                              {r.created_at
                                ? new Date(r.created_at).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="secondary"
                                className="border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                                onClick={() => {
                                  if (!id) {
                                    toast.error("Missing review id.");
                                    return;
                                  }
                                  navigate(`/review/${id}`);
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <div className="text-lg font-semibold text-zinc-50">Quick action</div>
              <div className="text-sm text-zinc-400">Start a new code review.</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/30 p-6">
                <div className="text-sm font-semibold text-zinc-100">Start a new code review</div>
                <div className="mt-1 text-sm text-zinc-400">
                  Paste code, pick a language, and get a scored report with suggestions.
                </div>
              </div>
              <Button
                className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 shadow-violet-500/25 shadow-lg"
                onClick={() => navigate("/review/new")}
              >
                <Sparkles className="mr-2 size-4" />
                Analyze code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

