import React, { useEffect, useState } from "react";
import { AdminReservationApi } from "../../services/StallReservationApi";
import { Link } from "react-router-dom";
import { Users, FileText, Clock, CheckCircle, XCircle, ChevronRight, Calendar } from "lucide-react";

export default function OrganizerDashboard() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVendors: 0, total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await AdminReservationApi.getAll();
      setReservations(data);
      
      // Calculate statistics
      const pending = data.filter((r) => r.status === "Pending").length;
      const approved = data.filter((r) => r.status === "Approved").length;
      const rejected = data.filter((r) => r.status === "Rejected").length;
      
      // Get unique vendor IDs
      const uniqueVendorIds = new Set(data.map((r) => r.vendorUserId));
      
      setStats({
        totalVendors: uniqueVendorIds.size,
        total: data.length,
        pending,
        approved,
        rejected
      });
    } catch (err) {
      console.error("Failed to load admin stats", err);
    } finally {
      setLoading(false);
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

  const recentRequests = reservations.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Welcome Header */}
      <div className="mb-10">
        <span className="bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
          Organizer Control Panel
        </span>
        <h1 className="text-3xl font-bold text-gray-800 mt-3">Exhibition Management Overview</h1>
        <p className="text-gray-500 mt-1">Review bookings, approve stall requests, and monitor vendors.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-purple-50 p-3.5 rounded-xl mr-4 text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Vendors</span>
            <span className="text-2xl font-bold text-gray-800">{stats.totalVendors}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-blue-50 p-3.5 rounded-xl mr-4 text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Bookings</span>
            <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-yellow-50 p-3.5 rounded-xl mr-4 text-yellow-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</span>
            <span className="text-2xl font-bold text-gray-800">{stats.pending}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-green-50 p-3.5 rounded-xl mr-4 text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved</span>
            <span className="text-2xl font-bold text-gray-800">{stats.approved}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-red-50 p-3.5 rounded-xl mr-4 text-red-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Rejected</span>
            <span className="text-2xl font-bold text-gray-800">{stats.rejected}</span>
          </div>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Recent Booking Requests</h2>
          <Link to="/admin/reservations" className="text-purple-700 hover:text-purple-600 text-sm font-semibold flex items-center">
            Manage All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No booking requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Business</th>
                  <th className="p-4">Exhibition</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Stalls</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {recentRequests.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-semibold text-gray-800">{res.vendorName}</td>
                    <td className="p-4">{res.organizationName || "N/A"}</td>
                    <td className="p-4">{res.exhibitionName}</td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {res.reservationDate}
                      </div>
                    </td>
                    <td className="p-4 text-center font-semibold">{res.numberOfStalls}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(res.status)}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        to={`/admin/reservations/${res.id}`}
                        className="text-purple-700 hover:text-purple-600 font-semibold inline-flex items-center text-xs"
                      >
                        Review <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
