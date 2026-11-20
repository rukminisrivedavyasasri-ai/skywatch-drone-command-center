import { create } from "zustand";
import { User } from "../types";
import { api, getToken, setToken, clearToken } from "../api/client";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  isAuthenticated: !!getToken(),
  isLoading: true,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.auth.login(username, password);
      setToken(data.access_token);
      set({
        user: data.user,
        token: data.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      set({
        error: err.message || "Invalid credentials",
        isLoading: false,
        isAuthenticated: false,
      });
      return false;
    }
  },

  logout: () => {
    clearToken();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const user = await api.auth.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearToken();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
