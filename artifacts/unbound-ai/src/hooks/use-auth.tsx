import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { useGetMe, User } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/utils";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("unbound_token"));
  const [, setLocation] = useLocation();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      queryKey: ["/api/auth/me", token],
      enabled: !!token,
      retry: false,
    },
    request: { headers: getAuthHeaders() }
  });

  const login = useCallback((newToken: string) => {
    localStorage.setItem("unbound_token", newToken);
    setToken(newToken);
    setLocation("/dashboard");
  }, [setLocation]);

  const logout = useCallback(() => {
    localStorage.removeItem("unbound_token");
    setToken(null);
    setLocation("/auth");
  }, [setLocation]);

  useEffect(() => {
    if (isError) {
      // Token invalid or expired
      logout();
    }
  }, [isError, logout]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoading && !!token,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
