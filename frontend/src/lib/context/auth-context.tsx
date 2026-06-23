"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("devpilot_token");
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        const publicPaths = ["/", "/login", "/register"];
        if (!publicPaths.includes(pathname)) {
          router.push("/login");
        }
      }
    }
    setLoading(false);
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await api.auth.login(email, password);
      setIsAuthenticated(true);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      await api.auth.register(email, password, fullName);
      await api.auth.login(email, password);
      setIsAuthenticated(true);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, register, logout }}>
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
