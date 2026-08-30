# API Specification - Stall Reservation Web Application

This document specifies the REST API endpoints exposed by the backend service. All endpoints (except public options or preflight routes) require a cryptographically signed OAuth2/OIDC Access Token passed via HTTP headers.

---

## 🔐 Security & Headers

All requests to secured endpoints must include the following header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```
* **Base URL**: `https://localhost:8088` (SSL/TLS required)
* **Default Response Content-Type**: `application/json`

---

## 🗂 Endpoint Directory

- **[Authentication](#1-authentication)**
  - `GET /api/auth/me` — Retrieve session profile
  - `POST /api/auth/logout` — Terminate session
- **[Exhibitions](#2-exhibitions)**
  - `GET /api/exhibitions` — List active exhibitions
  - `GET /api/exhibitions/{id}` — Fetch exhibition details
- **[User Profile](#3-user-profile)**
  - `GET /api/profile` — Fetch user profile
  - `PUT /api/profile` — Update user profile details
- **[Reservations (Stall Vendor)](#4-reservations-stall-vendor)**
  - `POST /api/reservations` — Create reservation
  - `GET /api/reservations/my` — List current user's reservations
  - `GET /api/reservations/{id}` — Fetch specific reservation details
  - `PUT /api/reservations/{id}` — Update a pending reservation
  - `DELETE /api/reservations/{id}` — Cancel a reservation request
- **[Reservations Administration (Exhibition Organizer)](#5-reservations-administration-exhibition-organizer)**
  - `GET /api/admin/reservations` — List all reservations
  - `GET /api/admin/reservations/{id}` — Fetch any reservation
  - `PUT /api/admin/reservations/{id}/status` — Update reservation status
  - `DELETE /api/admin/reservations/{id}` — Delete a reservation permanently

---

## 1. Authentication

### GET `/api/auth/me`
Retrieve user claims and JIT profile details for the currently logged-in user.
* **Role**: Authenticated (`ROLE_VENDOR` or `ROLE_ORGANIZER`)
* **Response `200 OK`**:
```json
{
  "message": "Current authenticated user profile",
  "data": {
    "id": 1,
    "identityProviderUserId": "auth0|mock-vendor-id-123",
    "username": "vendor1",
    "name": "John Doe",
    "email": "vendor@bookfair.com",
    "contactNumber": "+94771234567",
    "organizationName": "Doe Publishers Ltd",
    "role": "Vendor",
    "createdAt": "2026-08-28T03:04:12"
  },
  "status": 200
}
```

### POST `/api/auth/logout`
Signal the application session termination. The client should clear JWT tokens from local storage.
* **Role**: Authenticated
* **Response `200 OK`**:
```json
{
  "message": "Session terminated. Clear client token storage.",
  "data": null,
  "status": 200
}
```

---

## 2. Exhibitions

### GET `/api/exhibitions`
List all active exhibitions available for reservation.
* **Role**: `ROLE_VENDOR` or `ROLE_ORGANIZER`
* **Response `200 OK`**:
```json
{
  "message": "Active exhibitions retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Colombo International Trade Exhibition",
      "description": "The premier international trade exhibition in Colombo...",
      "eventDate": "2026-10-15",
      "isActive": true,
      "createdAt": "2026-08-28T03:04:12"
    }
  ],
  "status": 200
}
```

### GET `/api/exhibitions/{id}`
Retrieve details for a specific exhibition by its database primary ID.
* **Role**: `ROLE_VENDOR` or `ROLE_ORGANIZER`
* **Response `200 OK`**:
```json
{
  "message": "Exhibition retrieved successfully",
  "data": {
    "id": 1,
    "name": "Colombo International Trade Exhibition",
    "description": "The premier international trade exhibition in Colombo...",
    "eventDate": "2026-10-15",
    "isActive": true,
    "createdAt": "2026-08-28T03:04:12"
  },
  "status": 200
}
```

---

## 3. User Profile

### GET `/api/profile`
Retrieve detailed profile information for the authenticated user.
* **Role**: `ROLE_VENDOR` or `ROLE_ORGANIZER`
* **Response `200 OK`**:
```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "identityProviderUserId": "auth0|mock-vendor-id-123",
    "username": "vendor1",
    "name": "John Doe",
    "email": "vendor@bookfair.com",
    "contactNumber": "+94771234567",
    "organizationName": "Doe Publishers Ltd",
    "role": "Vendor",
    "createdAt": "2026-08-28T03:04:12"
  },
  "status": 200
}
```

### PUT `/api/profile`
Update changeable profile fields for the authenticated user.
* **Role**: `ROLE_VENDOR` or `ROLE_ORGANIZER`
* **Request Body**:
```json
{
  "name": "John Doe Updated",
  "contactNumber": "+94771234567",
  "organizationName": "Doe Publishing Group"
}
```
* **Response `200 OK`**:
```json
{
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "identityProviderUserId": "auth0|mock-vendor-id-123",
    "username": "vendor1",
    "name": "John Doe Updated",
    "email": "vendor@bookfair.com",
    "contactNumber": "+94771234567",
    "organizationName": "Doe Publishing Group",
    "role": "Vendor",
    "createdAt": "2026-08-28T03:04:12"
  },
  "status": 200
}
```

---

## 4. Reservations (Stall Vendor)

### POST `/api/reservations`
Submit a new stall reservation request.
* **Role**: `ROLE_VENDOR`
* **Request Body Validation Constraints**:
  * `exhibitionId`: Required (must correspond to an active exhibition).
  * `reservationDate`: Required. Format: `YYYY-MM-DD` (must be today or in the future).
  * `stallType`: Required. Allowed values: `Standard`, `Premium`, `Corner Stall`.
  * `stallSize`: Required. Allowed values: `Small`, `Medium`, `Large`.
  * `numberOfStalls`: Required. Range: `1` to `3` (a vendor can own at most `3` stalls in total across active bookings).
  * `businessCategory`: Required. Allowed values: `Food & Beverage`, `Clothing`, `Electronics`, `Handicrafts`, `Services`, `Other`.
  * `specialRequirements`: Max `1000` characters.
* **Request Body**:
```json
{
  "exhibitionId": 1,
  "reservationDate": "2026-10-15",
  "stallType": "Premium",
  "stallSize": "Medium",
  "numberOfStalls": 2,
  "businessCategory": "Handicrafts",
  "specialRequirements": "Need power outlet near back wall."
}
```
* **Response `201 Created`**:
```json
{
  "message": "Reservation request submitted successfully",
  "data": {
    "id": 10,
    "vendorUserId": 1,
    "vendorUsername": "vendor1",
    "vendorName": "John Doe",
    "vendorEmail": "vendor@bookfair.com",
    "organizationName": "Doe Publishers Ltd",
    "exhibitionId": 1,
    "exhibitionName": "Colombo International Trade Exhibition",
    "reservationDate": "2026-10-15",
    "stallType": "Premium",
    "stallSize": "Medium",
    "numberOfStalls": 2,
    "businessCategory": "Handicrafts",
    "specialRequirements": "Need power outlet near back wall.",
    "status": "Pending",
    "createdAt": "2026-08-28T03:10:45",
    "updatedAt": "2026-08-28T03:10:45"
  },
  "status": 201
}
```

### GET `/api/reservations/my`
List all stall reservation requests made by the authenticated vendor.
* **Role**: `ROLE_VENDOR`
* **Response `200 OK`**:
```json
{
  "message": "Reservations retrieved successfully",
  "data": [
    {
      "id": 10,
      "vendorUserId": 1,
      "vendorUsername": "vendor1",
      "vendorName": "John Doe",
      "exhibitionId": 1,
      "exhibitionName": "Colombo International Trade Exhibition",
      "reservationDate": "2026-10-15",
      "stallType": "Premium",
      "stallSize": "Medium",
      "numberOfStalls": 2,
      "businessCategory": "Handicrafts",
      "specialRequirements": "Need power outlet near back wall.",
      "status": "Pending",
      "createdAt": "2026-08-28T03:10:45",
      "updatedAt": "2026-08-28T03:10:45"
    }
  ],
  "status": 200
}
```

### GET `/api/reservations/{id}`
Retrieve details of a specific reservation. Enforces Object-Level Authorization (IDOR boundary checks).
* **Role**: `ROLE_VENDOR` (must own the booking) or `ROLE_ORGANIZER`
* **Response `200 OK`**:
```json
{
  "message": "Reservation details retrieved successfully",
  "data": {
    "id": 10,
    "vendorUserId": 1,
    "vendorUsername": "vendor1",
    "exhibitionId": 1,
    "exhibitionName": "Colombo International Trade Exhibition",
    "reservationDate": "2026-10-15",
    "stallType": "Premium",
    "stallSize": "Medium",
    "numberOfStalls": 2,
    "businessCategory": "Handicrafts",
    "specialRequirements": "Need power outlet.",
    "status": "Pending",
    "createdAt": "2026-08-28T03:10:45",
    "updatedAt": "2026-08-28T03:10:45"
  },
  "status": 200
}
```
* **Error Response `403 Forbidden`** (if Vendor B queries Vendor A's reservation):
```json
{
  "message": "Access denied: You do not have permission to access this resource."
}
```

### PUT `/api/reservations/{id}`
Update an existing reservation details.
* **Role**: `ROLE_VENDOR` (must own the booking)
* **Constraints**:
  * Modifications are allowed only while the status is `Pending`.
  * The cumulative stall count limit of `3` remains strictly enforced.
* **Request Body**:
```json
{
  "exhibitionId": 1,
  "reservationDate": "2026-10-16",
  "stallType": "Premium",
  "stallSize": "Large",
  "numberOfStalls": 1,
  "businessCategory": "Handicrafts",
  "specialRequirements": "Power outlet and extra chair."
}
```
* **Response `200 OK`**:
```json
{
  "message": "Reservation updated successfully",
  "data": {
    "id": 10,
    "vendorUserId": 1,
    "exhibitionId": 1,
    "reservationDate": "2026-10-16",
    "stallType": "Premium",
    "stallSize": "Large",
    "numberOfStalls": 1,
    "businessCategory": "Handicrafts",
    "status": "Pending",
    "createdAt": "2026-08-28T03:10:45",
    "updatedAt": "2026-08-28T03:15:30"
  },
  "status": 200
}
```

### DELETE `/api/reservations/{id}`
Soft-cancel a reservation request by updating its status to `Cancelled`.
* **Role**: `ROLE_VENDOR` (must own the booking) or `ROLE_ORGANIZER`
* **Response `200 OK`**:
```json
{
  "message": "Reservation cancelled successfully",
  "data": null,
  "status": 200
}
```

---

## 5. Reservations Administration (Exhibition Organizer)

### GET `/api/admin/reservations`
Fetch all reservations submitted in the system.
* **Role**: `ROLE_ORGANIZER`
* **Response `200 OK`**:
```json
{
  "message": "All reservations retrieved successfully for organizers",
  "data": [
    {
      "id": 10,
      "vendorUserId": 1,
      "vendorName": "John Doe",
      "exhibitionName": "Colombo International Trade Exhibition",
      "reservationDate": "2026-10-16",
      "numberOfStalls": 1,
      "status": "Pending",
      "createdAt": "2026-08-28T03:10:45"
    }
  ],
  "status": 200
}
```

### GET `/api/admin/reservations/{id}`
Retrieve any vendor's reservation details by ID.
* **Role**: `ROLE_ORGANIZER`
* **Response `200 OK`**:
```json
{
  "message": "Reservation retrieved successfully",
  "data": {
    "id": 10,
    "vendorUserId": 1,
    "vendorUsername": "vendor1",
    "exhibitionId": 1,
    "reservationDate": "2026-10-16",
    "stallType": "Premium",
    "numberOfStalls": 1,
    "status": "Pending"
  },
  "status": 200
}
```

### PUT `/api/admin/reservations/{id}/status`
Update the booking status of a vendor's reservation request.
* **Role**: `ROLE_ORGANIZER`
* **Request Body**:
```json
{
  "status": "Approved"
}
```
*Allowed statuses: `Pending`, `Approved`, `Rejected`, `Cancelled`.*
* **Response `200 OK`**:
```json
{
  "message": "Reservation status updated to: Approved",
  "data": {
    "id": 10,
    "vendorUserId": 1,
    "status": "Approved"
  },
  "status": 200
}
```

### DELETE `/api/admin/reservations/{id}`
Permanently delete a reservation record from the database.
* **Role**: `ROLE_ORGANIZER`
* **Response `200 OK`**:
```json
{
  "message": "Reservation deleted successfully",
  "data": null,
  "status": 200
}
```
