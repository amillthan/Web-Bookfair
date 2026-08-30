// src/services/Admin.js
// SECURITY: This service uses AxiosInstance which automatically attaches the OIDC
// access token from react-oidc-context's secure in-memory storage (set via setAuthToken
// in AuthContext.jsx). Tokens are NEVER read from localStorage or sessionStorage.
import AxiosInstance from "./AxiosInstance";

export default class Admin {
  /* ================= RESPONSE UNWRAP =================
     Backend returns: ApiResponse.ok(msg, data, status)
     AxiosInstance response: { data: { message, data, status } }
     We want the inner data payload.
  */
  static unwrap(response) {
    return response?.data?.data ?? response?.data;
  }

  /* ================= DASHBOARD ================= */
  // âœ… Exists in backend: GET /api/admin/dashboard/statistics
  static async getDashboardStats() {
    try {
      const response = await AxiosInstance.get(`/api/admin/dashboard/statistics`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getDashboardStats");
      throw error;
    }
  }

  // âœ… Exists in backend: GET /api/admin/dashboard/metrics
  static async getSystemMetrics() {
    try {
      const response = await AxiosInstance.get(`/api/admin/dashboard/metrics`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getSystemMetrics");
      throw error;
    }
  }

  /* ================= USER MANAGEMENT ================= */
  // âœ… Exists: GET /api/admin/users?page=0&size=10
  // NOTE: your backend currently ignores "sort" unless you update controller to accept it.
  static async getAllUsers(params = {}) {
    const config = { params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        // backend currently does NOT accept sort param in your pasted controller
        // keep it here only if you upgrade controller to support sort
        ...(params.sort ? { sort: params.sort } : {}),
      },
    };

    try {
      const response = await AxiosInstance.get(`/api/admin/users`,
        config
      );
      return this.unwrap(response); // Page<UserResponse>
    } catch (error) {
      this.logError(error, "getAllUsers");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/users/{userId}
  static async getUserById(userId) {
    try {
      const response = await AxiosInstance.get(`/api/admin/users/${userId}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getUserById");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/users/role/{role}
  static async getUsersByRole(role) {
    try {
      const response = await AxiosInstance.get(`/api/admin/users/role/${role}`);
      return this.unwrap(response); // List<UserResponse>
    } catch (error) {
      this.logError(error, "getUsersByRole");
      throw error;
    }
  }

  // âœ… Exists: PUT /api/admin/users/{userId}/role/{newRole}
  static async updateUserRole(userId, newRole) {
    try {
      const response = await AxiosInstance.put(`/api/admin/users/${userId}/role/${newRole}`,
        {}, // no body needed because role is in URL
        this.getHeader()
      );
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "updateUserRole");
      throw error;
    }
  }

  // âœ… Exists: DELETE /api/admin/users/{userId}
  static async deleteUser(userId) {
    try {
      const response = await AxiosInstance.delete(`/api/admin/users/${userId}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "deleteUser");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/users/count
  static async getTotalUsersCount() {
    try {
      const response = await AxiosInstance.get(`/api/admin/users/count`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getTotalUsersCount");
      throw error;
    }
  }

  /* ================= STALL MANAGEMENT ================= */
  // âœ… Exists: GET /api/admin/stalls
  static async getAllStalls() {
    try {
      const response = await AxiosInstance.get(`/api/admin/stalls`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getAllStalls");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/stalls/status/{status}
  static async getStallsByStatus(status) {
    try {
      const response = await AxiosInstance.get(`/api/admin/stalls/status/${status}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getStallsByStatus");
      throw error;
    }
  }

  // âœ… Exists: PUT /api/admin/stalls/{stallId}/status/{status}
  static async updateStallStatus(stallId, status) {
    try {
      const response = await AxiosInstance.put(`/api/admin/stalls/${stallId}/status/${status}`,
        {});
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "updateStallStatus");
      throw error;
    }
  }

  // âœ… Exists: DELETE /api/admin/stalls/{stallId}
  static async deleteStall(stallId) {
    try {
      const response = await AxiosInstance.delete(`/api/admin/stalls/${stallId}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "deleteStall");
      throw error;
    }
  }

  // POST /api/admin/stalls - create a new stall
  static async createStall(payload) {
    try {
      const response = await AxiosInstance.post(`/api/admin/stalls`,
        payload);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "createStall");
      throw error;
    }
  }

  /* ================= RESERVATIONS ================= */
  // âœ… Exists: GET /api/admin/reservations?page=0&size=10
  static async getAllReservations(params = {}) {
    try {
      const response = await AxiosInstance.get(`/api/admin/reservations`,
        { params: {
            page: params.page ?? 0,
            size: params.size ?? 10,
          },
        }
      );
      return this.unwrap(response); // Page<ReservationResponse>
    } catch (error) {
      this.logError(error, "getAllReservations");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/reservations/{reservationId}
  static async getReservationById(reservationId) {
    try {
      const response = await AxiosInstance.get(`/api/admin/reservations/${reservationId}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getReservationById");
      throw error;
    }
  }

  // âœ… Exists: DELETE /api/admin/reservations/{reservationId}
  static async cancelReservation(reservationId) {
    try {
      const response = await AxiosInstance.delete(`/api/admin/reservations/${reservationId}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "cancelReservation");
      throw error;
    }
  }

  // âœ… Exists: POST /api/admin/reservations/{reservationId}/send-confirmation-email
  static async sendReservationConfirmationEmail(reservationId) {
    try {
      const response = await AxiosInstance.post(`/api/admin/reservations/${reservationId}/send-confirmation-email`,
        {});
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "sendReservationConfirmationEmail");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/reservations/count
  static async getTotalReservationsCount() {
    try {
      const response = await AxiosInstance.get(`/api/admin/reservations/count`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getTotalReservationsCount");
      throw error;
    }
  }

  // âœ… You MUST add backend endpoint for this:
  // GET /api/admin/reservations/pending
  static async getPendingReservations() {
    try {
      const response = await AxiosInstance.get(`/api/admin/reservations/pending`);
      return this.unwrap(response); // List<ReservationResponse>
    } catch (error) {
      this.logError(error, "getPendingReservations");
      throw error;
    }
  }

  /* ================= PAYMENTS ================= */
  // âœ… Exists: GET /api/admin/payments?page=0&size=10
  static async getAllPayments(params = {}) {
    try {
      const response = await AxiosInstance.get(`/api/admin/payments`,
        { params: {
            page: params.page ?? 0,
            size: params.size ?? 10,
          },
        }
      );
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getAllPayments");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/payments/{paymentId}
  static async getPaymentById(paymentId) {
    try {
      const response = await AxiosInstance.get(`/api/admin/payments/${paymentId}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getPaymentById");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/payments/status/{status}
  static async getPaymentsByStatus(status) {
    try {
      const response = await AxiosInstance.get(`/api/admin/payments/status/${status}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getPaymentsByStatus");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/payments/total-amount
  static async getTotalPaymentsAmount() {
    try {
      const response = await AxiosInstance.get(`/api/admin/payments/total-amount`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getTotalPaymentsAmount");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/payments/count/successful
  static async getSuccessfulPaymentsCount() {
    try {
      const response = await AxiosInstance.get(`/api/admin/payments/count/successful`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getSuccessfulPaymentsCount");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/payments/count/pending
  static async getPendingPaymentsCount() {
    try {
      const response = await AxiosInstance.get(`/api/admin/payments/count/pending`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getPendingPaymentsCount");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/payments/count/failed
  static async getFailedPaymentsCount() {
    try {
      const response = await AxiosInstance.get(`/api/admin/payments/count/failed`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getFailedPaymentsCount");
      throw error;
    }
  }

  // âœ… Exists: PUT /api/admin/payments/{paymentId}/status/{status}
  static async updatePaymentStatus(paymentId, status) {
    try {
      const response = await AxiosInstance.put(`/api/admin/payments/${paymentId}/status/${status}`,
        {});
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "updatePaymentStatus");
      throw error;
    }
  }

  // âœ… Exists: PUT /api/admin/payments/{paymentId}/confirm
  static async confirmPayment(paymentId) {
    try {
      const response = await AxiosInstance.put(`/api/admin/payments/${paymentId}/confirm`,
        {});
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "confirmPayment");
      throw error;
    }
  }

  // âœ… Exists: POST /api/admin/payments/{paymentId}/send-confirmation-email
  static async sendPaymentConfirmationEmail(paymentId) {
    try {
      const response = await AxiosInstance.post(`/api/admin/payments/${paymentId}/send-confirmation-email`,
        {});
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "sendPaymentConfirmationEmail");
      throw error;
    }
  }

  /* ================= EMAIL NOTIFICATIONS ================= */
  // âœ… Exists: GET /api/admin/emails?page=0&size=10
  static async getAllEmailNotifications(params = {}) {
    try {
      const response = await AxiosInstance.get(`/api/admin/emails`,
        { params: {
            page: params.page ?? 0,
            size: params.size ?? 10,
          },
        }
      );
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getAllEmailNotifications");
      throw error;
    }
  }

  // âœ… Exists: POST /api/admin/emails/{id}/resend
  static async resendEmailNotification(emailNotificationId) {
    try {
      const response = await AxiosInstance.post(`/api/admin/emails/${emailNotificationId}/resend`,
        {});
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "resendEmailNotification");
      throw error;
    }
  }

  // âœ… Exists: GET /api/admin/emails/failed
  static async getFailedEmailNotifications() {
    try {
      const response = await AxiosInstance.get(`/api/admin/emails/failed`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getFailedEmailNotifications");
      throw error;
    }
  }

  /* ================= QR PASS MANAGEMENT ================= */
  // âœ… GET /api/admin/qr-passes - Get all QR passes with pagination
  static async getAllQrPasses(page = 0, size = 10, sortBy = "qrId", direction = "desc") {
    try {
      const response = await AxiosInstance.get(`/api/admin/qr-passes`,
        { params: { page, size, sortBy, direction },
        }
      );
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getAllQrPasses");
      throw error;
    }
  }

  // âœ… GET /api/admin/qr-passes/{qrId} - Get QR pass by ID
  static async getQrPassById(qrId) {
    try {
      const response = await AxiosInstance.get(`/api/admin/qr-passes/${qrId}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getQrPassById");
      throw error;
    }
  }

  // âœ… GET /api/admin/qr-passes/by-reservation/{reservationId}
  static async getQrPassByReservationId(reservationId) {
    try {
      const response = await AxiosInstance.get(`/api/admin/qr-passes/by-reservation/${reservationId}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getQrPassByReservationId");
      throw error;
    }
  }

  // âœ… GET /api/admin/qr-passes/by-code/{qrCode}
  static async getQrPassByQrCode(qrCode) {
    try {
      const response = await AxiosInstance.get(`/api/admin/qr-passes/by-code/${qrCode}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getQrPassByQrCode");
      throw error;
    }
  }

  // âœ… PUT /api/admin/qr-passes/{qrId}/activate
  static async activateQrPass(qrId) {
    try {
      const response = await AxiosInstance.put(`/api/admin/qr-passes/${qrId}/activate`,
        {});
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "activateQrPass");
      throw error;
    }
  }

  // âœ… PUT /api/admin/qr-passes/{qrId}/deactivate
  static async deactivateQrPass(qrId) {
    try {
      const response = await AxiosInstance.put(`/api/admin/qr-passes/${qrId}/deactivate`,
        {});
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "deactivateQrPass");
      throw error;
    }
  }

  // âœ… PUT /api/admin/qr-passes/{qrId}/mark-used
  static async markQrPassAsUsed(qrId) {
    try {
      const response = await AxiosInstance.put(`/api/admin/qr-passes/${qrId}/mark-used`,
        {});
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "markQrPassAsUsed");
      throw error;
    }
  }

  // âœ… DELETE /api/admin/qr-passes/{qrId}
  static async deleteQrPass(qrId) {
    try {
      const response = await AxiosInstance.delete(`/api/admin/qr-passes/${qrId}`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "deleteQrPass");
      throw error;
    }
  }

  // âœ… GET /api/admin/qr-passes/count/total
  static async getTotalQrPassesCount() {
    try {
      const response = await AxiosInstance.get(`/api/admin/qr-passes/count/total`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getTotalQrPassesCount");
      throw error;
    }
  }

  // âœ… GET /api/admin/qr-passes/count/active
  static async getActiveQrPassesCount() {
    try {
      const response = await AxiosInstance.get(`/api/admin/qr-passes/count/active`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getActiveQrPassesCount");
      throw error;
    }
  }

  // âœ… GET /api/admin/qr-passes/count/inactive
  static async getInactiveQrPassesCount() {
    try {
      const response = await AxiosInstance.get(`/api/admin/qr-passes/count/inactive`);
      return this.unwrap(response);
    } catch (error) {
      this.logError(error, "getInactiveQrPassesCount");
      throw error;
    }
  }

  /* ================= UTIL ================= */
  static logError(error, label) {
    const status = error?.response?.status;
    const url = error?.config?.url;
    const data = error?.response?.data;
    
    let errorMsg = `[${label}] Status: ${status}`;
    if (status === 403) {
      errorMsg += " - ACCESS DENIED: Check user role/permissions for QR Pass management";
    } else if (status === 401) {
      errorMsg += " - UNAUTHORIZED: Token may be expired or invalid";
    } else if (status === 404) {
      errorMsg += " - NOT FOUND: Resource does not exist on server";
    } else if (status === 500) {
      errorMsg += " - SERVER ERROR: Contact backend support";
    }
    
    console.error(errorMsg, { status, url, data });
  }
}

