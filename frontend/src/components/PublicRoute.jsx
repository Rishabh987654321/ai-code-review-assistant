import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user } = useContext(AuthContext);

  // If user is already authenticated, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

