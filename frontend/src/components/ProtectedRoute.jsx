import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);

  // If no user token, redirect to login
  // Token validation will be handled by API interceptor (401 errors)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
