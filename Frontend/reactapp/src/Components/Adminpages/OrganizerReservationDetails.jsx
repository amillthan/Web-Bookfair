import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminReservationApi, ReservationApi } from "../../services/StallReservationApi";
import { Calendar, User, Mail, Phone, Building, ArrowLeft, Check, X, Ban, File } from "lucide-react";

export default function OrganizerReservationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const data = await AdminReservationApi.getById(id);
      setReservation(data);
    } catch (err) {
      setError("Failed to load reservation details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await ReservationApi.downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const contentDisposition = response.headers["content-disposition"];
      let filename = reservation.documentName || "document";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error", err);
      setError("Failed to download the document. Please try again.");
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!window.confirm(`Are you sure you want to change the status of this reservation to ${status}?`)) return;
    setUpdating(true);
    try {
      const updated = await AdminReservationApi.updateStatus(id, status);
      setReservation(updated);
    } catch (err) {
      setError(`Failed to update status to ${status}.`);
    } finally {
      setUpdating(false);
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

  if (error && !reservation) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium mb-6">
          {error}
        </div>
        <Link to="/admin/reservations" className="flex items-center text-purple-700 hover:text-purple-600 font-semibold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reservations List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/admin/reservations" className="flex items-center text-purple-700 hover:text-purple-600 font-semibold mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reservations List
      </Link>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-purple-700 to-indigo-800 flex items-center justify-between px-8 text-white">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-purple-200">Organizer Review Mode</span>
            <h1 className="text-2xl font-bold mt-1">Stall Request #{reservation.id}</h1>
          </div>
          <span className={`inline-flex px-4 py-1.5 text-xs font-bold rounded-full border bg-white ${getStatusBadge(reservation.status)}`}>
            {reservation.status}
          </span>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8 border-b pb-8 mb-8">
            {/* Vendor Profile Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Vendor Information</h3>
              
              <div className="flex items-center text-sm text-gray-700">
                <User className="w-4.5 h-4.5 mr-3 text-purple-600" />
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Contact Name</span>
                  <span className="font-semibold text-gray-800">{reservation.vendorName}</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <Building className="w-4.5 h-4.5 mr-3 text-purple-600" />
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Organization / Business</span>
                  <span className="font-semibold text-gray-800">{reservation.organizationName || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <Mail className="w-4.5 h-4.5 mr-3 text-purple-600" />
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Email Address</span>
                  <span className="font-semibold text-gray-800">{reservation.vendorEmail}</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-700">
                <Phone className="w-4.5 h-4.5 mr-3 text-purple-600" />
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase">Contact Number</span>
                  <span className="font-semibold text-gray-800">{reservation.contactNumber || "No contact number"}</span>
                </div>
              </div>
            </div>

            {/* Stall Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Stall Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Exhibition Name</span>
                  <span className="font-semibold text-gray-800">{reservation.exhibitionName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Reservation Date</span>
                  <span className="font-semibold text-gray-800 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {reservation.reservationDate}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Stall Type</span>
                  <span className="font-semibold text-gray-800">{reservation.stallType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Preferred Stall Size</span>
                  <span className="font-semibold text-gray-800">{reservation.stallSize}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Stalls Required</span>
                  <span className="font-semibold text-gray-800">{reservation.numberOfStalls}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">Business Category</span>
                  <span className="font-semibold text-gray-800">{reservation.businessCategory}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments / Special Requirements */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Special Requirements / Comments</h3>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 border border-gray-100 min-h-24">
              {reservation.specialRequirements || "No comments or special requirements provided."}
            </div>
          </div>

          {/* Attached Document Section */}
          <div className="border-t pt-6 mb-8 text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Attached Document</h3>
            {reservation.documentName ? (
              <div className="flex items-center justify-between p-4 bg-blue-50/30 border border-blue-100 rounded-2xl max-w-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100/50 text-blue-600 rounded-xl">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{reservation.documentName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Securely uploaded document</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  Download
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No document attached.</p>
            )}
          </div>

          {/* Organizer Approval Actions */}
          <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              Submitted on: {new Date(reservation.createdAt).toLocaleString()}
            </div>
            
            <div className="flex space-x-2">
              {updating ? (
                <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent animate-spin rounded-full"></div>
              ) : (
                <>
                  {reservation.status === "Pending" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus("Approved")}
                        className="flex items-center bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 px-4 text-sm font-semibold transition shadow-md hover:shadow-lg cursor-pointer"
                      >
                        <Check className="w-4 h-4 mr-2" /> Approve Request
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("Rejected")}
                        className="flex items-center bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 px-4 text-sm font-semibold transition shadow-md hover:shadow-lg cursor-pointer"
                      >
                        <X className="w-4 h-4 mr-2" /> Reject Request
                      </button>
                    </>
                  )}
                  {reservation.status === "Approved" && (
                    <button
                      onClick={() => handleUpdateStatus("Cancelled")}
                      className="flex items-center bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2 px-4 text-sm font-semibold transition shadow-md hover:shadow-lg cursor-pointer"
                    >
                      <Ban className="w-4 h-4 mr-2" /> Cancel Reservation
                    </button>
                  )}
                  {reservation.status === "Cancelled" && (
                    <button
                      onClick={() => handleUpdateStatus("Pending")}
                      className="flex items-center bg-gray-500 hover:bg-gray-600 text-white rounded-xl py-2 px-4 text-sm font-semibold transition shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Re-open Pending
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
