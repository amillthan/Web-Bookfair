import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { ExhibitionApi, ReservationApi } from "../../services/StallReservationApi";
import { useNavigate } from "react-router-dom";
import { Calendar, ShoppingBag, PlusCircle, Check } from "lucide-react";
import DocumentUploader from "../common/DocumentUploader";

export default function CreateReservation() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

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
  
  const [loadingExhibitions, setLoadingExhibitions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      setLoadingExhibitions(true);
      const data = await ExhibitionApi.getAll();
      setExhibitions(data);
      if (data.length > 0) {
        setExhibitionId(data[0].id);
      }
    } catch (err) {
      setError("Failed to load active exhibitions.");
    } finally {
      setLoadingExhibitions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validations
    if (!exhibitionId) {
      setError("Please select an exhibition.");
      return;
    }
    if (!reservationDate) {
      setError("Please select a reservation date.");
      return;
    }

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

    setSubmitting(true);
    try {
      await ReservationApi.create({
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
      navigate("/reservations/my");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit reservation. Ensure you haven't exceeded the 3 stalls limit.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create Stall Reservation</h1>
          <p className="text-gray-500 mt-1">Submit your booking request for the upcoming exhibitions.</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Authenticated Username (Read-Only Claim) */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
            <div>
              <span className="block text-xs font-semibold text-blue-600 uppercase tracking-wider">Authenticated Username</span>
              <span className="text-sm font-medium text-gray-700">{user?.username}</span>
            </div>
            <div className="text-right">
              <span className="block text-xs font-semibold text-blue-600 uppercase tracking-wider">Business Name</span>
              <span className="text-sm font-medium text-gray-700">{user?.organizationName || "Not Set (Go to Profile)"}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Exhibition Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Exhibition Name</label>
              {loadingExhibitions ? (
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
              ) : (
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
              )}
            </div>

            {/* Reservation Date */}
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

            {/* Stall Type */}
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

            {/* Stall Size */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Stall Size</label>
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

            {/* Number of Stalls */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Stalls Required</label>
              <input
                type="number"
                min="1"
                max="3"
                value={numberOfStalls}
                onChange={(e) => setNumberOfStalls(e.target.value)}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
              <span className="text-xs text-gray-400 mt-1 block">Maximum 3 stalls allowed per vendor.</span>
            </div>

            {/* Business Category */}
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

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requirements / Comments</label>
            <textarea
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="Any specific requests, stall positioning preference, electrical outlets, etc."
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

          <button
            type="submit"
            disabled={submitting || loadingExhibitions}
            className="w-full flex items-center justify-center bg-blue-700 hover:bg-blue-600 text-white rounded-xl py-3 px-4 text-sm font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-2" /> Submit Reservation Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
