import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function SkeletonCard({ className }) {
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900 p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-1/3 bg-zinc-800" />
          <Skeleton className="h-4 w-5/6 bg-zinc-800" />
          <Skeleton className="h-4 w-2/3 bg-zinc-800" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl bg-zinc-800" />
      </div>
    </div>
  );
}

