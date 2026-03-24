import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, ApiError } from "./api";

type Company = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  subscription_expires_at: string | null;
};

type User = {
  id: number;
  username: string;
  display_name: string;
  role: "super_admin" | "user";
  company_id: number | null;
  company: Company | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isSubscriptionExpired: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<User>("/api/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username: string, password: string) => {
    await api.post("/api/auth/login", { username, password });
    await refresh();
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  };

  const isSubscriptionExpired =
    user?.role !== "super_admin" &&
    user?.company?.subscription_expires_at != null &&
    new Date(user.company.subscription_expires_at) < new Date();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refresh,
        isSubscriptionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
