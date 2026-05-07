import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isBootstrapped) bootstrap();
  }, [isBootstrapped, bootstrap]);

  if (!isBootstrapped) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="h-8 w-48 rounded-lg bg-zinc-900 animate-pulse" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="h-40 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
            <div className="h-40 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}

