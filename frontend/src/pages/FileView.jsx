import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import CodeViewer from "../components/CodeViewer";

export default function FileView() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract repoId and filePath from URL
  const pathParts = location.pathname.split("/");
  const repoIdIndex = pathParts.indexOf("repositories");
  const repoId = repoIdIndex !== -1 ? pathParts[repoIdIndex + 1] : null;
  const filesIndex = pathParts.indexOf("files");
  const filePath = filesIndex !== -1 
    ? decodeURIComponent(pathParts.slice(filesIndex + 1).join("/"))
    : "";
  
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [repository, setRepository] = useState(null);
  const [branch, setBranch] = useState("main");

  useEffect(() => {
    if (repoId) {
      fetchRepository();
    }
  }, [repoId]);

  useEffect(() => {
    if (repoId && filePath) {
      fetchFileContent();
    }
  }, [repoId, filePath, branch]);

  const fetchRepository = async () => {
    try {
      const res = await api.get(`/api/repositories/${repoId}/`);
      setRepository(res.data);
      setBranch(res.data.default_branch || "main");
    } catch (err) {
      toast.error("Failed to load repository");
      console.error("Error fetching repository:", err);
    }
  };

  const fetchFileContent = async () => {
    try {
      setLoading(true);
      const contentRes = await api.get(`/api/repositories/${repoId}/file_content/`, {
        params: {
          path: filePath,
          branch: branch,
        },
      });

      setFileContent(contentRes.data.content || "");
    } catch (err) {
      console.error("Error fetching file content:", err);
      if (err.response?.status === 404) {
        toast.error("File not found");
      } else {
        toast.error("Failed to load file content");
      }
    } finally {
      setLoading(false);
    }
  };

  const detectLanguage = (path) => {
    const ext = path.split(".").pop()?.toLowerCase();
    const langMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      json: "json",
      yml: "yaml",
      yaml: "yaml",
      md: "markdown",
      sh: "bash",
    };
    return langMap[ext] || "text";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  if (!repoId || !filePath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Invalid file path</p>
          <button
            onClick={() => navigate(`/repositories/${repoId}`)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Repository
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate(`/repositories/${repoId}`)}
              className="text-blue-600 hover:text-blue-800 mb-2 text-sm"
            >
              ← Back to Repository
            </button>
            <h1 className="text-xl font-bold">{filePath}</h1>
            {repository && (
              <p className="text-sm text-gray-500">
                {repository.full_name} • Branch: {branch}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/repositories/${repoId}/reviews`)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition text-sm"
            >
              Reviews
            </button>
            <button
              onClick={() => {
                logout();
                toast.success("Logged out successfully");
                navigate("/login");
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="max-w-7xl mx-auto p-6">
        {fileContent ? (
          <CodeViewer
            repositoryId={parseInt(repoId)}
            filePath={filePath}
            branch={branch}
            code={fileContent}
            language={detectLanguage(filePath)}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p>No file content available</p>
          </div>
        )}
      </div>
    </div>
  );
}
