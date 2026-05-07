import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import FileTree from "../components/FileTree";

export default function Reviews() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { repoId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewTypeFilter, setReviewTypeFilter] = useState("all");
  const [repository, setRepository] = useState(null);
  const [showFileTree, setShowFileTree] = useState(false);

  useEffect(() => {
    if (repoId) {
      fetchRepository();
      fetchReviews();
      fetchStatistics();
    }
  }, [repoId, statusFilter, reviewTypeFilter]);

  const fetchRepository = async () => {
    try {
      const res = await api.get(`/api/repositories/${repoId}/`);
      setRepository(res.data);
    } catch (err) {
      console.error("Error fetching repository:", err);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (reviewTypeFilter !== "all") {
        params.append("review_type", reviewTypeFilter);
      }
      
      const url = `/api/repositories/${repoId}/reviews/${params.toString() ? `?${params}` : ""}`;
      const res = await api.get(url);
      setReviews(res.data.reviews || []);
    } catch (err) {
      toast.error("Failed to load reviews");
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await api.get(`/api/repositories/${repoId}/review_status/`);
      setStatistics(res.data.statistics);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-blue-500 text-white";
      case "info":
        return "bg-gray-400 text-white";
      default:
        return "bg-gray-300 text-gray-800";
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Code Reviews</h1>
              {repository && (
                <p className="text-sm text-gray-500 mt-1">{repository.full_name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFileTree(!showFileTree)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                {showFileTree ? "Hide" : "Show"} Files
              </button>
              <button
                onClick={() => navigate("/repositories")}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
              >
                Back to Repos
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Reviews</div>
                <div className="text-2xl font-bold">{statistics.total_reviews}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-2xl font-bold">{statistics.completed}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Processing</div>
                <div className="text-2xl font-bold">{statistics.processing}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Avg Score</div>
                <div className="text-2xl font-bold">
                  {statistics.average_score ? statistics.average_score.toFixed(1) : "N/A"}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={reviewTypeFilter}
              onChange={(e) => setReviewTypeFilter(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="all">All Types</option>
              <option value="security">Security</option>
              <option value="performance">Performance</option>
              <option value="clean_code">Clean Code</option>
              <option value="architecture">Architecture</option>
              <option value="test_coverage">Test Coverage</option>
              <option value="general">General</option>
            </select>
            <button
              onClick={fetchReviews}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* File Tree */}
        {showFileTree && repository && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <FileTree
              repositoryId={parseInt(repoId)}
              branch={repository.default_branch}
            />
          </div>
        )}

        {/* Reviews List */}
        {loading && reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-600">No reviews found. Start a review to see results here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/repositories/${repoId}/reviews/${review.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {review.code_chunk_name || review.code_file_path || "Review"}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getStatusColor(review.status)}`}
                      >
                        {review.status}
                      </span>
                      {review.overall_score !== null && (
                        <span className="text-lg font-bold text-blue-600">
                          Score: {review.overall_score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {review.code_file_path}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {review.review_types.map((type) => (
                        <span
                          key={type}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    {review.summary && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {review.summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{review.issues?.length || 0} issues found</span>
                    {review.issues && review.issues.length > 0 && (
                      <div className="flex gap-2">
                        {review.issues.slice(0, 5).map((issue, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded ${getSeverityColor(issue.severity)}`}
                          >
                            {issue.severity}
                          </span>
                        ))}
                        {review.issues.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{review.issues.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

