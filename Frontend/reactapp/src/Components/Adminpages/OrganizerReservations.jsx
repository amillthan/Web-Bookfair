import React, { useEffect, useState } from "react";
import { AdminReservationApi } from "../../services/StallReservationApi";
import { Link } from "react-router-dom";
import { Eye, Check, X, Ban, Trash2, Calendar, Filter } from "lucide-react";

export default function OrganizerReservations() {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (filterStatus === "All") {
      setFilteredReservations(reservations);
    } else {
      setFilteredReservations(reservations.filter((r) => r.status === filterStatus));
    }
  }, [reservations, filterStatus]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await AdminReservationApi.getAll();
      setReservations(data);
    } catch (err) {
      setError("Failed to load reservations list.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to set this reservation to ${status}?`)) return;
    setActionId(id);
    try {
      await AdminReservationApi.updateStatus(id, status);
      fetchReservations();
    } catch (err) {
      setError(`Failed to update status to ${status}.`);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this reservation record? This action is irreversible.")) return;
    setActionId(id);
    try {
      await AdminReservationApi.delete(id);
      fetchReservations();
    } catch (err) {
      setError("Failed to delete reservation record.");
    } finally {
      setActionId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "Cancelled":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Stall Reservation Management</h1>
          <p className="text-gray-500 mt-1">Review vendor details, change statuses, and cancel/delete reservations.</p>
        </div>
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium mb-6">
          {error}
        </div>
      )}

      {filteredReservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <h3 className="text-lg font-bold text-gray-700">No Reservations Found</h3>
          <p className="text-gray-500 mt-1">There are no reservation requests matching this filter status.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Vendor & Organization</th>
                  <th className="p-4">Exhibition</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type / Size</th>
                  <th className="p-4 text-center">Stalls</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{res.vendorName}</div>
                      <div className="text-xs text-gray-400">{res.organizationName || "No organization profile"}</div>
                    </td>
                    <td className="p-4">{res.exhibitionName}</td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {res.reservationDate}
                      </div>
                    </td>
                    <td className="p-4">{res.stallSize} / {res.stallType}</td>
                    <td className="p-4 text-center font-semibold">{res.numberOfStalls}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(res.status)}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Link
                          to={`/admin/reservations/${res.id}`}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {actionId === res.id ? (
                          <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent animate-spin rounded-full"></div>
                        ) : (
                          <>
                            {res.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(res.id, "Approved")}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition cursor-pointer"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(res.id, "Rejected")}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {res.status === "Approved" && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, "Cancelled")}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Cancel"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(res.id)}
                              className="p-2 text-red-800 hover:bg-red-100 rounded-lg transition cursor-pointer"
                              title="Delete Permanent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
