"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  authStorage,
  type AuthUser,
} from "@/lib/auth";

import { authService } from "@/services/auth.service";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  // --------------------------------------------------
  // Load current user
  // --------------------------------------------------

  const refreshUser = async () => {
    try {
      const token = authStorage.getAccessToken();

      if (!token) {
        setUser(null);
        return;
      }

      const response =
        await authService.getMe();

      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      authStorage.clearAccessToken();
      setUser(null);
    }
  };

  // --------------------------------------------------
  // Login
  // --------------------------------------------------

  const login = async (
    email: string,
    password: string
  ) => {
    const response =
      await authService.login({
        email,
        password,
      });

    if (
      !response.success ||
      !response.data?.user
    ) {
      throw new Error(
        response.message || "Login failed"
      );
    }

    setUser(response.data.user);

    return response.data.user;
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      authStorage.clearAccessToken();
    }
  };

  // --------------------------------------------------
  // Initial authentication check
  // --------------------------------------------------

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshUser();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}