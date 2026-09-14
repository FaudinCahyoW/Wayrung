import axios from "axios";
import Cookies from "js-cookie";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: otomatis nempelin token ke tiap request
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: otomatis handle kalau token expired/invalid (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        // NOTE: sebelumnya "/auth/login" — diperbaiki jadi "/login"
        // karena halaman login kamu ada di app/login/page.tsx, bukan app/auth/login/
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);