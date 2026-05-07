import { Badge } from "@/components/ui/badge";

const COLOR_BY_LANG = {
  Python: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  JavaScript: "bg-amber-400/15 text-amber-200 border-amber-400/30",
  TypeScript: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  Java: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  "C++": "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  Go: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Rust: "bg-red-500/15 text-red-300 border-red-500/30",
  SQL: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  PostgreSQL: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  HTML: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  CSS: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

export default function LanguageBadge({ language }) {
  const key = language || "Auto-detect";
  const cls =
    COLOR_BY_LANG[key] || "bg-zinc-800/60 text-zinc-200 border-zinc-700";
  return (
    <Badge className={`border ${cls}`} variant="secondary">
      {key}
    </Badge>
  );
}

