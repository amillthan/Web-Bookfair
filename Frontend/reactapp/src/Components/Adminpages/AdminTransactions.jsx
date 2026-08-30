import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Admin from "../../services/Admin";
import { motion, AnimatePresence } from "framer-motion";

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalAmount: 0,
    successfulCount: 0,
    pendingCount: 0,
    failedCount: 0,
    monthlyRevenue: [],
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const showNotification = (message, type) => {
    console.log(`${type}: ${message}`);
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all payments as transactions
      const transactionsData = await Admin.getAllPayments({
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

      setTransactions(transactionsData.content || []);
      setTotalPages(transactionsData.totalPages || 0);
      setStats({
        totalAmount: totalAmount || 0,
        successfulCount: successfulCount || 0,
        pendingCount: pendingCount || 0,
        failedCount: failedCount || 0,
        monthlyRevenue: [], // You can implement monthly revenue calculation
      });
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transaction data. Please try again.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let data = [...transactions];

    // Search by payment ID, reservation ID, or reference number
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      data = data.filter((transaction) =>
        (transaction.paymentId?.toString() || "").toLowerCase().includes(q) ||
        (transaction.reservationId?.toString() || "").toLowerCase().includes(q) ||
        (transaction.referenceNumber || "").toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      data = data.filter((transaction) => transaction.paymentStatus === statusFilter);
    }

    // Filter by payment method
    if (methodFilter !== "ALL") {
      data = data.filter((transaction) => transaction.paymentMethod === methodFilter);
    }

    // Filter by date range
    if (dateRange !== "ALL") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case "TODAY":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "WEEK":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "MONTH":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "QUARTER":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      if (dateRange !== "ALL") {
        data = data.filter((transaction) =>
          new Date(transaction.createdAt) >= filterDate
        );
      }
    }

    return data;
  }, [transactions, searchTerm, statusFilter, methodFilter, dateRange]);

  // Calculate additional stats from filtered data
  const filteredStats = useMemo(() => {
    const successful = filteredTransactions.filter(t => t.paymentStatus === "SUCCESS");
    const totalFilteredAmount = successful.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      filteredCount: filteredTransactions.length,
      filteredAmount: totalFilteredAmount,
      successRate: filteredTransactions.length > 0
        ? (successful.length / filteredTransactions.length * 100).toFixed(1)
        : 0,
    };
  }, [filteredTransactions]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
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
        return "bg-gray-100 text-white";
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

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ["Payment ID", "Reservation ID", "Amount", "Method", "Status", "Date", "Reference"];
    const csvData = filteredTransactions.map(t => [
      t.paymentId,
      t.reservationId,
      formatCurrency(t.amount),
      t.paymentMethod,
      t.paymentStatus,
      formatDate(t.createdAt),
      t.referenceNumber || ""
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Transaction Analytics</h1>
          <p className="text-slate-300">Comprehensive view of all payment transactions and analytics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-green-400 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-blue-500">{filteredStats.successRate}%</p>
                <p className="text-xs text-slate-400 mt-1">
                  {stats.successfulCount} successful
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Filtered Amount</p>
                <p className="text-2xl font-bold text-purple-500">{formatCurrency(filteredStats.filteredAmount)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {filteredStats.filteredCount} transactions
                </p>
              </div>
              <PieChart className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pendingCount}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Awaiting confirmation
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Successful</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="ALL">All Methods</option>
              <option value="CARD">Card</option>
              <option value="WALLET">Wallet</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="PAYPAL">PayPal</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 days</option>
              <option value="MONTH">Last 30 days</option>
              <option value="QUARTER">Last 3 months</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={fetchTransactions}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-slate-400">Loading transactions...</span>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Reservation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.paymentId} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-mono">
                          #{transaction.paymentId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                          #{transaction.reservationId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-medium">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.paymentStatus)}`}>
                            {getStatusIcon(transaction.paymentStatus)}
                            {transaction.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
                    <div className="text-sm text-slate-400">
                      Showing page {currentPage + 1} of {totalPages} ({filteredTransactions.length} transactions)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="px-3 py-1 bg-slate-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

        {/* Transaction Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedTransaction && (
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
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-4">Transaction Details</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-sm">Transaction ID</label>
                      <p className="text-white font-mono">#{selectedTransaction.paymentId}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm">Reservation ID</label>
                      <p className="text-white">#{selectedTransaction.reservationId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-sm">Amount</label>
                      <p className="text-white font-medium text-lg">{formatCurrency(selectedTransaction.amount)}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm">Payment Method</label>
                      <p className="text-white">{selectedTransaction.paymentMethod}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-sm">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedTransaction.paymentStatus)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTransaction.paymentStatus)}`}>
                        {selectedTransaction.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {selectedTransaction.referenceNumber && (
                    <div>
                      <label className="text-slate-400 text-sm">Reference Number</label>
                      <p className="text-white font-mono">{selectedTransaction.referenceNumber}</p>
                    </div>
                  )}

                  {selectedTransaction.paymentDetails && (
                    <div>
                      <label className="text-slate-400 text-sm">Payment Details</label>
                      <p className="text-white">{selectedTransaction.paymentDetails}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-sm">Created At</label>
                      <p className="text-white text-sm">{formatDate(selectedTransaction.createdAt)}</p>
                    </div>
                    {selectedTransaction.updatedAt && (
                      <div>
                        <label className="text-slate-400 text-sm">Updated At</label>
                        <p className="text-white text-sm">{formatDate(selectedTransaction.updatedAt)}</p>
                      </div>
                    )}
                  </div>
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
      </div>
    </div>
  );
};

export default AdminTransactions;
