import React from "react";
import { Routes, Route, Outlet, BrowserRouter, Navigate, Link } from "react-router-dom";
import { CustomAuthProvider, useAuthContext } from "./context/AuthContext";

import Navbar from "./Components/common/Navbar";
import Footer from "./Components/common/Footer";
import HomePage from "./Components/pages/Home";
import Signin from "./Components/pages/Signin";
import UserProfilePage from "./Components/pages/UserProfilePage";
import VendorDashboard from "./Components/pages/VendorDashboard";
import CreateReservation from "./Components/pages/CreateReservation";
import MyReservations from "./Components/pages/MyReservations";
import ReservationDetails from "./Components/pages/ReservationDetails";

import OrganizerDashboard from "./Components/Adminpages/OrganizerDashboard";
import OrganizerReservations from "./Components/Adminpages/OrganizerReservations";
import OrganizerReservationDetails from "./Components/Adminpages/OrganizerReservationDetails";

// 1. Authentication Guard
function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

// 2. Role Authorization Guard (OWASP A01: Broken Access Control Mitigation)
function RequireRole({ role, children }) {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== role) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center px-6 text-center">
        <h1 className="text-4xl font-extrabold text-red-600">403 Forbidden</h1>
        <p className="text-gray-500 mt-2 max-w-md">You do not have permission to access this resource.</p>
        <Link to="/" className="mt-6 text-blue-700 font-semibold hover:underline">Back to Homepage</Link>
      </div>
    );
  }

  return children;
}

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <Navbar />
      <div className="mb-auto">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <CustomAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<HomePage />} />
            <Route path="home" element={<HomePage />} />
            <Route path="sign-in" element={<Signin />} />

            {/* Authenticated Shared Routes */}
            <Route path="profile" element={
              <RequireAuth>
                <UserProfilePage />
              </RequireAuth>
            } />

            {/* Vendor Only Protected Routes */}
            <Route path="dashboard" element={
              <RequireAuth>
                <RequireRole role="Vendor">
                  <VendorDashboard />
                </RequireRole>
              </RequireAuth>
            } />
            <Route path="reservations/create" element={
              <RequireAuth>
                <RequireRole role="Vendor">
                  <CreateReservation />
                </RequireRole>
              </RequireAuth>
            } />
            <Route path="reservations/my" element={
              <RequireAuth>
                <RequireRole role="Vendor">
                  <MyReservations />
                </RequireRole>
              </RequireAuth>
            } />
            <Route path="reservations/:id" element={
              <RequireAuth>
                <RequireRole role="Vendor">
                  <ReservationDetails />
                </RequireRole>
              </RequireAuth>
            } />

            {/* Organizer Only Protected Routes */}
            <Route path="admin" element={
              <RequireAuth>
                <RequireRole role="Organizer">
                  <OrganizerDashboard />
                </RequireRole>
              </RequireAuth>
            } />
            <Route path="admin/reservations" element={
              <RequireAuth>
                <RequireRole role="Organizer">
                  <OrganizerReservations />
                </RequireRole>
              </RequireAuth>
            } />
            <Route path="admin/reservations/:id" element={
              <RequireAuth>
                <RequireRole role="Organizer">
                  <OrganizerReservationDetails />
                </RequireRole>
              </RequireAuth>
            } />

            {/* 404 Route */}
            <Route path="*" element={
              <div className="min-h-[70vh] flex flex-col justify-center items-center px-6 text-center">
                <h1 className="text-4xl font-extrabold text-gray-800">404 Not Found</h1>
                <p className="text-gray-500 mt-2">The page you are looking for does not exist.</p>
                <Link to="/" className="mt-6 text-blue-700 font-semibold hover:underline">Back to Homepage</Link>
              </div>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </CustomAuthProvider>
  );
}

export default App;