import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// List of endpoints that don't require authentication
const publicEndpoints = [
  "/api/auth/login/",
  "/api/auth/registration/",
  "/api/auth/google/",
  "/accounts/github/login/",
];

api.interceptors.request.use((config) => {
  // Don't add token for public authentication endpoints
  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    config.url?.includes(endpoint)
  );

  if (!isPublicEndpoint) {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle expired tokens - clear them and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      const isAuthEndpoint = publicEndpoints.some((endpoint) =>
        error.config?.url?.includes(endpoint)
      );
      
      // Only clear tokens if it's not an auth endpoint (login/register)
      // Auth endpoints returning 401 means invalid credentials, not expired token
      if (!isAuthEndpoint) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        
        // Show toast notification for expired session
        toast.error("Your session has expired. Please login again.");
        
        // Redirect to login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
