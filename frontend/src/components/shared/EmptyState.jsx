import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, title, description, className, action }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 p-10 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 grid size-12 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200">
          <Icon className="size-6" />
        </div>
      ) : null}
      {title ? <div className="text-base font-semibold text-zinc-100">{title}</div> : null}
      {description ? (
        <div className="mt-2 max-w-md text-sm text-zinc-400">{description}</div>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

