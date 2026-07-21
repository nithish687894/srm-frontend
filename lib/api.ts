import axios from "axios";
import { useAuthStore } from "./store";

// In development, Next.js rewrites proxy /api/* to the backend.
// In production on Vercel, NEXT_PUBLIC_API_URL should point to your hosted backend.
const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  timeout: 30000,
  withCredentials: true,
});

let refreshPromise: Promise<AnyValue> | null = null;

export interface NormalizedAPIError {
  status?: number;
  code?: string;
  message: string;
  isNetworkError: boolean;
  retryable: boolean;
}

export function normalizeAPIError(err: AnyValue): NormalizedAPIError {
  const status = err?.response?.status;
  const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Something went wrong.";
  return {
    status,
    code: err?.response?.data?.code,
    message,
    isNetworkError: !err?.response,
    retryable: !status || status === 408 || status === 429 || status >= 500,
  };
}

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) config.headers["x-session-token"] = token;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    // Do not attempt to refresh or redirect if the 401 error is on a login/connect endpoint (wrong credentials)
    const isAuthRequest = originalRequest?.url?.includes("/connect") || originalRequest?.url?.includes("/login");
    
    if (err.response?.status === 401 && !isAuthRequest && !originalRequest._retry && typeof window !== "undefined") {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      try {
        refreshPromise ??= axios.post(
          `${API.defaults.baseURL}/api/v1/session/refresh-token`,
          refreshToken ? { refreshToken } : {},
          { withCredentials: true, timeout: 15000 }
        ).finally(() => {
          refreshPromise = null;
        });

        const res = await refreshPromise;
        const newToken = res.data.token;
        const newRefreshToken = res.data.refreshToken;

        if (newToken) localStorage.setItem("authToken", newToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
          useAuthStore.getState().setRefreshToken(newRefreshToken);
        }
        if (newToken) useAuthStore.getState().setAuthToken(newToken);

        if (newToken) originalRequest.headers["x-session-token"] = newToken;
        return API(originalRequest);
      } catch (refreshErr: AnyValue) {
        // Only force logout if server explicitly responded with 401 Unauthorized for the refresh token.
        // Transient network drops, server 5xx errors, or timeouts MUST NOT wipe stored credentials.
        if (refreshErr?.response?.status === 401) {
          useAuthStore.getState().logout();
          window.location.href = "/";
        }
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  // New v1 endpoints
  initAuth: (type: string) => 
    API.get(`/api/v1/connectors/${type}/init`).then((r) => r.data),
  
  login: (email: string, password: string, type: string = "academia", extra: AnyValue = {}) =>
    API.post(`/api/v1/connectors/${type}/connect`, { email, username: email, password, ...extra }).then((r) => r.data),
  
  // Keep legacy for backward compatibility if needed, but we prefer v1 now
  legacyLogin: (email: string, password: string) =>
    API.post("/api/login", { email, password }).then((r) => r.data),
    
  logout: (type: string = "academia") => 
    API.delete(`/api/v1/connectors/${type}/disconnect`).then((r) => r.data),
    
  refreshToken: (refreshToken: string) =>
    axios.post(`${API.defaults.baseURL}/api/v1/session/refresh-token`, { refreshToken }).then((r) => r.data),
};

export const dataAPI = {
  getUnified: () => API.get("/api/v1/data/unified").then((r) => r.data),
  getAll: () => API.get("/api/all").then((r) => r.data),
  refresh: () => API.get("/api/all").then((r) => r.data),
  forceRefresh: () => API.post("/api/v1/data/refresh").then((r) => r.data),
  getAttendance: () => API.get("/api/attendance").then((r) => r.data),
  getMarks: () => API.get("/api/marks").then((r) => r.data),
  getTimetable: (batch: number = 1) =>
    API.get(`/api/timetable?batch=${batch}`).then((r) => r.data),
  getCalendar: () => API.get("/api/calendar").then((r) => r.data),
  getMyTimetable: () => API.get("/api/my-timetable").then((r) => r.data),
  
  // Student Portal Specific
  getAbsentDetails: () => API.get("/api/v1/data/student-portal/absent").then((r) => r.data),
  getMalpractice: () => API.get("/api/v1/data/student-portal/malpractice").then((r) => r.data),
  
  getAdminLogs: () => API.get("/api/admin/login-logs").then((r) => r.data),
  clearAdminLogs: () => API.delete("/api/admin/login-logs").then((r) => r.data),
  getBroadcast: () => API.get("/api/admin/broadcast").then((r) => r.data),
  updateBroadcast: (data: AnyValue) => API.post("/api/admin/broadcast", data).then((r) => r.data),
  getUsers: () => API.get("/api/admin/users").then((r) => r.data),
  getFeedback: () => API.get("/api/feedback").then((r) => r.data),
  submitFeedback: (message: string) => API.post("/api/feedback", { message }).then((r) => r.data),
  getAllFeedback: () => API.get("/api/admin/feedback").then((r) => r.data),
  replyToFeedback: (id: string, adminReply: string, status?: string) => 
    API.post(`/api/admin/feedback/${id}/reply`, { adminReply, status }).then((r) => r.data),
  aiChat: (message: string, historyData: AnyValue[], academicData: AnyValue) =>
    API.post("/api/ai/chat", { message, historyData, academicData }).then((r) => r.data),

  // Unsplash (proxied through backend — never expose API key)
  getUnsplashImage: (query: string) =>
    API.get(`/api/v1/unsplash?query=${encodeURIComponent(query)}`).then((r) => r.data),
};

export const studentPortalAPI = {
  status: () => API.get("/api/student-portal/status").then((r) => r.data),
  connect: (payload: { netId?: string; username?: string; password: string; captcha: string; captchaToken: string }) =>
    API.post("/api/student-portal/connect", payload).then((r) => r.data),
  disconnect: () => API.post("/api/student-portal/disconnect").then((r) => r.data),
  getPage: (key: string) => API.get(`/api/student-portal/page/${encodeURIComponent(key)}`).then((r) => r.data),
  refreshPage: (key: string) => API.post(`/api/student-portal/refresh/${encodeURIComponent(key)}`).then((r) => r.data),
};

export const notesAPI = {
  getAll: (params?: { label?: string; subject?: string; sort?: string }) =>
    API.get("/api/v1/notes", { params }).then((r) => r.data),
  getOne: (id: string) =>
    API.get(`/api/v1/notes/${id}`).then((r) => r.data),
  search: (q: string) =>
    API.get(`/api/v1/notes/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
  recent: (limit?: number) =>
    API.get(`/api/v1/notes/recent${limit ? `?limit=${limit}` : ""}`).then((r) => r.data),
  linked: (page: string) =>
    API.get(`/api/v1/notes/linked/${page}`).then((r) => r.data),
  archived: () =>
    API.get("/api/v1/notes/archived").then((r) => r.data),
  trash: () =>
    API.get("/api/v1/notes/trash").then((r) => r.data),
  stats: () =>
    API.get("/api/v1/notes/stats").then((r) => r.data),
  create: (note: AnyValue) =>
    API.post("/api/v1/notes", note).then((r) => r.data),
  update: (id: string, note: AnyValue) =>
    API.put(`/api/v1/notes/${id}`, note).then((r) => r.data),
  delete: (id: string) =>
    API.delete(`/api/v1/notes/${id}`).then((r) => r.data),
  togglePin: (id: string) =>
    API.patch(`/api/v1/notes/${id}/pin`).then((r) => r.data),
  toggleFavorite: (id: string) =>
    API.patch(`/api/v1/notes/${id}/favorite`).then((r) => r.data),
  archive: (id: string) =>
    API.patch(`/api/v1/notes/${id}/archive`).then((r) => r.data),
  restore: (id: string) =>
    API.patch(`/api/v1/notes/${id}/restore`).then((r) => r.data),
  restoreRevision: (id: string, revisionIndex: number) =>
    API.post(`/api/v1/notes/${id}/revision/restore`, { revisionIndex }).then((r) => r.data),
};

export const examHubAPI = {
  ask: (payload: {
    question: string;
    semester?: number;
    subjectName?: string;
    unit?: string;
    topic?: string;
    resourceType?: string;
    mode?: string;
    officialOnly?: boolean;
    limit?: number;
  }) => API.post("/api/v1/exam/chat", payload).then((r) => r.data),
};

export const paymentAPI = {
  createOrder: (planId: string, buddyEmail?: string) =>
    API.post("/api/payment/create-order", { planId, buddyEmail }).then((r) => r.data),
  verifyPayment: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    API.post("/api/payment/verify", payload).then((r) => r.data),
};

export const opsAPI = {
  getOverview: () => API.get("/api/v1/ops/overview").then((r) => r.data),
  getHealth: () => API.get("/api/v1/ops/health").then((r) => r.data),
  getSystem: () => API.get("/api/v1/ops/system").then((r) => r.data),
  getLogs: (params?: { level?: string; q?: string; limit?: number }) =>
    API.get("/api/v1/ops/logs", { params }).then((r) => r.data),
};

export { API };
