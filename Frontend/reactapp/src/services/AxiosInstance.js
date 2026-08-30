import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8088/api";

const AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// SECURITY FIX: Set authorization token via interceptor
// NOTE: Components using this should provide token from React context (useAuth hook)
// This is a workaround; ideally all API calls should pass token from auth context directly

// Global token holder (populated by components using useAuth context)
let currentAuthToken = null;

export const setAuthToken = (token) => {
  currentAuthToken = token;
};

export const clearAuthToken = () => {
  currentAuthToken = null;
};

// Request Interceptor: Attach verified OIDC Access Token automatically
// SECURITY: Token comes from OIDC library's secure storage, not localStorage
AxiosInstance.interceptors.request.use(
  (config) => {
    if (currentAuthToken) {
      config.headers.Authorization = `Bearer ${currentAuthToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Safely intercept auth errors without exposing details
AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Unauthorized: token expired or invalid
        // SECURITY: Do not log token details or user info
        console.warn("Authentication expired. Please re-login.");
        clearAuthToken();
      } else if (error.response.status === 403) {
        // Forbidden: insufficient permissions
        console.warn("You do not have permission for this action.");
      }
    }
    return Promise.reject(error);
  }
);

export default AxiosInstance;
