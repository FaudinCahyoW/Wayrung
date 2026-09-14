"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as loginApi } from "@/lib/auth";
import { Login, User, AuthContextType } from "@/types/login";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedToken) {
      setToken(storedToken);
      document.cookie = `token=${storedToken}; path=/; max-age=86400; SameSite=Lax`;
    }
    setLoading(false);
  }, []);

  async function login(data: Login) {
    try {
      setError(null);
      const res = await loginApi(data);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      document.cookie = `token=${res.token}; path=/; max-age=86400; SameSite=Lax`;
      setToken(res.token);
      setUser(res.user);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed");
      throw err;
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0;";
    setToken(null);
    setUser(null);
    setError(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, error, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}