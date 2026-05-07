import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ReviewDetail() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { repoId, reviewId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReview();
  }, [reviewId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/repositories/${repoId}/reviews/`);
      const reviews = res.data.reviews || [];
      const foundReview = reviews.find((r) => r.id === parseInt(reviewId));
      if (foundReview) {
        setReview(foundReview);
      } else {
        toast.error("Review not found");
        navigate(`/repositories/${repoId}/reviews`);
      }
    } catch (err) {
      toast.error("Failed to load review");
      console.error("Error fetching review:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 text-white border-red-700";
      case "high":
        return "bg-orange-500 text-white border-orange-600";
      case "medium":
        return "bg-yellow-500 text-white border-yellow-600";
      case "low":
        return "bg-blue-500 text-white border-blue-600";
      case "info":
        return "bg-gray-400 text-white border-gray-500";
      default:
        return "bg-gray-300 text-gray-800 border-gray-400";
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {review.code_chunk_name || review.code_file_path || "Review"}
              </h1>
              <p className="text-sm text-gray-500">{review.code_file_path}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/repositories/${repoId}/reviews`)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
              >
                Back
              </button>
              <button
                onClick={() => {
                  logout();
                  toast.success("Logged out successfully");
                  navigate("/login");
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Review Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <span className={`text-sm px-2 py-1 rounded ${getStatusColor(review.status)}`}>
                {review.status}
              </span>
            </div>
            {review.overall_score !== null && (
              <div>
                <div className="text-sm text-gray-600">Score</div>
                <div className="text-xl font-bold text-blue-600">{review.overall_score}/100</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Issues</div>
              <div className="text-xl font-bold">{review.issues?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Review Types</div>
              <div className="flex flex-wrap gap-1">
                {review.review_types.map((type) => (
                  <span
                    key={type}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          {review.summary && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-sm text-gray-700">{review.summary}</p>
            </div>
          )}
        </div>

        {/* Issues */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">
            Issues ({review.issues?.length || 0})
          </h2>
          {review.issues && review.issues.length > 0 ? (
            <div className="space-y-4">
              {review.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-gray-300 pl-4 py-3 hover:bg-gray-50 transition"
                  style={{
                    borderLeftColor:
                      issue.severity === "critical"
                        ? "#dc2626"
                        : issue.severity === "high"
                        ? "#ea580c"
                        : issue.severity === "medium"
                        ? "#eab308"
                        : issue.severity === "low"
                        ? "#3b82f6"
                        : "#9ca3af",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${getSeverityColor(
                            issue.severity
                          )}`}
                        >
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {issue.review_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {issue.issue_type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{issue.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                      {issue.line_number && (
                        <p className="text-xs text-gray-500">
                          Line {issue.line_number}
                          {issue.line_range && ` (${issue.line_range})`}
                        </p>
                      )}
                    </div>
                  </div>
                  {issue.suggestion && (
                    <div className="bg-yellow-50 p-3 rounded mt-2">
                      <div className="text-sm font-semibold mb-1">💡 Suggestion:</div>
                      <p className="text-sm text-gray-700">{issue.suggestion}</p>
                    </div>
                  )}
                  {issue.code_example && (
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-xs overflow-x-auto">
                      <div className="text-gray-400 mb-1">Example fix:</div>
                      <pre className="whitespace-pre-wrap">{issue.code_example}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No issues found. Great job! 🎉</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

