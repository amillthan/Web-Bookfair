# 🎨 React SPA Frontend - Colombo Book Fair Stall Reservations

This directory contains the Single-Page Application (SPA) frontend developed using **React**, **Vite**, and **Tailwind CSS**. The interface is designed around security best practices, secure state management, and role-based client routing.

---

## 🚀 Key Features

* **OIDC Authentication Context**: Uses `react-oidc-context` (based on `oidc-client-ts`) to implement OAuth2 PKCE token exchange.
* **Axios Interceptor**: Automatically attaches the verified Access Token (`Authorization: Bearer <token>`) to all outgoing requests.
* **Access Control Guards**: Implements route-level protection (`RequireAuth` and `RequireRole`) to enforce Stall Vendor and Exhibition Organizer dashboards.
* **Rich Interactions**: Clean user interfaces utilizing Tailwind CSS for grids/cards, Lucide React icons, and Framer Motion transitions.

---

## 📁 Directory Structure

```
Frontend/reactapp/src/
├── assets/             # Images and design assets
├── animation/          # Animation helper states
├── context/
│   └── AuthContext.jsx # OIDC Authentication context provider
├── services/
│   ├── AxiosInstance.js# Base Axios client with JWT interceptor
│   ├── StallReservationApi.jsx
│   └── UserAccountApi.js
├── Components/
│   ├── common/         # Navbar, Footer, and Shared UI items
│   ├── pages/          # Vendor Views (Dashboard, Bookings, Forms, Profiles)
│   └── Adminpages/     # Organizer Views (Approvals, Dashboards, Stalls)
├── App.jsx             # React Router definitions & Guard wrappers
├── index.css           # Styling directives
└── main.jsx            # React root renderer
```

---

## ⚙ Setup & Configurations

Ensure you have created the local `.env` configuration file in this directory:
```env
VITE_API_BASE_URL=https://localhost:8088/api
VITE_OIDC_AUTHORITY=https://your-domain.auth0.com/
VITE_OIDC_CLIENT_ID=your-client-id
VITE_OIDC_AUDIENCE=https://api.bookfair.com
```

### Development Certificates (Local HTTPS)
Ensure the root `localhost.pem` and `localhost-key.pem` generated via `mkcert` are placed inside this directory. This allows Vite to host local servers over HTTPS matching OIDC callback security parameters.

---

## 🏃 Running Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
The application will launch on: `https://localhost:5173/`

### 3. Build Production Target
To build a static optimized bundle, run:
```bash
npm run build
```
The compiled SPA builds into the `dist/` directory, ready to be deployed to static web hosts.
