import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import {
  LayoutDashboard,
  Plus,
  Clock,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/review/new", label: "New Review", icon: Plus },
  { to: "/history", label: "History", icon: Clock },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const user = useAuthStore((s) => s.user) || { name: "Rishabh", email: "rishabh@example.com" };
  const logout = useAuthStore((s) => s.logout);

  const widthClass = collapsed ? "w-16" : "w-60";

  const initials = useMemo(() => {
    const name = user?.name || "User";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [user]);

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/50 transition-[width] duration-200 ease-out",
        widthClass
      )}
    >
      <div className="flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25">
            <span className="font-mono text-sm">{"</>"}</span>
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-100">CodeReview AI</div>
              <div className="truncate text-xs text-zinc-400">AI Code Assistant</div>
            </div>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <nav className="mt-1 flex-1 px-2">
        <div className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-zinc-300 transition",
                    "hover:bg-zinc-900 hover:text-zinc-50",
                    isActive && "bg-zinc-900 text-zinc-50 border-zinc-800"
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="px-2 pb-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-zinc-950 text-zinc-200 ring-1 ring-zinc-800">
              <span className="text-xs font-semibold">{initials}</span>
            </div>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zinc-100">{user?.name}</div>
                <div className="truncate text-xs text-zinc-400">{user?.email}</div>
              </div>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-300 hover:bg-zinc-950 hover:text-zinc-50"
              onClick={logout}
              aria-label="Logout"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

