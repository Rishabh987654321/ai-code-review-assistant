import { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    localStorage.getItem("access") ? true : null
  );

  // Sync user state with localStorage on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("access");
      setUser(token ? true : null);
    };

    // Check on mount
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login/", {
      email,
      password,
    });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);
    setUser(true);
  };

  const loginWithGoogle = async (accessToken) => {
    const res = await api.post("/api/auth/google/", {
      access_token: accessToken,
    });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);
    setUser(true);
  };

  const signup = async (email, password1, password2) => {
    const res = await api.post("/api/auth/registration/", {
      email,
      password1,
      password2,
    });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);
    setUser(true);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
