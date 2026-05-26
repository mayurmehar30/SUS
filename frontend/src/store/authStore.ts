import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  token: string | null;
  user: Omit<User, "active"> & { role: string } | null;
  login: (token: string, user: AuthState["user"]) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => {
        set({ token, user });
        if (typeof window !== "undefined") {
          document.cookie = `sus_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }
      },
      logout: () => {
        set({ token: null, user: null });
        if (typeof window !== "undefined") {
          localStorage.removeItem("sus_token");
          document.cookie = "sus_token=; path=/; max-age=0";
        }
      },
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "sus-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.token && typeof window !== "undefined") {
          localStorage.setItem("sus_token", state.token);
          document.cookie = `sus_token=${state.token}; path=/; max-age=86400; SameSite=Lax`;
        }
      },
    }
  )
);
