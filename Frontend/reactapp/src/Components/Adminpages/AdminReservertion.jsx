import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Filter,
  Eye,
  XCircle,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Send,
} from "lucide-react";
import Admin from "../../services/Admin";
import { motion, AnimatePresence } from "framer-motion";

const reservationStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showStallsModal, setShowStallsModal] = useState(false);
  const [stallsForReservation, setStallsForReservation] = useState([]);
  const [stallsLoading, setStallsLoading] = useState(false);
  const [stallsError, setStallsError] = useState(null);

  // Notification
  const [notification, setNotification] = useState(null);

  // Stats
  const [totalReservationsCount, setTotalReservationsCount] = useState(0);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const page = await Admin.getAllReservations({
        page: currentPage,
        size: pageSize,
      });

      // page is Page<ReservationResponse>
      const content = page?.content ?? [];
      setReservations(content);
      setTotalPages(page?.totalPages ?? 0);
      setTotalElements(page?.totalElements ?? 0);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError("Failed to load reservations. Please try again.");
      setReservations([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalCount = async () => {
    try {
      const count = await Admin.getTotalReservationsCount();
      setTotalReservationsCount(count || 0);
    } catch (err) {
      console.error("Error fetching total reservations count:", err);
      setTotalReservationsCount(0);
    }
  };

  useEffect(() => {
    fetchTotalCount();
    fetchReservations();
  }, [currentPage]);

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    let data = [...reservations];

    // Filter by status
    if (selectedStatus !== "ALL") {
      data = data.filter((reservation) => reservation.status === selectedStatus);
    }

    // Search by customer name, stall name, or reservation ID
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      data = data.filter((reservation) =>
        (reservation.customerName || "").toLowerCase().includes(q) ||
        (reservation.stallName || "").toLowerCase().includes(q) ||
        (reservation.id || "").toString().includes(q)
      );
    }

    return data;
  }, [reservations, selectedStatus, searchTerm]);

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;

    try {
      await Admin.cancelReservation(selectedReservation.id);
      showNotification("Reservation cancelled successfully", "success");
      setShowCancelModal(false);
      setSelectedReservation(null);
      fetchTotalCount(); // Refresh total count
      fetchReservations(); // Refresh list
    } catch (err) {
      console.error("Error cancelling reservation:", err);
      showNotification("Failed to cancel reservation", "error");
    }
  };

  const handleSendConfirmationEmail = async (reservationId) => {
    try {
      await Admin.sendReservationConfirmationEmail(reservationId);
      showNotification("Confirmation email sent successfully", "success");
      fetchReservations(); // Refresh list to update UI
    } catch (err) {
      console.error("Error sending confirmation email:", err);
      showNotification("Failed to send confirmation email", "error");
    }
  };

  const fetchStallsForReservation = async (reservationId) => {
    try {
      setStallsLoading(true);
      setStallsError(null);
      const data = await Admin.getReservationById(reservationId);
      // backend may return either a single `stall` or an array `stalls`
      const stalls = data?.stalls ?? (data?.stall ? [data.stall] : []);
      setStallsForReservation(stalls);
    } catch (err) {
      console.error("Error fetching reservation details:", err);
      setStallsError("Failed to load stalls for this reservation.");
      setStallsForReservation([]);
    } finally {
      setStallsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-400 bg-yellow-900/20";
      case "CONFIRMED":
        return "text-blue-400 bg-blue-900/20";
      case "CANCELLED":
        return "text-red-400 bg-red-900/20";
      case "COMPLETED":
        return "text-green-400 bg-green-900/20";
      default:
        return "text-gray-400 bg-gray-900/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <AlertCircle className="w-4 h-4" />;
      case "CONFIRMED":
        return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reservations Management</h1>
          <p className="text-gray-300">Monitor and manage all stall reservations</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/40 backdrop-blur-md rounded-lg shadow-sm border border-gray-700/50 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by customer, stall, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Statuses</option>
                  {reservationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchTotalCount();
                fetchReservations();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          {/* Total Reservations */}
          <div className="bg-gray-800/40 backdrop-blur-md rounded-lg shadow-sm border border-gray-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Reservations</p>
                <p className="text-2xl font-bold text-white">{totalReservationsCount}</p>
              </div>
              <div className="p-3 rounded-full text-blue-400 bg-blue-900/20">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Status-based counts from current page */}
          {reservationStatuses.map((status) => {
            const count = reservations.filter((reservation) => reservation.status === status).length;
            return (
              <div key={status} className="bg-gray-800/40 backdrop-blur-md rounded-lg shadow-sm border border-gray-700/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{status}</p>
                    <p className="text-2xl font-bold text-white">{count}</p>
                  </div>
                  <div className={`p-3 rounded-full ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reservations Table */}
        <div className="bg-gray-800/40 backdrop-blur-md rounded-lg shadow-sm border border-gray-700/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-300">Loading reservations...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <span className="ml-2 text-red-600">{error}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/40 border-b border-gray-600/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Reservation Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Stall
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Stall Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/40 divide-y divide-gray-700/50">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                        No reservations found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((reservation, _idx) => (
                      <tr key={reservation.id ?? `reservation-${_idx}-${reservation.createdAt ?? ''}`} className="hover:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <Calendar className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">#{reservation.id}</div>
                                <div className="text-sm text-gray-400">{reservation.title ?? reservation.description ?? "Reservation"}</div>
                                <div className="text-sm text-gray-400">Created: {formatDateTime(reservation.createdAt)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-white">{reservation.user?.fullName ?? reservation.customerName ?? "N/A"}</div>
                                <div className="text-sm text-gray-400">ID: {reservation.user?.id ?? reservation.customerId ?? "-"}</div>
                                <div className="text-sm text-gray-400">{reservation.user?.email ?? reservation.customerEmail ?? ""}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-white">{reservation.stall?.name ?? reservation.stallName ?? "N/A"}</div>
                                <div className="text-sm text-gray-400">ID: {reservation.stall?.id ?? reservation.stallId ?? "-"}</div>
                                <div className="text-sm text-gray-400">{reservation.stall?.location ?? reservation.stallLocation ?? ""}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {(() => {
                              const count = reservation.stalls?.length ?? (reservation.stall ? 1 : 0);
                              return (
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-white">{count}</div>
                                  {count > 0 && (
                                    <button
                                      onClick={() => {
                                        setSelectedReservation(reservation);
                                        fetchStallsForReservation(reservation.id);
                                        setShowStallsModal(true);
                                      }}
                                      className="text-blue-400 hover:text-blue-300 p-1 rounded"
                                      title="View Stalls"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-1" />
                            <div>
                              <div>{formatDateTime(reservation.startTime)}</div>
                              <div className="text-xs text-gray-400">to {formatDateTime(reservation.endTime)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                            {getStatusIcon(reservation.status)}
                            <span className="ml-1">{reservation.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setShowDetailsModal(true);
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {reservation.status === "PENDING" && (
                              <button
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setShowCancelModal(true);
                                }}
                                className="text-red-400 hover:text-red-300 p-1 rounded"
                                title="Cancel Reservation"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            {reservation.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleSendConfirmationEmail(reservation.id)}
                                className="text-yellow-400 hover:text-yellow-300 p-1 rounded"
                                title="Send Confirmation Email"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} reservations
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <span className="px-3 py-2 text-sm text-gray-300 bg-gray-800 border border-gray-600 rounded-lg">
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        <AnimatePresence>
          {showCancelModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/60 backdrop-blur-md rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700/50"
              >
                <h3 className="text-lg font-medium text-white mb-4">Cancel Reservation</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to cancel reservation #{selectedReservation?.id}?
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
                  >
                    Keep Reservation
                  </button>
                  <button
                    onClick={handleCancelReservation}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Cancel Reservation
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stalls Modal */}
        <AnimatePresence>
          {showStallsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/60 backdrop-blur-md rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-700/50 max-h-[80vh] overflow-y-auto"
              >
                <h3 className="text-lg font-medium text-white mb-4">Stalls for Reservation #{selectedReservation?.id}</h3>

                {stallsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-300">Loading stalls...</span>
                  </div>
                ) : stallsError ? (
                  <div className="text-red-500">{stallsError}</div>
                ) : stallsForReservation.length === 0 ? (
                  <div className="text-gray-300">No stalls found for this reservation.</div>
                ) : (
                  <div className="space-y-4">
                    {stallsForReservation.map((stall, _sIdx) => (
                      <div key={stall.id ?? stall.stallId ?? `stall-${_sIdx}`} className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">{stall.name ?? stall.stallName}</div>
                            <div className="text-sm text-gray-400">ID: {stall.id ?? stall.stallId ?? '-'}</div>
                            <div className="text-sm text-gray-400">{stall.location ?? stall.stallLocation ?? ''}</div>
                          </div>
                          <div className="text-right">
                            {stall.price != null && <div className="text-sm text-gray-300">${Number(stall.price).toFixed(2)}</div>}
                            {stall.status && <div className="text-sm text-gray-400">{stall.status}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowStallsModal(false);
                      setStallsForReservation([]);
                      setStallsError(null);
                    }}
                    className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedReservation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/60 backdrop-blur-md rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-700/50 max-h-[80vh] overflow-y-auto"
              >
                <h3 className="text-lg font-medium text-white mb-4">Reservation Details</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Reservation ID</label>
                      <p className="text-white">#{selectedReservation.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReservation.status)}`}>
                        {getStatusIcon(selectedReservation.status)}
                        <span className="ml-1">{selectedReservation.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Customer Name</label>
                      <p className="text-white">{selectedReservation.customerName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Customer Email</label>
                      <p className="text-white">{selectedReservation.customerEmail || "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Stall Name</label>
                      <p className="text-white">{selectedReservation.stallName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Stall Location</label>
                      <p className="text-white">{selectedReservation.stallLocation || "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Start Time</label>
                      <p className="text-white">{formatDateTime(selectedReservation.startTime)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">End Time</label>
                      <p className="text-white">{formatDateTime(selectedReservation.endTime)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Total Amount</label>
                      <p className="text-white">${selectedReservation.totalAmount?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Created At</label>
                      <p className="text-white">{formatDateTime(selectedReservation.createdAt)}</p>
                    </div>
                  </div>

                  {selectedReservation.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Notes</label>
                      <p className="text-white">{selectedReservation.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6 gap-3">
                  {selectedReservation.status === "CONFIRMED" && (
                    <button
                      onClick={() => {
                        handleSendConfirmationEmail(selectedReservation.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Email Confirmation
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
                notification.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminReservations;