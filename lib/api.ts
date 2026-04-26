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
    if (err.response?.status === 401 && !originalRequest._retry && typeof window !== "undefined") {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      
      if (refreshToken) {
        try {
          // Use a fresh axios instance for the refresh call to avoid interceptor loops
          const res = await axios.post(`${API.defaults.baseURL}/api/refresh-token`, { refreshToken });
          const newToken = res.data.token;
          
          localStorage.setItem("authToken", newToken);
          useAuthStore.getState().setAuthToken(newToken);
          
          originalRequest.headers["x-session-token"] = newToken;
          return API(originalRequest);
        } catch (refreshErr) {
          console.warn("Refresh token failed. Keeping user logged in with cached data.", refreshErr);
          // useAuthStore.getState().logout();
          // window.location.href = "/";
          return Promise.reject(refreshErr);
        }
      } else {
        console.warn("No refresh token available. Keeping user logged in with cached data.");
        // useAuthStore.getState().logout();
        // window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    API.post("/api/login", { email, password }).then((r) => r.data),
  logout: () => API.post("/api/logout").then((r) => r.data),
  refreshToken: (refreshToken: string) =>
    axios.post(`${API.defaults.baseURL}/api/refresh-token`, { refreshToken }).then((r) => r.data),
};

export const dataAPI = {
  getAll: () => API.get("/api/all").then((r) => r.data),
  getAttendance: () => API.get("/api/attendance").then((r) => r.data),
  getMarks: () => API.get("/api/marks").then((r) => r.data),
  getTimetable: (batch: number = 1) =>
    API.get(`/api/timetable?batch=${batch}`).then((r) => r.data),
  getCalendar: () => API.get("/api/calendar").then((r) => r.data),
  getMyTimetable: () => API.get("/api/my-timetable").then((r) => r.data),
  aiChat: (message: string, historyData: any[], academicData: any) => 
    API.post("/api/ai/chat", { message, historyData, academicData }).then((r) => r.data)
};
