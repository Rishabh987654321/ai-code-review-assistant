import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function FileTree({ repositoryId, branch, onFileSelect }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (repositoryId) {
      fetchTree();
    }
  }, [repositoryId, branch]);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/repositories/${repositoryId}/tree/`, {
        params: { branch: branch },
      });
      setTree(res.data.tree || []);
    } catch (err) {
      toast.error("Failed to load file tree");
      console.error("Error fetching tree:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (filePath) => {
    if (onFileSelect) {
      onFileSelect(filePath);
    } else {
      // Navigate to file view
      const encodedPath = encodeURIComponent(filePath);
      navigate(`/repositories/${repositoryId}/files/${encodedPath}`);
    }
  };

  const renderTree = (items, level = 0) => {
    return items.map((item) => {
      if (item.type === "dir") {
        return (
          <div key={item.path} className="ml-4">
            <div className="flex items-center gap-2 py-1 text-sm text-gray-700">
              <span className="text-gray-500">📁</span>
              <span className="font-medium">{item.name}</span>
            </div>
            {item.children && (
              <div className="ml-4">{renderTree(item.children, level + 1)}</div>
            )}
          </div>
        );
      } else {
        return (
          <div
            key={item.path}
            onClick={() => handleFileClick(item.path)}
            className="flex items-center gap-2 py-1 px-2 hover:bg-blue-50 cursor-pointer rounded text-sm text-gray-700 ml-4"
          >
            <span className="text-gray-500">📄</span>
            <span className="hover:text-blue-600">{item.name}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {item.size ? `${(item.size / 1024).toFixed(1)} KB` : ""}
            </span>
          </div>
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
        <p className="mt-2 text-sm">Loading files...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">File Tree</h3>
        <button
          onClick={fetchTree}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
      {tree.length === 0 ? (
        <p className="text-sm text-gray-500">No files found</p>
      ) : (
        <div className="space-y-1">{renderTree(tree)}</div>
      )}
    </div>
  );
}

