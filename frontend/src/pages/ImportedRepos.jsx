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
  const [reviewing, setReviewing] = useState({});
  const [showReviewModal, setShowReviewModal] = useState({});
  const [reviewTypes, setReviewTypes] = useState({});
  const [branches, setBranches] = useState({});
  const [loadingBranches, setLoadingBranches] = useState({});
  const [updatingBranch, setUpdatingBranch] = useState({});

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

  const fetchBranches = async (repoId) => {
    try {
      setLoadingBranches({ ...loadingBranches, [repoId]: true });
      const res = await api.get(`/api/repositories/${repoId}/branches/`);
      setBranches({ ...branches, [repoId]: res.data.branches });
    } catch (err) {
      toast.error("Failed to load branches");
    } finally {
      setLoadingBranches({ ...loadingBranches, [repoId]: false });
    }
  };

  const handleUpdateBranch = async (repoId, branchName) => {
    try {
      setUpdatingBranch({ ...updatingBranch, [repoId]: true });
      const res = await api.patch(`/api/repositories/${repoId}/update_branch/`, {
        branch: branchName
      });
      toast.success(res.data.message || `Now tracking branch: ${branchName}`);
      // Refresh the list
      fetchImportedRepos();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update branch";
      toast.error(errorMsg);
    } finally {
      setUpdatingBranch({ ...updatingBranch, [repoId]: false });
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

  const handleStartReview = async (repoId) => {
    const types = reviewTypes[repoId] || [];
    if (types.length === 0) {
      toast.error("Please select at least one review type");
      return;
    }

    try {
      setReviewing({ ...reviewing, [repoId]: true });
      const res = await api.post(`/api/repositories/${repoId}/review/`, {
        review_types: types,
      });
      
      toast.success(res.data.message || "Review started! Check back in a few moments.");
      setShowReviewModal({ ...showReviewModal, [repoId]: false });
      setReviewTypes({ ...reviewTypes, [repoId]: [] });
      fetchImportedRepos(); // Refresh to show new reviews
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to start review";
      toast.error(errorMsg);
    } finally {
      setReviewing({ ...reviewing, [repoId]: false });
    }
  };

  const toggleReviewType = (repoId, type) => {
    const current = reviewTypes[repoId] || [];
    if (current.includes(type)) {
      setReviewTypes({ ...reviewTypes, [repoId]: current.filter((t) => t !== type) });
    } else {
      setReviewTypes({ ...reviewTypes, [repoId]: [...current, type] });
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
                onClick={() => navigate(`/repositories/${repo.id}/reviews`)}
                className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
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
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                          {repo.language}
                        </span>
                      )}
                      <span className="font-medium">Branch: {repo.default_branch}</span>
                      {repo.sync_status?.last_synced && (
                        <span>
                          Last synced:{" "}
                          {new Date(repo.sync_status.last_synced).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => fetchBranches(repo.id)}
                        disabled={loadingBranches[repo.id]}
                        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {loadingBranches[repo.id] ? "Loading..." : "Show all branches"}
                      </button>
                      {branches[repo.id] && (
                        <div className="mt-2 p-2 bg-gray-50 rounded border">
                          <p className="text-xs font-medium mb-1">Available branches:</p>
                          <div className="flex flex-wrap gap-1">
                            {branches[repo.id].map((branch) => (
                              <button
                                key={branch.name}
                                onClick={() => handleUpdateBranch(repo.id, branch.name)}
                                disabled={updatingBranch[repo.id] || branch.name === repo.default_branch}
                                className={`text-xs px-2 py-1 rounded ${
                                  branch.name === repo.default_branch
                                    ? "bg-green-100 text-green-800 font-medium"
                                    : "bg-white text-gray-700 hover:bg-blue-50"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {branch.name}
                                {branch.name === repo.default_branch && " ✓"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {repo.sync_status?.last_sync_error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        Error: {repo.sync_status.last_sync_error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleSync(repo.id)}
                    disabled={syncing[repo.id]}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {syncing[repo.id] ? "Syncing..." : "Sync"}
                  </button>
                  <button
                    onClick={() => setShowReviewModal({ ...showReviewModal, [repo.id]: true })}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
                  >
                    Review Code
                  </button>
                  <button
                    onClick={() => navigate(`/repositories/${repo.id}/reviews`)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition text-sm"
                  >
                    View Reviews
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

                {/* Review Modal */}
                {showReviewModal[repo.id] && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
                      <h3 className="text-xl font-bold mb-4">Start Code Review</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Select review types to analyze your code:
                      </p>
                      <div className="space-y-2 mb-4">
                        {[
                          { value: "security", label: "🛡️ Security" },
                          { value: "performance", label: "⚡ Performance" },
                          { value: "clean_code", label: "🧹 Clean Code" },
                          { value: "architecture", label: "📐 Architecture" },
                          { value: "test_coverage", label: "🧪 Test Coverage" },
                          { value: "general", label: "📝 General" },
                        ].map((type) => (
                          <label
                            key={type.value}
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={(reviewTypes[repo.id] || []).includes(type.value)}
                              onChange={() => toggleReviewType(repo.id, type.value)}
                              className="mr-2"
                            />
                            <span>{type.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowReviewModal({ ...showReviewModal, [repo.id]: false });
                            setReviewTypes({ ...reviewTypes, [repo.id]: [] });
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleStartReview(repo.id)}
                          disabled={reviewing[repo.id] || (reviewTypes[repo.id] || []).length === 0}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reviewing[repo.id] ? "Starting..." : "Start Review"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

