import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export default function Settings() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <AppShell
      topbar={({ openMobileNav }) => (
        <TopBar
          onOpenMobileNav={openMobileNav}
          title="Settings"
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Settings" }]}
        />
      )}
    >
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="space-y-1">
          <div className="text-lg font-semibold text-zinc-50">Settings</div>
          <div className="text-sm text-zinc-400">Account and application preferences.</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="text-sm font-semibold text-zinc-100">Theme</div>
            <div className="mt-1 text-sm text-zinc-400">Dark mode is enabled by default.</div>
          </div>
          <div className="flex justify-end">
            <Button variant="destructive" className="rounded-lg" onClick={logout}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

