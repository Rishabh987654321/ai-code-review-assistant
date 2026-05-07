import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function GitHubRepos() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [githubAccounts, setGithubAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [importing, setImporting] = useState({});
  const [importedRepos, setImportedRepos] = useState([]);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    checkGitHubConnection();
    fetchImportedRepos();
  }, []);

  const fetchImportedRepos = async () => {
    try {
      const res = await api.get("/api/repositories/");
      const repos = res.data.results || res.data;
      setImportedRepos(repos);
    } catch (err) {
      console.error("Failed to fetch imported repos:", err);
    }
  };

  const checkGitHubConnection = async () => {
    try {
      const res = await api.get("/api/auth/github/status/");
      setGithubConnected(res.data.connected);
      if (res.data.connected && res.data.accounts) {
        setGithubAccounts(res.data.accounts);
        // Select first account by default
        if (res.data.accounts.length > 0) {
          setSelectedAccount(res.data.accounts[0].uid);
          fetchRepos(res.data.accounts[0].uid);
        }
      }
    } catch (err) {
      console.error("Failed to check GitHub connection:", err);
    } finally {
      setChecking(false);
    }
  };

  const fetchRepos = async (githubUid = null) => {
    try {
      setLoading(true);
      const uid = githubUid || selectedAccount;
      const url = uid 
        ? `/api/auth/github/repos/?github_uid=${uid}`
        : "/api/auth/github/repos/";
      const res = await api.get(url);
      setRepos(res.data);
    } catch (err) {
      if (err.response?.status === 400) {
        setGithubConnected(false);
        toast.error("GitHub account not connected. Please connect your GitHub account.");
      } else {
        toast.error("Failed to load repositories");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (uid) => {
    setSelectedAccount(uid);
    fetchRepos(uid);
  };

  const handleConnectGitHub = () => {
    // Redirect to GitHub OAuth with connect parameter
    window.location.href = `${apiBaseUrl}/accounts/github/login/?process=connect`;
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleImportRepo = async (repo) => {
    try {
      setImporting({ ...importing, [repo.id]: true });
      
      const payload = {
        github_uid: selectedAccount,
        repo_id: repo.id.toString(),
        owner: repo.owner?.login || repo.full_name.split('/')[0],
        name: repo.name,
        branch: repo.default_branch || "main"
      };

      const res = await api.post("/api/repositories/import/", payload);
      
      toast.success(
        res.data.message || "Repository imported successfully!"
      );
      
      // Refresh imported repos list
      await fetchImportedRepos();
      
      // Optionally navigate to imported repos page
      // navigate("/repositories");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to import repository";
      toast.error(errorMsg);
      console.error("Import error:", err);
    } finally {
      setImporting({ ...importing, [repo.id]: false });
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">GitHub Repositories</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              Back
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {!githubConnected ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Connect Your GitHub Account</h2>
            <p className="text-gray-600 mb-6">
              Connect your GitHub account to access your repositories and review code.
            </p>
            <button
              onClick={handleConnectGitHub}
              className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition flex items-center gap-2 mx-auto"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Connect GitHub
            </button>
          </div>
        ) : (
          <>
            {githubAccounts.length > 1 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium mb-2">Select GitHub Account:</label>
                <select
                  value={selectedAccount || ""}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className="border p-2 rounded w-full max-w-md"
                >
                  {githubAccounts.map((acc) => (
                    <option key={acc.uid} value={acc.uid}>
                      {acc.username} {acc.email ? `(${acc.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">Your GitHub repositories</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/repositories")}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
                >
                  View Imported Repos
                </button>
                <button
                  onClick={() => fetchRepos()}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {loading && repos.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading repositories...</p>
              </div>
            ) : repos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No repositories found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repos.map((repo) => {
                  // Check if repo is already imported
                  const isImported = importedRepos.some(
                    (imported) => imported.repo_id === repo.id.toString()
                  );
                  const importedRepo = importedRepos.find(
                    (imported) => imported.repo_id === repo.id.toString()
                  );

                  const handleCardClick = () => {
                    if (isImported && importedRepo) {
                      // Navigate to repository reviews page
                      navigate(`/repositories/${importedRepo.id}/reviews`);
                    } else {
                      // Show message or auto-import
                      toast("Repository not imported yet. Click 'Import' to add it.", {
                        icon: "ℹ️",
                      });
                    }
                  };

                  return (
                  <div
                    key={repo.id}
                    onClick={handleCardClick}
                    className={`border rounded-lg p-4 hover:shadow-md transition cursor-pointer ${
                      isImported ? "border-green-300 bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{repo.name}</h3>
                          {isImported && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              ✓ Imported
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{repo.full_name}</p>
                      </div>
                      {repo.private && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Private
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                          {repo.language}
                        </span>
                      )}
                      <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View on GitHub →
                      </a>
                      {isImported ? (
                        <button
                          onClick={() => navigate(`/repositories/${importedRepo.id}/reviews`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Repository →
                        </button>
                      ) : (
                        <button
                          onClick={() => handleImportRepo(repo)}
                          disabled={importing[repo.id]}
                          className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {importing[repo.id] ? "Importing..." : "Import →"}
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

