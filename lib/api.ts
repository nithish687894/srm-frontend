import axios from "axios";
import { useAuthStore } from "./store";


// In development, Next.js rewrites proxy /api/* to the backend.
// In production on Vercel, NEXT_PUBLIC_API_URL should point to your hosted backend.
const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  timeout: 30000,
});

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

      if (refreshToken) {
        try {
          // Use a fresh axios instance for the refresh call to avoid interceptor loops
          const res = await axios.post(`${API.defaults.baseURL}/api/v1/session/refresh-token`, { refreshToken });
          const newToken = res.data.token;
          const newRefreshToken = res.data.refreshToken;

          localStorage.setItem("authToken", newToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
            useAuthStore.getState().setRefreshToken(newRefreshToken);
          }
          useAuthStore.getState().setAuthToken(newToken);

          originalRequest.headers["x-session-token"] = newToken;
          return API(originalRequest);
        } catch (refreshErr) {
          useAuthStore.getState().logout();
          window.location.href = "/";
          return Promise.reject(refreshErr);
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  // New v1 endpoints
  initAuth: (type: string) => 
    API.get(`/api/v1/connectors/${type}/init`).then((r) => r.data),
  
  login: (email: string, password: string, type: string = "academia", extra: any = {}) =>
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
  updateBroadcast: (data: any) => API.post("/api/admin/broadcast", data).then((r) => r.data),
  getUsers: () => API.get("/api/admin/users").then((r) => r.data),
  getFeedback: () => API.get("/api/feedback").then((r) => r.data),
  submitFeedback: (message: string) => API.post("/api/feedback", { message }).then((r) => r.data),
  getAllFeedback: () => API.get("/api/admin/feedback").then((r) => r.data),
  replyToFeedback: (id: string, adminReply: string, status?: string) => 
    API.post(`/api/admin/feedback/${id}/reply`, { adminReply, status }).then((r) => r.data),
  aiChat: (message: string, historyData: any[], academicData: any) =>
    API.post("/api/ai/chat", { message, historyData, academicData }).then((r) => r.data),

  // Unsplash (proxied through backend — never expose API key)
  getUnsplashImage: (query: string) =>
    API.get(`/api/v1/unsplash?query=${encodeURIComponent(query)}`).then((r) => r.data),
};

export { API };
