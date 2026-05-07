import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, History as HistoryIcon } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import LanguageBadge from "@/components/shared/LanguageBadge";
import { getReviews } from "@/services/api";

function scoreBadge(score) {
  if (score < 40) return "border-red-500/30 bg-red-500/15 text-red-300";
  if (score <= 70) return "border-amber-400/30 bg-amber-400/15 text-amber-200";
  return "border-emerald-400/30 bg-emerald-400/15 text-emerald-200";
}

export default function History() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [scoreRange, setScoreRange] = useState("All");

  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = async () => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await getReviews({ page });
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e, data: null });
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const raw = useMemo(() => {
    const d = state.data;
    return Array.isArray(d) ? { results: d, count: d.length } : d || { results: [], count: 0 };
  }, [state.data]);

  const items = raw.results || raw.reviews || [];
  const count = raw.count ?? items.length;
  const pageSize = raw.page_size || 10;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const lang = (r.language || "").toString();
      const created = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";
      const hay = `${lang} ${created}`.toLowerCase();

      if (q && !hay.includes(q)) return false;
      if (language !== "All" && lang !== language) return false;

      const score = r.score ?? r.overall_score ?? 0;
      if (scoreRange === "0-39" && !(score < 40)) return false;
      if (scoreRange === "40-70" && !(score >= 40 && score <= 70)) return false;
      if (scoreRange === "71-100" && !(score > 70)) return false;

      if (severity !== "All") {
        const issues = r.issues || [];
        const has = issues.some((i) => (i.severity || "").toString().toLowerCase().startsWith(severity[0].toLowerCase()));
        if (!has) return false;
      }

      return true;
    });
  }, [items, query, language, severity, scoreRange]);

  const languages = useMemo(() => {
    const set = new Set(items.map((r) => r.language).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  return (
    <AppShell
      topbar={({ openMobileNav }) => (
        <TopBar
          onOpenMobileNav={openMobileNav}
          title="History"
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "History" }]}
        />
      )}
    >
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="space-y-1">
          <div className="text-lg font-semibold text-zinc-50">Review History</div>
          <div className="text-sm text-zinc-400">Search, filter, and open any previous review.</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 size-4 text-zinc-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by language or date…"
                className="pl-9 rounded-lg border-zinc-800 bg-zinc-950"
              />
            </div>

            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="rounded-lg border-zinc-800 bg-zinc-950">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                {languages.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="rounded-lg border-zinc-800 bg-zinc-950">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                  {["All", "High", "Medium", "Low"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={scoreRange} onValueChange={setScoreRange}>
                <SelectTrigger className="rounded-lg border-zinc-800 bg-zinc-950">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                  {[
                    { v: "All", l: "All scores" },
                    { v: "0-39", l: "0–39" },
                    { v: "40-70", l: "40–70" },
                    { v: "71-100", l: "71–100" },
                  ].map((o) => (
                    <SelectItem key={o.v} value={o.v}>
                      {o.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {state.error ? (
            <ErrorState
              title="Couldn’t load history"
              description="Check your API and try again."
              onRetry={load}
            />
          ) : state.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl border border-zinc-800 bg-zinc-950/30 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No reviews match your filters"
              description="Try adjusting search or filters, or run a new review."
              action={
                <Button
                  className="rounded-lg bg-violet-600 hover:bg-violet-500 shadow-violet-500/25 shadow-lg"
                  onClick={() => navigate("/review/new")}
                >
                  New review
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead>Language</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => {
                      const id = r.id ?? r.review_id ?? r.pk;
                      const score = r.score ?? r.overall_score ?? 0;
                      const issues = r.issues_count ?? r.issues?.length ?? 0;
                      return (
                        <TableRow
                          key={id}
                          className="border-zinc-800 cursor-pointer hover:bg-zinc-950/40"
                          onClick={() => navigate(`/review/${id}`)}
                        >
                          <TableCell>
                            <LanguageBadge language={r.language || "Auto-detect"} />
                          </TableCell>
                          <TableCell>
                            <Badge className={`border ${scoreBadge(score)} font-mono`} variant="secondary">
                              {score}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-zinc-200">{issues}</TableCell>
                          <TableCell className="text-sm text-zinc-400">
                            {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  Page <span className="font-mono text-zinc-300">{page}</span> of{" "}
                  <span className="font-mono text-zinc-300">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    className="border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

