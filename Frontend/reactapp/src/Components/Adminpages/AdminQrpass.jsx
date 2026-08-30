import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Check,
  X,
  Copy,
  Download,
  RefreshCw,
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ToggleRight,
  ToggleLeft,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Admin from "../../services/Admin";

// Mock data for development/testing when API returns 403
const MOCK_QR_PASSES = [
  {
    qrId: 1,
    qrCode: "QR-2026-02-15-001",
    active: true,
    usedAt: null,
    createdAt: new Date().toISOString(),
    reservation: { reservationId: 101, stallCode: "A1" },
  },
  {
    qrId: 2,
    qrCode: "QR-2026-02-15-002",
    active: true,
    usedAt: "2026-02-15T10:30:00",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    reservation: { reservationId: 102, stallCode: "A2" },
  },
  {
    qrId: 3,
    qrCode: "QR-2026-02-15-003",
    active: false,
    usedAt: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    reservation: { reservationId: 103, stallCode: "B1" },
  },
];

const AdminQrpass = () => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  const [qrPasses, setQrPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("qrId");
  const [sortDirection, setSortDirection] = useState("desc");

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQrPass, setSelectedQrPass] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // Notification
  const [notification, setNotification] = useState(null);
  const [useMockData, setUseMockData] = useState(false);

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchQrPasses = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await Admin.getAllQrPasses(page, pageSize, sortBy, sortDirection);

      if (response?.content) {
        let filtered = response.content;

        // Apply status filter
        if (selectedStatus === "ACTIVE") {
          filtered = filtered.filter((qr) => qr.active === true);
        } else if (selectedStatus === "INACTIVE") {
          filtered = filtered.filter((qr) => qr.active === false);
        } else if (selectedStatus === "USED") {
          filtered = filtered.filter((qr) => qr.usedAt !== null);
        } else if (selectedStatus === "UNUSED") {
          filtered = filtered.filter((qr) => qr.usedAt === null);
        }

        // Apply search filter
        if (searchTerm.trim()) {
          filtered = filtered.filter(
            (qr) =>
              qr.qrCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              qr.qrId?.toString().includes(searchTerm) ||
              qr.reservation?.reservationId?.toString().includes(searchTerm)
          );
        }

        setQrPasses(filtered);
        setTotalPages(response.totalPages || 1);
        setCurrentPage(page);
        setUseMockData(false);
      }
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      
      // If 403 Forbidden, use mock data with warning
      if (status === 403) {
        console.warn("Access denied (403). Using mock data for development.");
        setUseMockData(true);
        setQrPasses(MOCK_QR_PASSES);
        setTotalPages(1);
        setError("⚠️ Using mock data - Your role may not have QR Pass permissions. Contact admin to enable access.");
      } else {
        const errorMsg = `Error (${status}): ${message || "Failed to load QR passes"}`;
        setError(errorMsg);
        console.error("Error fetching QR passes:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const [total, active, inactive] = await Promise.all([
        Admin.getTotalQrPassesCount(),
        Admin.getActiveQrPassesCount(),
        Admin.getInactiveQrPassesCount(),
      ]);

      setStats({
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
      });
    } catch (err) {
      // On error, use mock stats if using mock data
      if (useMockData || err?.response?.status === 403) {
        const mockActive = MOCK_QR_PASSES.filter(q => q.active).length;
        const mockInactive = MOCK_QR_PASSES.filter(q => !q.active).length;
        setStats({
          total: MOCK_QR_PASSES.length,
          active: mockActive,
          inactive: mockInactive,
        });
      }
      console.error("Error fetching statistics:", err?.response?.status || err.message);
    }
  };

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchQrPasses(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, selectedStatus, searchTerm, sortBy, sortDirection]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleStatus = async (qrPass) => {
    try {
      if (qrPass.active) {
        await Admin.deactivateQrPass(qrPass.qrId);
        showNotification("QR Pass deactivated successfully", "success");
      } else {
        await Admin.activateQrPass(qrPass.qrId);
        showNotification("QR Pass activated successfully", "success");
      }
      
      // If using mock data, update locally
      if (useMockData) {
        setQrPasses(prev => prev.map(q => 
          q.qrId === qrPass.qrId ? { ...q, active: !q.active } : q
        ));
      } else {
        fetchQrPasses(currentPage);
      }
      fetchStatistics();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      showNotification(
        `Error (${status}): ${msg || "Failed to toggle QR pass status"}`,
        "error"
      );
    }
  };

  const handleMarkAsUsed = async (qrPass) => {
    try {
      await Admin.markQrPassAsUsed(qrPass.qrId);
      showNotification("QR Pass marked as used successfully", "success");
      
      // If using mock data, update locally
      if (useMockData) {
        setQrPasses(prev => prev.map(q => 
          q.qrId === qrPass.qrId ? { ...q, usedAt: new Date().toISOString(), active: false } : q
        ));
      } else {
        fetchQrPasses(currentPage);
      }
      fetchStatistics();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      showNotification(
        `Error (${status}): ${msg || "Failed to mark QR pass as used"}`,
        "error"
      );
    }
  };

  const handleDeleteQrPass = async () => {
    if (!selectedQrPass) return;

    try {
      await Admin.deleteQrPass(selectedQrPass.qrId);
      showNotification("QR Pass deleted successfully", "success");
      setShowDeleteModal(false);
      
      // If using mock data, update locally
      if (useMockData) {
        setQrPasses(prev => prev.filter(q => q.qrId !== selectedQrPass.qrId));
      } else {
        fetchQrPasses(currentPage);
      }
      
      setSelectedQrPass(null);
      fetchStatistics();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      showNotification(
        `Error (${status}): ${msg || "Failed to delete QR pass"}`,
        "error"
      );
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard!", "success");
  };

  const handleDownloadQrPass = (qrPass) => {
    // TODO: Implement QR code download functionality
    showNotification("QR Pass download feature coming soon!", "info");
  };

  const openDetailsModal = (qrPass) => {
    setSelectedQrPass(qrPass);
    setShowDetailsModal(true);
  };

  const openDeleteModal = (qrPass) => {
    setSelectedQrPass(qrPass);
    setShowDeleteModal(true);
  };

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  const getStatusBadge = (qrPass) => {
    if (qrPass.usedAt) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/20 border border-green-700">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-green-400">Used</span>
        </div>
      );
    }

    if (!qrPass.active) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-900/20 border border-red-700">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-xs font-semibold text-red-400">Inactive</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-700">
        <CheckCircle className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold text-blue-400">Active</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredQrPasses = useMemo(() => {
    return qrPasses;
  }, [qrPasses]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ===================== HEADER ===================== */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-600">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              QR Pass Management
              {useMockData && (
                <span className="ml-2 px-3 py-1 text-sm font-semibold bg-yellow-600 text-yellow-100 rounded-full">
                  Test Mode
                </span>
              )}
            </h1>
            <button
              onClick={() => {
                fetchQrPasses(currentPage);
                fetchStatistics();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <p className="text-gray-400">
            {useMockData
              ? "Displaying test data - Not connected to API"
              : "Manage all QR passes for event entries and access control"}
          </p>
        </div>

        {/* ===================== STATISTICS ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Total QR Passes</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-600 bg-opacity-20">
                <QrCode className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Active</p>
                <p className="text-3xl font-bold text-green-400">{stats.active}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-600 bg-opacity-20">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Inactive</p>
                <p className="text-3xl font-bold text-red-400">{stats.inactive}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-600 bg-opacity-20">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Used Rate</p>
                <p className="text-3xl font-bold text-purple-400">
                  {stats.total > 0 ? Math.round(((stats.total - stats.active - stats.inactive) / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-600 bg-opacity-20">
                <CheckCircle className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ===================== CONTROLS ===================== */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(0);
                  }}
                  placeholder="Search by QR Code, ID, or Reservation..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="USED">Used</option>
                <option value="UNUSED">Unused</option>
              </select>

              <select
                value={`${sortBy}-${sortDirection}`}
                onChange={(e) => {
                  const [newSortBy, newDirection] = e.target.value.split("-");
                  setSortBy(newSortBy);
                  setSortDirection(newDirection);
                  setCurrentPage(0);
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
              >
                <option value="qrId-desc">Latest First</option>
                <option value="qrId-asc">Oldest First</option>
                <option value="createdAt-desc">Recently Created</option>
              </select>
            </div>
          </div>
        </div>

        {/* ===================== ERROR MESSAGE ===================== */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${
              useMockData
                ? "bg-yellow-900/20 border-yellow-700"
                : "bg-red-900/20 border-red-700"
            }`}
          >
            {useMockData ? (
              <>
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className={useMockData ? "text-yellow-400" : "text-red-400"}>
                    {error}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    ℹ️ Contact your administrator to enable QR Pass management access.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </>
            )}
          </motion.div>
        )}

        {/* ===================== TABLE ===================== */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-gray-400">Loading QR passes...</p>
              </div>
            </div>
          ) : filteredQrPasses.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-gray-600 mx-auto mb-3 opacity-50" />
                <p className="text-gray-400 text-lg">No QR passes found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters or search term</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900 bg-opacity-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Reservation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Used At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQrPasses.map((qrPass, idx) => (
                    <motion.tr
                      key={qrPass.qrId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-700 hover:bg-gray-700 bg-opacity-30 transition"
                    >
                      {/* QR Code */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-blue-400 font-semibold">
                            {qrPass.qrCode?.substring(0, 8)}...
                          </span>
                          <button
                            onClick={() => handleCopyToClipboard(qrPass.qrCode)}
                            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-300 transition"
                            title="Copy QR Code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Reservation */}
                      <td className="px-6 py-4">
                        {qrPass.reservation ? (
                          <div className="text-sm">
                            <p className="text-white font-semibold">Res #{qrPass.reservation.reservationId}</p>
                            <p className="text-gray-400 text-xs">
                              {qrPass.reservation.stallCode || "N/A"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">{getStatusBadge(qrPass)}</td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">{formatDate(qrPass.createdAt)}</div>
                      </td>

                      {/* Used Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {qrPass.usedAt ? (
                            <span className="text-green-400">{formatDate(qrPass.usedAt)}</span>
                          ) : (
                            <span className="text-gray-500">Pending</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* View Details */}
                          <button
                            onClick={() => openDetailsModal(qrPass)}
                            className="p-2 rounded-lg bg-blue-600 bg-opacity-20 text-blue-400 hover:bg-opacity-30 transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Toggle Active/Inactive */}
                          <button
                            onClick={() => handleToggleStatus(qrPass)}
                            className={`p-2 rounded-lg ${
                              qrPass.active
                                ? "bg-green-600 bg-opacity-20 text-green-400 hover:bg-opacity-30"
                                : "bg-red-600 bg-opacity-20 text-red-400 hover:bg-opacity-30"
                            } transition`}
                            title={qrPass.active ? "Deactivate" : "Activate"}
                          >
                            {qrPass.active ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>

                          {/* Mark as Used (only if not already used) */}
                          {!qrPass.usedAt && (
                            <button
                              onClick={() => handleMarkAsUsed(qrPass)}
                              className="p-2 rounded-lg bg-purple-600 bg-opacity-20 text-purple-400 hover:bg-opacity-30 transition"
                              title="Mark as Used"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Download QR */}
                          <button
                            onClick={() => handleDownloadQrPass(qrPass)}
                            className="p-2 rounded-lg bg-cyan-600 bg-opacity-20 text-cyan-400 hover:bg-opacity-30 transition"
                            title="Download QR"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => openDeleteModal(qrPass)}
                            className="p-2 rounded-lg bg-red-600 bg-opacity-20 text-red-400 hover:bg-opacity-30 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===================== PAGINATION ===================== */}
          {!loading && totalPages > 1 && (
            <div className="border-t border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-900 bg-opacity-50">
              <div className="text-sm text-gray-400">
                Page <span className="font-semibold text-white">{currentPage + 1}</span> of{" "}
                <span className="font-semibold text-white">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  const pageNumber =
                    currentPage <= 2 ? idx : Math.min(totalPages - 5, currentPage - 2) + idx;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 rounded-lg transition ${
                        currentPage === pageNumber
                          ? "bg-blue-600 text-white"
                          : "border border-gray-600 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {pageNumber + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-400">
                  Items per page:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm cursor-pointer"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ===================== DETAILS MODAL ===================== */}
        <AnimatePresence>
          {showDetailsModal && selectedQrPass && (
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
                className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-700 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-400" />
                  QR Pass Details
                </h3>

                <div className="space-y-4">
                  {/* QR Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">QR Code</label>
                    <div className="p-3 bg-gray-700 rounded-lg flex items-center justify-between">
                      <code className="text-blue-400 font-mono text-sm">{selectedQrPass.qrCode}</code>
                      <button
                        onClick={() => handleCopyToClipboard(selectedQrPass.qrCode)}
                        className="p-2 hover:bg-gray-600 rounded transition"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Reservation */}
                  {selectedQrPass.reservation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Reservation
                      </label>
                      <div className="p-3 bg-gray-700 rounded-lg">
                        <p className="text-white font-semibold">
                          ID: {selectedQrPass.reservation.reservationId}
                        </p>
                        <p className="text-gray-300 text-sm">
                          Stall: {selectedQrPass.reservation.stallCode || "N/A"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedQrPass)}
                    </div>
                  </div>

                  {/* Created At */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Created At</label>
                    <p className="text-gray-300">{formatDate(selectedQrPass.createdAt)}</p>
                  </div>

                  {/* Used At */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Used At</label>
                    <p className="text-gray-300">
                      {selectedQrPass.usedAt ? formatDate(selectedQrPass.usedAt) : "Not used yet"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== DELETE MODAL ===================== */}
        <AnimatePresence>
          {showDeleteModal && selectedQrPass && (
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
                className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700 shadow-2xl"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-900 bg-opacity-20 mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>

                <h3 className="text-lg font-bold text-white text-center mb-2">Delete QR Pass?</h3>
                <p className="text-gray-400 text-center mb-6">
                  Are you sure you want to delete this QR pass? This action cannot be undone.
                </p>

                <div className="p-3 bg-gray-700 rounded-lg mb-6">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-white">{selectedQrPass.qrCode}</span>
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteQrPass}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== NOTIFICATION ===================== */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
                notification.type === "success"
                  ? "bg-green-600 text-white"
                  : notification.type === "error"
                  ? "bg-red-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {notification.type === "success" && <Check className="w-5 h-5" />}
              {notification.type === "error" && <X className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminQrpass;
