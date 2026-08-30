// src/services/Authentication.js
import axios from "axios";

export default class Authentication {
  static BASE_URL = "http://localhost:8088";
  static TOKEN_KEY = "token";

  // ===== LOGIN =====
  static async login(credentials) {
    const res = await axios.post(
      `${this.BASE_URL}/api/auth/login`,
      credentials,
      { headers: { "Content-Type": "application/json" } }
    );

    // Accept different backend shapes
    const token =
      res?.data?.token ||
      res?.data?.accessToken ||
      res?.data?.data?.token ||
      res?.data?.data?.accessToken ||
      (typeof res?.data === "string" ? res.data : null);

    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      // Set role from response
      const role = res?.data?.role || res?.data?.userRole || res?.data?.data?.role;
      if (role) localStorage.setItem("role", role);
    }

    return res.data;
  }

  // ===== LOGOUT =====
  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem("role"); // optional if you used it
    localStorage.removeItem("user"); // optional if you used it
  }

  // ===== TOKEN =====
  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    // If it is a JWT, validate exp
    const payload = this.getJwtPayload(token);
    if (!payload) return true; // not jwt => still treat as authenticated

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      this.logout();
      return false;
    }
    return true;
  }

  // decode JWT payload (safe)
  static getJwtPayload(token = this.getToken()) {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  // ===== ROLE =====
  static getRole() {
    const payload = this.getJwtPayload();

    // Adjust claim names if your backend uses different
    const role =
      payload?.role ||
      payload?.userRole ||
      payload?.authority ||
      (Array.isArray(payload?.roles) ? payload.roles[0] : null) ||
      (Array.isArray(payload?.authorities) ? payload.authorities[0] : null) ||
      localStorage.getItem("role");

    return (role || "").toString();
  }

  static isAdmin() {
    const role = this.getRole();
    return role === "ADMIN" || role === "ROLE_ADMIN";
  }
}
