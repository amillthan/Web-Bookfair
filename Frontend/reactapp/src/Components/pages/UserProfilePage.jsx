import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { ProfileApi } from "../../services/StallReservationApi";
import { User, Mail, Shield, Phone, Building, Save } from "lucide-react";

export default function UserProfilePage() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [contactNumber, setContactNumber] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await ProfileApi.get();
      setProfile(data);
      setContactNumber(data.contactNumber || "");
      setOrganizationName(data.organizationName || "");
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load user profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setSaving(true);
    try {
      const updated = await ProfileApi.update({
        name: profile.name,
        contactNumber,
        organizationName
      });
      setProfile(updated);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile details." });
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Banner Section */}
        <div className="h-32 bg-gradient-to-r from-blue-700 to-indigo-800 flex items-center px-8 text-white">
          <div>
            <h1 className="text-3xl font-bold">{user?.name}</h1>
            <p className="text-blue-100 mt-1">Manage your identity and business details</p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8">
          {message.text && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* OIDC Information (Read-only) */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Verified OIDC Identity</h2>
              
              <div className="flex items-center space-x-3 text-gray-700">
                <Shield className="text-blue-600 w-5 h-5 flex-shrink-0" />
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Provider User ID (sub)</label>
                  <p className="text-sm font-mono text-gray-800 break-all">{profile?.identityProviderUserId}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-700">
                <User className="text-blue-600 w-5 h-5 flex-shrink-0" />
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Username</label>
                  <p className="text-sm text-gray-800">{profile?.username}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-700">
                <Mail className="text-blue-600 w-5 h-5 flex-shrink-0" />
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Email Address</label>
                  <p className="text-sm text-gray-800">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-700">
                <Shield className="text-blue-600 w-5 h-5 flex-shrink-0" />
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase">User Role</label>
                  <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full mt-1 ${
                    profile?.role === "Organizer" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {profile?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Profile Information */}
            <div>
              <form onSubmit={handleSave} className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Business & Contact Info</h2>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-blue-600" /> Contact Number
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Building className="w-4 h-4 mr-2 text-blue-600" /> Organization / Business Name
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Enter your registered business name"
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center bg-blue-700 hover:bg-blue-600 text-white rounded-xl py-3 px-4 text-sm font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
