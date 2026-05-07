import { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function CommentThread({ comment, repositoryId, onUpdate }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/comments/", {
        repository: repositoryId,
        file_path: comment.file_path,
        line_number: comment.line_number,
        branch: comment.branch,
        comment: replyText.trim(),
        parent: comment.id,
      });
      toast.success("Reply added");
      setReplyText("");
      setShowReplyForm(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to add reply";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    try {
      setResolving(true);
      if (comment.is_resolved) {
        await api.post(`/api/comments/${comment.id}/unresolve/`);
        toast.success("Comment unresolved");
      } else {
        await api.post(`/api/comments/${comment.id}/resolve/`);
        toast.success("Comment resolved");
      }
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update comment";
      toast.error(errorMsg);
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`border-l-4 pl-4 py-2 ${comment.is_resolved ? 'opacity-60' : ''}`} style={{ borderLeftColor: comment.is_resolved ? '#10b981' : '#3b82f6' }}>
      {/* Main Comment */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm">{comment.author_name || comment.author_email}</div>
            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
            {comment.is_resolved && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                ✓ Resolved
              </span>
            )}
          </div>
          <button
            onClick={handleResolve}
            disabled={resolving}
            className={`text-xs px-2 py-1 rounded ${
              comment.is_resolved
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            } disabled:opacity-50`}
          >
            {resolving ? "..." : comment.is_resolved ? "Unresolve" : "Resolve"}
          </button>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 ml-4 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="bg-white border border-gray-200 rounded p-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="font-semibold text-xs">{reply.author_name || reply.author_email}</div>
                <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
              </div>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{reply.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {!comment.is_resolved && (
        <div className="mt-2">
          {!showReplyForm ? (
            <button
              onClick={() => setShowReplyForm(true)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Reply
            </button>
          ) : (
            <form onSubmit={handleReply} className="mt-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Post Reply"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText("");
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

