import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Code2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES = {
  High: "border-l-red-500",
  Medium: "border-l-amber-400",
  Low: "border-l-emerald-400",
};

const SEVERITY_BADGE = {
  High: "bg-red-500/15 text-red-300 border-red-500/30",
  Medium: "bg-amber-400/15 text-amber-200 border-amber-400/30",
  Low: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
};

export default function IssueCard({ issue, className }) {
  const [open, setOpen] = useState(false);

  const severity = issue?.severity || "Medium";
  const category = issue?.category || "Style";
  const line = issue?.line ?? issue?.line_number ?? null;

  const border = useMemo(() => SEVERITY_STYLES[severity] || "border-l-zinc-700", [severity]);
  const sevBadge = useMemo(
    () => SEVERITY_BADGE[severity] || "bg-zinc-800 text-zinc-200 border-zinc-700",
    [severity]
  );

  return (
    <Card className={cn("border border-zinc-800 bg-zinc-900", className)}>
      <div className={cn("border-l-4", border)}>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border", sevBadge)} variant="secondary">
              {severity}
            </Badge>
            <Badge className="border border-zinc-700 bg-zinc-800/60 text-zinc-200" variant="secondary">
              {category}
            </Badge>
            {line ? (
              <Badge className="border border-zinc-800 bg-zinc-950 text-zinc-200 font-mono" variant="secondary">
                Line {line}
              </Badge>
            ) : null}
          </div>
          <div className="text-sm font-semibold text-zinc-100">{issue?.title || "Issue"}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-zinc-300">{issue?.message || issue?.description}</div>

          {issue?.suggestedFix ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Sparkles className="size-4 text-violet-300" />
                Suggested Fix
              </div>
              <div className="mt-2 font-mono text-xs text-zinc-100 whitespace-pre-wrap">
                {issue.suggestedFix}
              </div>
            </div>
          ) : null}

          {issue?.fixCode ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Code2 className="size-4 text-zinc-200" />
                Code
              </div>
              <pre className="mt-2 overflow-x-auto font-mono text-xs text-zinc-100">
                {issue.fixCode}
              </pre>
            </div>
          ) : null}

          {issue?.suggestedFixCode ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-zinc-400">Suggested Fix</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50"
                  onClick={() => setOpen((v) => !v)}
                >
                  {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
              </div>
              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-200",
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-80"
                )}
              >
                <div className="overflow-hidden">
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-xs text-zinc-100">
                    {issue.suggestedFixCode}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </div>
    </Card>
  );
}

