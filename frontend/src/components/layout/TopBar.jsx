import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TopBar({ title, breadcrumbs = [], onOpenMobileNav, actions, className }) {
  return (
    <header className={cn("sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur", className)}>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-zinc-200 hover:bg-zinc-900"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>

        <div className="min-w-0 flex-1">
          {breadcrumbs?.length ? (
            <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              {breadcrumbs.map((b, idx) => (
                <span key={idx} className="flex items-center gap-2">
                  {b.to ? (
                    <Link className="hover:text-zinc-200 transition" to={b.to}>
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-zinc-300">{b.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 ? <span className="text-zinc-600">/</span> : null}
                </span>
              ))}
            </nav>
          ) : null}
          {title ? <div className="mt-1 truncate text-lg font-semibold text-zinc-50">{title}</div> : null}
        </div>

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

