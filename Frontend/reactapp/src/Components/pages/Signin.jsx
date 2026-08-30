import React, { useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogIn, AlertCircle } from "lucide-react";

export default function Signin() {
  const { isAuthenticated, isLoading, login, error, user } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "Organizer") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLoginClick = () => {
    login();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 mt-4 font-medium">Redirecting to Identity Provider...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
        <div className="inline-flex p-4 bg-blue-50 rounded-full text-blue-600 mb-6 border border-blue-100">
          <ShieldCheck className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-800">Secure Sign In</h1>
        <p className="text-gray-500 mt-2 mb-6">
          Access the stall reservation system using OIDC Single Sign-On (SSO).
        </p>

        {error && (
          <div className="flex items-center p-4 mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-left font-medium">Authentication error: {error.message || "Failed to contact provider."}</span>
          </div>
        )}

        <button
          onClick={handleLoginClick}
          className="w-full flex items-center justify-center bg-blue-700 hover:bg-blue-600 text-white rounded-xl py-3 px-4 font-bold shadow-lg hover:shadow-xl transition cursor-pointer"
        >
          <LogIn className="w-5 h-5 mr-2" /> Log In with SSO Provider
        </button>

        <div className="mt-6 border-t pt-4 text-xs text-gray-400">
          Secure authentication is handled directly by our OIDC cloud identity provider. Your credentials are never stored or transmitted through our local servers.
        </div>
      </div>
    </div>
  );
}