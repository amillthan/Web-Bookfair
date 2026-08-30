import axios from "axios";

const BASE_URL = "http://localhost:8088";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const unwrap = (res) => res.data; 

const UserAccountApi = {

  sendEmailOtp: async ({ email }) => {
    const res = await api.post(`/api/auth/send-otp`, null, {
      params: { email },
    });
    return unwrap(res);
  },


  verifyEmailOtp: async ({ email, otp }) => {
    const res = await api.post(`/api/auth/verify-email`, { email, otp });
    return unwrap(res);
  },


  resendVerifyOtp: async ({ email }) => {
    const res = await api.post(`/api/auth/resend-verify-otp`, null, {
      params: { email },
    });
    return unwrap(res);
  },

  registerUser: async (payload) => {
    const res = await api.post(`/api/auth/register`, payload);
    return unwrap(res);
  },


  login: async ({ email, password }) => {
    const res = await api.post(`/api/auth/login`, { email, password });
    return unwrap(res);
  },



  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  getRole: () => {
    return localStorage.getItem("role"); // USER / VENDOR / PUBLISHER / ADMIN
  },

  isAdmin: () => UserAccountApi.getRole() === "ADMIN",
  isVendor: () => UserAccountApi.getRole() === "VENDOR",
  isPublisher: () => UserAccountApi.getRole() === "PUBLISHER",
  isUser: () => UserAccountApi.getRole() === "USER",

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
  },
};

export default UserAccountApi;
