import React, { createContext, useContext, useState, ReactNode } from "react";
import { API_BASE } from "../config";

export interface FacultyUser {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface AuthContextType {
  user: FacultyUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FacultyUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/faculty/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({ message: `Server error (${res.status})` }));
      if (!res.ok) throw new Error(data.message || "Login failed");
      setUser({
        id: data.faculty._id || data.faculty.id,
        name: data.faculty.name,
        email: data.faculty.email,
        department: data.faculty.department || "",
      });
    } catch (err: any) {
      const msg = err.message === "Network request failed"
        ? `Cannot connect to server at ${API_BASE}. Make sure the backend server is running and your device is on the same network.`
        : err.message;
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
