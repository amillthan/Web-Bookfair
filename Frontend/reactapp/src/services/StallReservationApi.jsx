import AxiosInstance from "./AxiosInstance";

const unwrap = (res) => res.data; // full ApiResponse
const dataOnly = (res) => unwrap(res).data; // only "data"

// Exhibition API
export const ExhibitionApi = {
  getAll: async () => dataOnly(await AxiosInstance.get("/exhibitions")),
  getById: async (id) => dataOnly(await AxiosInstance.get(`/exhibitions/${id}`))
};

// Profile API
export const ProfileApi = {
  get: async () => dataOnly(await AxiosInstance.get("/profile")),
  update: async (data) => dataOnly(await AxiosInstance.put("/profile", data))
};

// Vendor Reservation API
export const ReservationApi = {
  create: async (data) => dataOnly(await AxiosInstance.post("/reservations", data)),
  getMy: async () => dataOnly(await AxiosInstance.get("/reservations/my")),
  getById: async (id) => dataOnly(await AxiosInstance.get(`/reservations/${id}`)),
  update: async (id, data) => dataOnly(await AxiosInstance.put(`/reservations/${id}`, data)),
  cancel: async (id) => dataOnly(await AxiosInstance.delete(`/reservations/${id}`)),
  downloadDocument: async (id) => await AxiosInstance.get(`/reservations/${id}/download`, { responseType: "blob" })
};

// Organizer Admin Reservation API
export const AdminReservationApi = {
  getAll: async () => dataOnly(await AxiosInstance.get("/admin/reservations")),
  getById: async (id) => dataOnly(await AxiosInstance.get(`/admin/reservations/${id}`)),
  updateStatus: async (id, status) => dataOnly(await AxiosInstance.put(`/admin/reservations/${id}/status`, { status })),
  delete: async (id) => dataOnly(await AxiosInstance.delete(`/admin/reservations/${id}`))
};
