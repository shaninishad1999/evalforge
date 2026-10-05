import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import { authStorage } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// --------------------------------------------------
// Request Interceptor
// --------------------------------------------------

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --------------------------------------------------
// Response Interceptor
// --------------------------------------------------

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & {
          _retry?: boolean;
        })
      | undefined;

    // No request config
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Only handle 401 once
    if (
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // Don't try to refresh these endpoints
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response = await api.post("/auth/refresh");

      const newAccessToken =
        response.data?.data?.accessToken;

      if (!newAccessToken) {
        authStorage.clearAccessToken();
        return Promise.reject(error);
      }

      authStorage.setAccessToken(newAccessToken);

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      authStorage.clearAccessToken();

      return Promise.reject(refreshError);
    }
  }
);

export default api;