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
    const token = localStorage.getItem("srmx_token");
    if (token) config.headers["x-session-token"] = token;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("srmx_token");
      useAuthStore.getState().clearSession();

    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    API.post("/api/login", { email, password }).then((r) => r.data),
  logout: () => API.post("/api/logout").then((r) => r.data),
};

export const dataAPI = {
  getAll: () => API.get("/api/all").then((r) => r.data),
  getAttendance: () => API.get("/api/attendance").then((r) => r.data),
  getMarks: () => API.get("/api/marks").then((r) => r.data),
  getTimetable: (batch: number = 1) =>
    API.get(`/api/timetable?batch=${batch}`).then((r) => r.data),
  getCalendar: () => API.get("/api/calendar").then((r) => r.data),
  getMyTimetable: () => API.get("/api/my-timetable").then((r) => r.data),
};
