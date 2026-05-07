import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import NewReview from "@/pages/NewReview";
import ReviewDetailPage from "@/pages/ReviewDetailPage";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import PageTransition from "@/components/layout/PageTransition";

// Component to handle GitHub OAuth callback
function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");
    const fromConnect = searchParams.get("from_connect");

    if (access && refresh) {
      // Store tokens from GitHub OAuth callback
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      
      // If this was a connect flow, redirect to GitHub page
      if (fromConnect === "true") {
        navigate("/github");
      } else {
        navigate("/");
      }
    } else {
      // Check if this is a connect flow (user already logged in)
      // In this case, allauth redirects directly without tokens
      const isConnectFlow = window.location.href.includes("process=connect");
      if (isConnectFlow) {
        // User is already authenticated, just redirect to GitHub page
        navigate("/github");
      } else {
        // If no tokens, redirect to login
        navigate("/login");
      }
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing GitHub login...</p>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Navigate to="/dashboard" replace />
          }
        />

        {/* Backwards compatible routes */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />

        <Route
          path="/auth"
          element={
            <ErrorBoundary title="Auth failed">
              <PageTransition>
                <Auth />
              </PageTransition>
            </ErrorBoundary>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ErrorBoundary title="Dashboard failed">
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/review/new"
          element={
            <ProtectedRoute>
              <ErrorBoundary title="New review failed">
                <PageTransition>
                  <NewReview />
                </PageTransition>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/review/:id"
          element={
            <ProtectedRoute>
              <ErrorBoundary title="Review failed">
                <PageTransition>
                  <ReviewDetailPage />
                </PageTransition>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <ErrorBoundary title="History failed">
                <PageTransition>
                  <History />
                </PageTransition>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ErrorBoundary title="Settings failed">
                <PageTransition>
                  <Settings />
                </PageTransition>
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* Legacy support: keep GitHub callback route for existing backend OAuth */}
        <Route path="/github/callback" element={<GitHubCallback />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
