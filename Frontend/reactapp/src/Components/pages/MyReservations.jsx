import React, { useEffect, useState } from "react";
import { ReservationApi } from "../../services/StallReservationApi";
import { Link } from "react-router-dom";
import { Eye, Trash2, Calendar, FileText } from "lucide-react";

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await ReservationApi.getMy();
      setReservations(data);
    } catch (err) {
      setError("Failed to load your reservations.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    setCancellingId(id);
    try {
      await ReservationApi.cancel(id);
      // Refresh list
      fetchReservations();
    } catch (err) {
      setError("Failed to cancel reservation.");
    } finally {
      setCancellingId(null);
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Stall Reservations</h1>
          <p className="text-gray-500 mt-1">Track and manage your exhibition stall booking requests.</p>
        </div>
        <Link
          to="/reservations/create"
          className="bg-blue-700 hover:bg-blue-600 text-white rounded-xl py-3 px-5 text-sm font-semibold shadow-lg hover:shadow-xl transition cursor-pointer"
        >
          Create Reservation
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium mb-6">
          {error}
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <FileText className="mx-auto text-gray-300 w-16 h-16 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No Reservations Found</h3>
          <p className="text-gray-500 mt-1 max-w-md mx-auto">You haven't made any stall reservations yet. Click "Create Reservation" to submit your first request.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Exhibition</th>
                  <th className="p-4">Reservation Date</th>
                  <th className="p-4">Stall Type</th>
                  <th className="p-4">Stall Size</th>
                  <th className="p-4">Number of Stalls</th>
                  <th className="p-4">Business Category</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-semibold text-gray-800">{res.exhibitionName}</td>
                    <td className="p-4 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {res.reservationDate}
                    </td>
                    <td className="p-4">{res.stallType}</td>
                    <td className="p-4">{res.stallSize}</td>
                    <td className="p-4 text-center font-semibold">{res.numberOfStalls}</td>
                    <td className="p-4">{res.businessCategory}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(res.status)}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          to={`/reservations/${res.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {res.status === "Pending" && (
                          <button
                            onClick={() => handleCancel(res.id)}
                            disabled={cancellingId === res.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Cancel Reservation"
                          >
                            {cancellingId === res.id ? (
                              <div className="h-4 w-4 border-2 border-red-600 border-t-transparent animate-spin rounded-full"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
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
