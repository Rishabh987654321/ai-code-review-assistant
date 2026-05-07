import axios from "axios";

const ACCESS_KEYS = ["access", "accessToken"];
const REFRESH_KEYS = ["refresh", "refreshToken"];

function getStoredToken(keys) {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

function setStoredTokens({ access, refresh }) {
  if (access) {
    localStorage.setItem("access", access);
    localStorage.setItem("accessToken", access);
  }
  if (refresh) {
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("refreshToken", refresh);
  }
}

function clearStoredTokens() {
  for (const k of [...ACCESS_KEYS, ...REFRESH_KEYS]) localStorage.removeItem(k);
}

const baseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

export const api = axios.create({ baseURL });

let isRefreshing = false;
let refreshPromise = null;
const pendingQueue = [];

function enqueuePending(cb) {
  pendingQueue.push(cb);
}

function flushQueue(err, token) {
  while (pendingQueue.length) {
    const cb = pendingQueue.shift();
    cb?.(err, token);
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken(ACCESS_KEYS);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    if (!original || status !== 401 || original.__isRetryRequest) {
      return Promise.reject(error);
    }

    const refresh = getStoredToken(REFRESH_KEYS);
    if (!refresh) {
      clearStoredTokens();
      if (window.location.pathname !== "/auth") window.location.href = "/auth";
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = axios
        .post(`${baseURL}/api/token/refresh/`, { refresh })
        .then((r) => r.data)
        .finally(() => {
          isRefreshing = false;
        });
    }

    return new Promise((resolve, reject) => {
      enqueuePending(async (err, newAccess) => {
        if (err || !newAccess) {
          reject(err || error);
          return;
        }

        original.__isRetryRequest = true;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        try {
          resolve(await api.request(original));
        } catch (e) {
          reject(e);
        }
      });

      refreshPromise
        .then((data) => {
          const newAccess = data?.access || data?.access_token || null;
          const newRefresh = data?.refresh || null;
          if (!newAccess) throw new Error("Token refresh failed");
          setStoredTokens({ access: newAccess, refresh: newRefresh });
          flushQueue(null, newAccess);
        })
        .catch((e) => {
          clearStoredTokens();
          flushQueue(e, null);
          if (window.location.pathname !== "/auth") window.location.href = "/auth";
        });
    });
  }
);

export async function login({ email, password }) {
  const res = await api.post("/api/auth/login/", { email, password });
  const access = res.data?.access || res.data?.access_token;
  const refresh = res.data?.refresh || res.data?.refresh_token;
  setStoredTokens({ access, refresh });
  return res.data;
}

export async function register(payload) {
  const res = await api.post("/api/auth/registration/", payload);
  const access = res.data?.access || res.data?.access_token;
  const refresh = res.data?.refresh || res.data?.refresh_token;
  setStoredTokens({ access, refresh });
  return res.data;
}

export async function sendOTP(payload) {
  return (await api.post("/api/auth/otp/send/", payload)).data;
}

export async function verifyOTP(payload) {
  return (await api.post("/api/auth/otp/verify/", payload)).data;
}

export async function submitCode({ code, language }) {
  return (await api.post("/api/reviews/submit/", { code, language })).data;
}

export async function getReviews(params = {}) {
  // Backend exposes /api/reviews/ (router). Keep history path fallback-friendly.
  try {
    return (await api.get("/api/reviews/history/", { params })).data;
  } catch (e) {
    if (e?.response?.status === 404) {
      return (await api.get("/api/reviews/", { params })).data;
    }
    throw e;
  }
}

export async function getReview(id) {
  return (await api.get(`/api/reviews/${id}/`)).data;
}

export async function deleteReview(id) {
  return (await api.delete(`/api/reviews/${id}/`)).data;
}

export function logoutAndRedirect() {
  clearStoredTokens();
  if (window.location.pathname !== "/auth") window.location.href = "/auth";
}
