import axios from "axios";

export const BASE_API_URL = "http://localhost:8080";

export const api = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          localStorage.removeItem("token");
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          break;
        case 403:
          console.error("Access forbidden:", data?.message || "Forbidden");
          break;
        case 404:
          console.error("Resource not found:", data?.message || "Not found");
          break;
        case 500:
          console.error(
            "Server error:",
            data?.message || "Internal server error"
          );
          break;
        default:
          console.error(`HTTP ${status}:`, data?.message || error.message);
      }
    } else if (error.request) {
      console.error("Network error:", error.message);
    } else {
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export const fileUploadApi = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
  timeout: 60000,
});

fileUploadApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

fileUploadApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/password/forgot",
    RESET_PASSWORD: "/auth/password/reset",
    VALIDATE_TOKEN: "/auth/password/validate-token",
  },

  USERS: {
    PROFILE: "/api/users/profile",
    UPDATE: "/api/users/update",
    SEARCH: "/api/users/search",
    CHANGE_PASSWORD: "/api/users/change-password",
    UPLOAD_AVATAR: "/api/users/upload-avatar",
    UPLOAD_AVATAR_BASE64: "/api/users/upload-avatar-base64",
    GET_BY_ID: (id) => `/api/users/${id}`,
  },

  CHATS: {
    GET_ALL: "/api/chats",
    CREATE: "/api/chats",
    GET_BY_ID: (id) => `/api/chats/${id}`,
    DELETE: (id) => `/api/chats/${id}`,
  },

  MESSAGES: {
    GET_BY_CHAT: (chatId) => `/api/messages/chat/${chatId}`,
    SEND: "/api/messages",
    DELETE: (messageId) => `/api/messages/${messageId}`,
  },
};

export const apiHelpers = {
  getAuthHeaders: () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  setAuthToken: (token) => {
    localStorage.setItem("token", token);
  },

  clearAuthToken: () => {
    localStorage.removeItem("token");
  },

  handleApiError: (error) => {
    if (error.response) {
      const message = error.response.data?.message || error.response.statusText;
      return { message, status: error.response.status };
    } else if (error.request) {
      return {
        message: "Network error. Please check your connection.",
        status: 0,
      };
    } else {
      return {
        message: error.message || "An unexpected error occurred",
        status: -1,
      };
    }
  },
};

export default api;
