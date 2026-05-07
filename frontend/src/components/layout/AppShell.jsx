import { useMemo, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Sidebar from "@/components/layout/Sidebar";
import { LayoutDashboard, Plus, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/review/new", label: "New Review", icon: Plus },
  { to: "/history", label: "History", icon: Clock },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ topbar, children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel = useMemo(() => {
    const found = NAV.find((n) => location.pathname.startsWith(n.to));
    return found?.label || "CodeReview AI";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="w-[92vw] max-w-sm rounded-xl border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
          <div className="border-b border-zinc-800 px-4 py-4">
            <div className="text-sm font-semibold">{currentLabel}</div>
            <div className="text-xs text-zinc-400">Navigation</div>
          </div>
          <div className="p-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300",
                      "hover:bg-zinc-900 hover:text-zinc-50",
                      isActive && "bg-zinc-900 text-zinc-50 border border-zinc-800"
                    )
                  }
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <div className={cn("md:pl-16", !collapsed && "md:pl-60", "transition-[padding] duration-200 ease-out")}>
        {topbar({ openMobileNav: () => setMobileOpen(true) })}
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}

