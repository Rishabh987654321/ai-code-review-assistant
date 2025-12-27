import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function SubmitCode() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ language: "", ordering: "-created_at" });

  const fetchSubmissions = async (pageNum = 1) => {
    try {
      const params = new URLSearchParams({ page: pageNum.toString() });
      if (filters.language) params.append("language", filters.language);
      if (filters.ordering) params.append("ordering", filters.ordering);
      
      const res = await api.get(`/api/submissions/?${params.toString()}`);
      // Handle paginated response (DRF returns {results: [], count: N}) or list response
      const data = res.data;
      if (Array.isArray(data)) {
        setSubmissions(data);
        setTotalPages(1);
      } else {
        setSubmissions(data.results || []);
        setTotalPages(Math.ceil((data.count || 0) / 10));
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      // Error handling is done by API interceptor (401 redirects to login)
      if (err.response?.status !== 401) {
        toast.error("Failed to load submissions");
      }
    }
  };

  const submitCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code before submitting");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/submissions/", { code, language });
      toast.success("Code submitted successfully!");
      setCode("");
      // Refresh submissions list
      await fetchSubmissions();
    } catch (err) {
      toast.error(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(page);
  }, [page, filters]);


  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Submit Code</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/github")}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              GitHub
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        <select
          className="border p-2 mb-3 w-full"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="sql">SQL</option>
        </select>

        <textarea
          className="border p-2 w-full h-40 mb-4"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          onClick={submitCode}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Your Submissions</h2>
            <div className="flex gap-2">
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="border p-1 rounded text-sm"
              >
                <option value="">All Languages</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="sql">SQL</option>
              </select>
              <select
                value={filters.ordering}
                onChange={(e) => setFilters({ ...filters, ordering: e.target.value })}
                className="border p-1 rounded text-sm"
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="language">Language A-Z</option>
                <option value="-language">Language Z-A</option>
              </select>
            </div>
          </div>
          {submissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No submissions yet. Submit your first code above!</p>
          ) : (
            <>
              {submissions.map((s) => (
                <div key={s.id} className="border p-2 mb-2 text-sm rounded">
                  <strong>{s.language}</strong> — {new Date(s.created_at).toLocaleString()}
                </div>
              ))}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
