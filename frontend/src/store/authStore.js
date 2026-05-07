import { create } from "zustand";
import { login as apiLogin, register as apiRegister, logoutAndRedirect } from "@/services/api";

const ACCESS_KEYS = ["access", "accessToken"];
const REFRESH_KEYS = ["refresh", "refreshToken"];

function readToken(keys) {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: readToken(ACCESS_KEYS),
  refreshToken: readToken(REFRESH_KEYS),
  isBootstrapped: false,

  bootstrap: () => {
    set({
      accessToken: readToken(ACCESS_KEYS),
      refreshToken: readToken(REFRESH_KEYS),
      isBootstrapped: true,
    });
  },

  login: async ({ email, password }) => {
    await apiLogin({ email, password });
    set({
      accessToken: readToken(ACCESS_KEYS),
      refreshToken: readToken(REFRESH_KEYS),
      user: { name: "Rishabh", email },
    });
  },

  register: async (payload) => {
    await apiRegister(payload);
    set({
      accessToken: readToken(ACCESS_KEYS),
      refreshToken: readToken(REFRESH_KEYS),
      user: {
        name: payload?.name || "Rishabh",
        email: payload?.email,
        phone: payload?.phone || null,
      },
    });
  },

  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null });
    logoutAndRedirect();
  },

  isAuthenticated: () => {
    const { accessToken } = get();
    return Boolean(accessToken);
  },
}));

