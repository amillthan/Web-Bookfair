import React, { useState, useEffect } from "react";
import Admin from "../../services/Admin";

const AdminNotification = () => {
  const [emailNotifications, setEmailNotifications] = useState([]);
  const [failedNotifications, setFailedNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Fetch all email notifications with pagination using Admin service
  useEffect(() => {
    fetchEmailNotifications();
    fetchFailedNotifications();
  }, [currentPage, pageSize]);

  const fetchEmailNotifications = async () => {
    setLoading(true);
    try {
      const page = await Admin.getAllEmailNotifications({
        page: currentPage,
        size: pageSize,
      });
      setEmailNotifications(page?.content || []);
      setTotalPages(page?.totalPages ?? 0);
      setMessageType("");
    } catch (error) {
      console.error("Error fetching notifications:", error);
      showMessage("Failed to load email notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFailedNotifications = async () => {
    try {
      const list = await Admin.getFailedEmailNotifications();
      setFailedNotifications(list || []);
    } catch (error) {
      console.error("Error fetching failed notifications:", error);
    }
  };

  const resendEmailNotification = async (notificationId) => {
    try {
      await Admin.resendEmailNotification(notificationId);
      showMessage("Email notification resent successfully!", "success");
      fetchEmailNotifications();
      fetchFailedNotifications();
    } catch (error) {
      console.error("Error resending notification:", error);
      showMessage("Failed to resend notification", "error");
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "SENT":
        return "bg-green-500/20 border-green-500 text-green-400";
      case "FAILED":
        return "bg-red-500/20 border-red-500 text-red-400";
      case "PENDING":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
      default:
        return "bg-slate-500/20 border-slate-500 text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📧 Email Notifications</h1>
          <p className="text-slate-400">
            Manage and monitor all email notifications sent to users
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              messageType === "success"
                ? "bg-green-500/20 border-green-500 text-green-200"
                : "bg-red-500/20 border-red-500 text-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Sent</p>
                <p className="text-3xl font-bold text-green-400">
                  {emailNotifications.length}
                </p>
              </div>
              <span className="text-4xl">✓</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Failed</p>
                <p className="text-3xl font-bold text-red-400">
                  {failedNotifications.length}
                </p>
              </div>
              <span className="text-4xl">✕</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Pages</p>
                <p className="text-3xl font-bold text-blue-400">{totalPages}</p>
              </div>
              <span className="text-4xl">📄</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Page Size</p>
                <p className="text-3xl font-bold text-purple-400">{pageSize}</p>
              </div>
              <span className="text-4xl">⚙️</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Email Notifications Table */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">All Email Notifications</h2>

            {loading ? (
              <div className="text-slate-400 text-center py-12">
                <div className="inline-block animate-spin">⏳</div> Loading...
              </div>
            ) : emailNotifications.length === 0 ? (
              <div className="text-slate-400 text-center py-12">
                No email notifications found
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {emailNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg hover:bg-slate-700/50 transition-all cursor-pointer"
                    onClick={() => setSelectedNotification(notif)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-semibold">{notif.subject}</p>
                        <p className="text-slate-400 text-sm">
                          To: {notif.recipientEmail}
                        </p>
                        <p className="text-slate-500 text-xs mt-2">
                          {new Date(notif.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(
                          notif.emailStatus
                        )}`}
                      >
                        {notif.emailStatus}
                      </span>
                    </div>

                    {notif.emailStatus === "FAILED" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resendEmailNotification(notif.id);
                        }}
                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Resend Email
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-600">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-slate-400">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          </div>

          {/* Failed Notifications & Details */}
          <div className="space-y-6">
            {/* Failed Notifications */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Failed Notifications</h3>

              {failedNotifications.length === 0 ? (
                <p className="text-slate-400 text-center py-6">All notifications sent successfully!</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {failedNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
                    >
                      <p className="text-red-200 text-xs font-semibold truncate">
                        {notif.subject}
                      </p>
                      <button
                        onClick={() => resendEmailNotification(notif.id)}
                        className="mt-2 w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        Resend
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Notification Details */}
            {selectedNotification && (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">📋 Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-400">Subject</p>
                    <p className="text-white font-semibold">
                      {selectedNotification.subject}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Recipient</p>
                    <p className="text-white font-semibold">
                      {selectedNotification.recipientEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <p
                      className={`font-semibold ${
                        selectedNotification.emailStatus === "SENT"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {selectedNotification.emailStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Sent At</p>
                    <p className="text-white font-semibold">
                      {new Date(selectedNotification.sentAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotification;