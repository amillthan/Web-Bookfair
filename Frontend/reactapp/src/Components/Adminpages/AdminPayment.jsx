import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  TrendingUp,
  Check,
  X,
  Edit3,
} from "lucide-react";
import Admin from "../../services/Admin";
import { motion, AnimatePresence } from "framer-motion";

const AdminPayment = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalAmount: 0,
    successfulCount: 0,
    pendingCount: 0,
    failedCount: 0,
  });

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPaymentForStatus, setSelectedPaymentForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const showNotification = (message, type) => {
    // You can implement a notification system here
    console.log(`${type}: ${message}`);
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch payments with pagination
      const paymentsData = await Admin.getAllPayments({
        page: currentPage,
        size: pageSize,
      });

      // Fetch statistics
      const [totalAmount, successfulCount, pendingCount, failedCount] = await Promise.all([
        Admin.getTotalPaymentsAmount(),
        Admin.getSuccessfulPaymentsCount(),
        Admin.getPendingPaymentsCount(),
        Admin.getFailedPaymentsCount(),
      ]);

      setPayments(paymentsData.content || []);
      setTotalPages(paymentsData.totalPages || 0);
      setStats({
        totalAmount: totalAmount || 0,
        successfulCount: successfulCount || 0,
        pendingCount: pendingCount || 0,
        failedCount: failedCount || 0,
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Failed to load payment data. Please try again.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentPage]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    let data = [...payments];

    // Search by payment ID, reservation ID, or reference number
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      data = data.filter((payment) =>
        (payment.paymentId?.toString() || "").toLowerCase().includes(q) ||
        (payment.reservationId?.toString() || "").toLowerCase().includes(q) ||
        (payment.referenceNumber || "").toLowerCase().includes(q) ||
        (payment.paymentMethod || "").toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      data = data.filter((payment) => payment.paymentStatus === statusFilter);
    }

    return data;
  }, [payments, searchTerm, statusFilter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleConfirmPayment = async (paymentId) => {
    try {
      setLoading(true);
      // Confirm the payment
      await Admin.confirmPayment(paymentId);
      showNotification("Payment confirmed successfully", "success");

      // Send confirmation email to vendor/publisher
      try {
        await Admin.sendPaymentConfirmationEmail(paymentId);
        showNotification("Confirmation email sent to vendor", "success");
      } catch (emailErr) {
        console.error("Error sending email:", emailErr);
        showNotification("Payment confirmed but email failed to send", "warning");
      }

      fetchPayments();
    } catch (err) {
      console.error("Error confirming payment:", err);
      showNotification("Failed to confirm payment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, status) => {
    try {
      setLoading(true);
      await Admin.updatePaymentStatus(paymentId, status);
      showNotification(`Payment status updated to ${status}`, "success");
      setShowStatusModal(false);
      setSelectedPaymentForStatus(null);
      setNewStatus("");
      fetchPayments();
    } catch (err) {
      console.error("Error updating payment status:", err);
      showNotification("Failed to update payment status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (payment) => {
    setSelectedPaymentForStatus(payment);
    setNewStatus(payment.paymentStatus);
    setShowStatusModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Payment Management</h1>
          <p className="text-gray-300">Monitor and manage all payment transactions</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Successful</p>
                <p className="text-2xl font-bold text-green-500">{stats.successfulCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Failed</p>
                <p className="text-2xl font-bold text-red-500">{stats.failedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Successful</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-400">Loading payments...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <XCircle className="w-8 h-8 text-red-500" />
              <span className="ml-2 text-red-400">{error}</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Payment ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Reservation
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.paymentId} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          #{payment.paymentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          #{payment.reservationId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {payment.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.paymentStatus)}`}>
                            {getStatusIcon(payment.paymentStatus)}
                            {payment.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(payment)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenStatusModal(payment)}
                              className="text-purple-400 hover:text-purple-300 transition-colors"
                              title="Edit Status"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {payment.paymentStatus === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleConfirmPayment(payment.paymentId)}
                                  className="text-green-400 hover:text-green-300 transition-colors"
                                  title="Confirm Payment"
                                  disabled={loading}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdatePaymentStatus(payment.paymentId, "FAILED")}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Reject Payment"
                                  disabled={loading}
                                >
                                  <X className="w-4 h-4" />
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Showing page {currentPage + 1} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Payment Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedPayment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDetailsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-4">Payment Details</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm">Payment ID</label>
                    <p className="text-white">#{selectedPayment.paymentId}</p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Reservation ID</label>
                    <p className="text-white">#{selectedPayment.reservationId}</p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Amount</label>
                    <p className="text-white font-medium">{formatCurrency(selectedPayment.amount)}</p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Payment Method</label>
                    <p className="text-white">{selectedPayment.paymentMethod}</p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedPayment.paymentStatus)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.paymentStatus)}`}>
                        {selectedPayment.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {selectedPayment.referenceNumber && (
                    <div>
                      <label className="text-gray-400 text-sm">Reference Number</label>
                      <p className="text-white">{selectedPayment.referenceNumber}</p>
                    </div>
                  )}

                  {selectedPayment.paymentDetails && (
                    <div>
                      <label className="text-gray-400 text-sm">Payment Details</label>
                      <p className="text-white">{selectedPayment.paymentDetails}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-gray-400 text-sm">Created At</label>
                    <p className="text-white">{formatDate(selectedPayment.createdAt)}</p>
                  </div>

                  {selectedPayment.updatedAt && (
                    <div>
                      <label className="text-gray-400 text-sm">Updated At</label>
                      <p className="text-white">{formatDate(selectedPayment.updatedAt)}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Edit Modal */}
        <AnimatePresence>
          {showStatusModal && selectedPaymentForStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowStatusModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-4">Edit Payment Status</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Payment ID</label>
                    <p className="text-white">#{selectedPaymentForStatus.paymentId}</p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Current Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedPaymentForStatus.paymentStatus)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPaymentForStatus.paymentStatus)}`}>
                        {selectedPaymentForStatus.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Change Status To</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select new status</option>
                      <option value="SUCCESS">Successful</option>
                      <option value="PENDING">Pending</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">
                      <strong>Note:</strong> Changing the payment status will update the payment record in the database.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newStatus && newStatus !== selectedPaymentForStatus.paymentStatus) {
                        handleUpdatePaymentStatus(selectedPaymentForStatus.paymentId, newStatus);
                      }
                    }}
                    disabled={!newStatus || newStatus === selectedPaymentForStatus.paymentStatus || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPayment;
