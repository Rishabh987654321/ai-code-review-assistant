import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorState({ title = "Something went wrong", description, onRetry, className }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-950 text-amber-300">
          <AlertTriangle className="size-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{title}</div>
          {description ? <div className="mt-1 text-sm text-zinc-400">{description}</div> : null}
          {onRetry ? (
            <div className="mt-4">
              <Button
                variant="secondary"
                className="border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                onClick={onRetry}
              >
                <RefreshCw className="mr-2 size-4" />
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

