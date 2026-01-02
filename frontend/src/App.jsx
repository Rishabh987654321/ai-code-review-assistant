import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useContext } from "react";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import SubmitCode from "./pages/SubmitCode";
import Profile from "./pages/Profile";
import GitHubRepos from "./pages/GitHubRepos";
import ImportedRepos from "./pages/ImportedRepos";
import ConnectedAccounts from "./pages/ConnectedAccounts";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { AuthContext } from "./context/AuthContext";

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
      <Routes>
        {/* Public routes - redirect to home if already logged in */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />

        {/* Protected routes - requires authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SubmitCode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/github"
          element={
            <ProtectedRoute>
              <GitHubRepos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/repositories"
          element={
            <ProtectedRoute>
              <ImportedRepos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connected-accounts"
          element={
            <ProtectedRoute>
              <ConnectedAccounts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/github/callback"
          element={<GitHubCallback />}
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
