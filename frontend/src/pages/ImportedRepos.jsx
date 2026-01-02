import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ImportedRepos() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState({});

  useEffect(() => {
    fetchImportedRepos();
  }, []);

  const fetchImportedRepos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/repositories/");
      setRepositories(res.data.results || res.data);
    } catch (err) {
      toast.error("Failed to load imported repositories");
      console.error("Error fetching repositories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (repoId) => {
    try {
      setSyncing({ ...syncing, [repoId]: true });
      const res = await api.post(`/api/repositories/${repoId}/sync/`);
      toast.success(res.data.message || "Repository synced successfully");
      // Refresh the list
      fetchImportedRepos();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to sync repository";
      toast.error(errorMsg);
    } finally {
      setSyncing({ ...syncing, [repoId]: false });
    }
  };

  const handleDelete = async (repoId) => {
    if (!window.confirm("Are you sure you want to remove this repository?")) {
      return;
    }

    try {
      await api.delete(`/api/repositories/${repoId}/`);
      toast.success("Repository removed successfully");
      fetchImportedRepos();
    } catch (err) {
      toast.error("Failed to remove repository");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "syncing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Imported Repositories</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/github")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Import More
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              Home
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {loading && repositories.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading repositories...</p>
          </div>
        ) : repositories.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No Repositories Imported</h2>
            <p className="text-gray-600 mb-6">
              Import repositories from GitHub to start reviewing code.
            </p>
            <button
              onClick={() => navigate("/github")}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
            >
              Go to GitHub Repos
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{repo.name}</h3>
                      {repo.private && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Private
                        </span>
                      )}
                      {repo.sync_status && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${getStatusColor(
                            repo.sync_status.status
                          )}`}
                        >
                          {repo.sync_status.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{repo.full_name}</p>
                    {repo.description && (
                      <p className="text-sm text-gray-600 mb-2">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                          {repo.language}
                        </span>
                      )}
                      <span>Branch: {repo.default_branch}</span>
                      {repo.sync_status?.last_synced && (
                        <span>
                          Last synced:{" "}
                          {new Date(repo.sync_status.last_synced).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {repo.sync_status?.last_sync_error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        Error: {repo.sync_status.last_sync_error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleSync(repo.id)}
                    disabled={syncing[repo.id]}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {syncing[repo.id] ? "Syncing..." : "Sync"}
                  </button>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition text-sm"
                  >
                    View on GitHub
                  </a>
                  <button
                    onClick={() => handleDelete(repo.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

