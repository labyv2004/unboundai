import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Load user from localStorage on startup
  useEffect(() => {
    const stored = localStorage.getItem("unbound_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("unbound_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    // Ищем пользователя по username и password
    const { data, error } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      throw new Error("Invalid username or password");
    }

    const userData = { id: data.id, username: data.username };
    setUser(userData);
    localStorage.setItem("unbound_user", JSON.stringify(userData));
    setLocation("/dashboard");
  }, [setLocation]);

  const register = useCallback(async (username: string, password: string) => {
    // Проверяем, не занят ли username
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      throw new Error("Username already taken");
    }

    // Создаём нового пользователя
    const { data, error } = await supabase
      .from("users")
      .insert({ username, password })
      .select("id, username")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const userData = { id: data.id, username: data.username };
    setUser(userData);
    localStorage.setItem("unbound_user", JSON.stringify(userData));
    setLocation("/dashboard");
  }, [setLocation]);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem("unbound_user");
    setLocation("/auth");
  }, [setLocation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
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
