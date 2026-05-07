import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import CommentThread from "./CommentThread";

export default function CodeViewer({ 
  repositoryId, 
  filePath, 
  branch, 
  code, 
  language = "text",
  onCommentAdded 
}) {
  const [comments, setComments] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (repositoryId && filePath) {
      fetchComments();
    }
  }, [repositoryId, filePath, branch]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/comments/by_file/`, {
        params: {
          repository: repositoryId,
          file_path: filePath,
          branch: branch,
        },
      });
      setComments(res.data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      // Don't show error toast - comments are optional
    } finally {
      setLoading(false);
    }
  };

  const handleLineClick = (lineNumber) => {
    if (selectedLine === lineNumber && showCommentForm) {
      setShowCommentForm(false);
      setSelectedLine(null);
    } else {
      setSelectedLine(lineNumber);
      setShowCommentForm(true);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/comments/", {
        repository: repositoryId,
        file_path: filePath,
        line_number: selectedLine,
        branch: branch,
        comment: newComment.trim(),
      });
      toast.success("Comment added successfully");
      setNewComment("");
      setShowCommentForm(false);
      setSelectedLine(null);
      await fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to add comment";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getCommentsForLine = (lineNumber) => {
    return comments.filter((c) => c.line_number === lineNumber && !c.parent);
  };

  const lines = code.split("\n");

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-800 text-gray-300 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{filePath}</span>
          <span className="text-xs px-2 py-1 bg-gray-700 rounded">{language}</span>
        </div>
        <div className="text-xs text-gray-400">
          {lines.length} line{lines.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="relative">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, index) => {
                const lineNumber = index + 1;
                const lineComments = getCommentsForLine(lineNumber);
                const hasComments = lineComments.length > 0;
                const isSelected = selectedLine === lineNumber;

                return (
                  <tr
                    key={lineNumber}
                    className={`group hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50" : ""
                    } ${hasComments ? "bg-yellow-50" : ""}`}
                  >
                    {/* Line Number */}
                    <td className="w-16 px-4 py-1 text-right text-sm text-gray-500 select-none border-r border-gray-200 bg-gray-50">
                      {lineNumber}
                    </td>

                    {/* Code Content */}
                    <td className="px-4 py-1 font-mono text-sm relative">
                      <div className="flex items-start gap-2">
                        <code className="flex-1 whitespace-pre-wrap break-words">
                          {line || " "}
                        </code>
                        <button
                          onClick={() => handleLineClick(lineNumber)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-100 flex items-center justify-center"
                          title="Add comment"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Comment Form */}
                      {isSelected && showCommentForm && (
                        <div className="mt-2 mb-2 border-l-4 border-blue-500 pl-4">
                          <form onSubmit={handleSubmitComment}>
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="3"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {submitting ? "Posting..." : "Post Comment"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCommentForm(false);
                                  setSelectedLine(null);
                                  setNewComment("");
                                }}
                                className="px-4 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Existing Comments */}
                      {lineComments.map((comment) => (
                        <div key={comment.id} className="mt-2 mb-2">
                          <CommentThread
                            comment={comment}
                            repositoryId={repositoryId}
                            onUpdate={fetchComments}
                          />
                        </div>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

