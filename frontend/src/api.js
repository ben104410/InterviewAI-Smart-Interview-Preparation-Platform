import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
let refreshPromise;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const AI_SERVICE_ERROR_MESSAGE = "Unable to connect to the AI service.\n\nPlease try again in a moment.";

export const getApiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;

  if (!data) {
    return error?.request
      ? AI_SERVICE_ERROR_MESSAGE
      : fallback;
  }

  const detail = data.detail || data.message || data.non_field_errors?.[0];
  if (typeof detail === "string") {
    const text = detail.toLowerCase();
    if (text.includes("network") || text.includes("connection") || text.includes("timeout") || text.includes("service unavailable") || text.includes("internal server error") || text.includes("500") || text.includes("503")) {
      return AI_SERVICE_ERROR_MESSAGE;
    }
    return detail;
  }

  const fieldErrors = Object.entries(data)
    .map(([field, messages]) => {
      const message = Array.isArray(messages) ? messages.join(" ") : String(messages);
      return `${field}: ${message}`;
    })
    .join(" ");

  return fieldErrors || fallback;
};

export const getAiServiceErrorMessage = (error, fallback = AI_SERVICE_ERROR_MESSAGE) => getApiErrorMessage(error, fallback);

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  async (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isTokenRequest = originalRequest?.url?.includes("/token/");

    if (error.response?.status === 401 && !isTokenRequest) {
      const refreshToken = localStorage.getItem("refresh");

      if (originalRequest && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true;
        try {
          refreshPromise ??= axios
            .post(`${API_URL}/token/refresh/`, { refresh: refreshToken })
            .then(({ data }) => {
              localStorage.setItem("access", data.access);
              if (data.refresh) localStorage.setItem("refresh", data.refresh);
              return data.access;
            })
            .finally(() => {
              refreshPromise = undefined;
            });

          const accessToken = await refreshPromise;
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${accessToken}`,
          };
          return api(originalRequest);
        } catch {
          // Clear the session below when refresh is unavailable or rejected.
        }
      }

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.dispatchEvent(new Event("auth:logout"));

      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
