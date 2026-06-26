import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AppMode = "user" | "family";

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: "traveler" | "caregiver";
  phone?: string | null;
}

export interface RegisterData {
  username: string;
  displayName: string;
  password: string;
  role: "traveler" | "caregiver";
  phone?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  userId: number | null;
  userName: string;
  caregiverName: string;
  mode: AppMode;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  register: (data: RegisterData) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  setMode: (mode: AppMode) => void;
}

const AuthContext = createContext<AuthState>({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  userId: null,
  userName: "",
  caregiverName: "",
  mode: "user",
  login: async () => ({}),
  register: async () => ({}),
  logout: async () => {},
  setMode: () => {},
});

export const useAuth = () => useContext(AuthContext);

async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(path, { credentials: "include", ...opts, headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) } });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modeOverride, setModeOverride] = useState<AppMode | null>(null);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.id) setUser(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string): Promise<{ error?: string }> => {
    const r = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
    const data = await r.json();
    if (!r.ok) return { error: data.error ?? "Login failed" };
    setUser(data);
    setModeOverride(null);
    return {};
  };

  const register = async (payload: RegisterData): Promise<{ error?: string }> => {
    const r = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
    const data = await r.json();
    if (!r.ok) return { error: data.error ?? "Registration failed" };
    localStorage.setItem("transitbuddy_show_tour", "1");
    setUser(data);
    setModeOverride(null);
    return {};
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setModeOverride(null);
  };

  const setMode = (m: AppMode) => setModeOverride(m);

  const derivedMode: AppMode = modeOverride ?? (user?.role === "caregiver" ? "family" : "user");

  return (
    <AuthContext.Provider value={{
      isLoggedIn: !!user,
      isLoading,
      user,
      userId: user?.id ?? null,
      userName: user?.displayName ?? "",
      caregiverName: "",
      mode: derivedMode,
      login,
      register,
      logout,
      setMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
