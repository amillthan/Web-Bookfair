import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ReservationApi, ExhibitionApi } from "../../services/StallReservationApi";
import { Calendar, ShoppingBag, ArrowLeft, Edit2, AlertCircle, Save, X, File } from "lucide-react";
import DocumentUploader from "../common/DocumentUploader";

export default function ReservationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [exhibitions, setExhibitions] = useState([]);
  const [exhibitionId, setExhibitionId] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [stallType, setStallType] = useState("Standard");
  const [stallSize, setStallSize] = useState("Medium");
  const [numberOfStalls, setNumberOfStalls] = useState(1);
  const [businessCategory, setBusinessCategory] = useState("Other");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentContentBase64, setDocumentContentBase64] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const data = await ReservationApi.getById(id);
      setReservation(data);
      // Initialize edit fields
      setExhibitionId(data.exhibitionId);
      setReservationDate(data.reservationDate);
      setStallType(data.stallType);
      setStallSize(data.stallSize);
      setNumberOfStalls(data.numberOfStalls);
      setBusinessCategory(data.businessCategory);
      setSpecialRequirements(data.specialRequirements || "");
      setDocumentName(data.documentName || "");
      setDocumentContentBase64("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reservation details.");
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

  const startEdit = async () => {
    try {
      const exs = await ExhibitionApi.getAll();
      setExhibitions(exs);
      setIsEditing(true);
    } catch (err) {
      setError("Failed to load exhibitions list.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");

    // Validate date
    const selectedDate = new Date(reservationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError("Reservation date cannot be in the past.");
      return;
    }

    if (numberOfStalls < 1 || numberOfStalls > 3) {
      setError("Number of stalls must be between 1 and 3.");
      return;
    }

    setSaving(true);
    try {
      const updated = await ReservationApi.update(id, {
        exhibitionId: parseInt(exhibitionId),
        reservationDate,
        stallType,
        stallSize,
        numberOfStalls: parseInt(numberOfStalls),
        businessCategory,
        specialRequirements,
        documentName,
        documentContentBase64
      });
      setReservation(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update reservation details.");
    } finally {
      setSaving(false);
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
        <Link to="/reservations/my" className="flex items-center text-blue-700 hover:text-blue-600 font-semibold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Reservations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/reservations/my" className="flex items-center text-blue-700 hover:text-blue-600 font-semibold mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Reservations
      </Link>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header banner */}
        <div className="h-32 bg-gradient-to-r from-blue-700 to-indigo-800 flex items-center justify-between px-8 text-white">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-200">Reservation #{reservation.id}</span>
            <h1 className="text-2xl font-bold mt-1">{reservation.exhibitionName}</h1>
          </div>
          <span className={`inline-flex px-4 py-1.5 text-xs font-bold rounded-full border bg-white ${getStatusBadge(reservation.status)}`}>
            {reservation.status}
          </span>
        </div>

        {/* Content */}
        <div className="p-8">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Exhibition Name</label>
                  <select
                    value={exhibitionId}
                    onChange={(e) => setExhibitionId(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    {exhibitions.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reservation Date</label>
                  <input
                    type="date"
                    value={reservationDate}
                    onChange={(e) => setReservationDate(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stall Type</label>
                  <select
                    value={stallType}
                    onChange={(e) => setStallType(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Corner Stall">Corner Stall</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stall Size</label>
                  <select
                    value={stallSize}
                    onChange={(e) => setStallSize(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Stalls</label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={numberOfStalls}
                    onChange={(e) => setNumberOfStalls(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Category</label>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Handicrafts">Handicrafts</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requirements / Comments</label>
                <textarea
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
                />
              </div>

              {/* Document Upload Area */}
              <div>
                <DocumentUploader
                  onFileSelected={(name, base64) => {
                    setDocumentName(name);
                    setDocumentContentBase64(base64);
                  }}
                  currentFileName={documentName}
                />
              </div>

              <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-50 transition cursor-pointer text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center bg-blue-700 hover:bg-blue-600 text-white rounded-xl py-2 px-4 text-sm font-semibold transition cursor-pointer"
                >
                  {saving ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Details
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8 border-b pb-6">
                {/* Stall Specifications */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Stall Specifications</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Stall Type</span>
                      <span className="font-semibold text-gray-800">{reservation.stallType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Stall Size</span>
                      <span className="font-semibold text-gray-800">{reservation.stallSize}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Stalls Requested</span>
                      <span className="font-semibold text-gray-800">{reservation.numberOfStalls}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Business Category</span>
                      <span className="font-semibold text-gray-800">{reservation.businessCategory}</span>
                    </div>
                  </div>
                </div>

                {/* Scheduling Details */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Scheduling & Date</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Reservation Date</span>
                      <span className="font-semibold text-gray-800 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {reservation.reservationDate}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Submission Date</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 font-medium">Last Modified</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(reservation.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Special Requirements</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 border border-gray-100 min-h-24">
                  {reservation.specialRequirements || "No special requirements specified."}
                </div>
              </div>

              {/* Attached Document Section */}
              <div className="border-t pt-6">
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

              {/* Edit reservation button if Pending */}
              {reservation.status === "Pending" && (
                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={startEdit}
                    className="flex items-center bg-blue-700 hover:bg-blue-600 text-white rounded-xl py-2.5 px-4 text-sm font-semibold shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Modify Booking
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
