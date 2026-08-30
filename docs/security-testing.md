# Security Testing Document - Stall Reservation System

This document outlines the detailed security verification steps to test authentication, role authorization, resource-level security (IDOR/BOLA), SQL injection resistance, and XSS filtering.

---

## 1. Authentication Scenarios

### Test 1: Accessing Dashboard Without Login
* **Procedure**: Open a fresh incognito browser window and navigate directly to `http://localhost:5173/dashboard`.
* **Expected Result**: Frontend route guards intercept the transition and redirect the browser to the `/sign-in` portal.
* **API Validation**: Send a raw HTTP request without a bearer token:
  ```bash
  curl -i -X GET http://localhost:8088/api/reservations/my
  ```
  *Expected Output*: `401 Unauthorized` with JSON `{"message": "Please login again."}`.

### Test 2: Accessing API with Invalid / Modified Token
* **Procedure**: Send an API request containing a signature-modified or custom dummy JWT token.
  ```bash
  curl -i -X GET http://localhost:8088/api/reservations/my \
    -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.dummy_payload.dummy_signature"
  ```
* **Expected Result**: The backend OAuth2 resource server filter fails signature verification and returns `401 Unauthorized`.

### Test 3: Accessing API with Expired Token
* **Procedure**: Use an access token whose `exp` claim is in the past to query the `/api/reservations/my` endpoint.
* **Expected Result**: Backend validation fails the expiration test and returns `401 Unauthorized`.

---

## 2. Authorization Scenarios (Role Enforcement)

### Test 4: Vendor Accessing Organizer API
* **Procedure**: Authenticate as a user with the **Vendor** role. Capture the access token. Send a request to an organizer-only endpoint:
  ```bash
  curl -i -X GET http://localhost:8088/api/admin/reservations \
    -H "Authorization: Bearer <VENDOR_ACCESS_TOKEN>"
  ```
* **Expected Result**: The Spring Security context registers `ROLE_VENDOR` but lacks `ROLE_ORGANIZER`. The request returns `403 Forbidden` with JSON `{"message": "You do not have permission to access this resource."}`.

---

## 3. Resource-Level Authorization (IDOR / BOLA Prevention)

### Test 5: Vendor Accessing Another Vendor's Reservation
* **Procedure**: Authenticate as **Vendor A** and obtain their token. Find a reservation ID belonging to **Vendor B** (e.g., reservation ID `12`). Send a query:
  ```bash
  curl -i -X GET http://localhost:8088/api/reservations/12 \
    -H "Authorization: Bearer <VENDOR_A_ACCESS_TOKEN>"
  ```
* **Expected Result**: `ReservationServiceImpl.java` checks `verifyOwnershipOrAdmin()`. Since Vendor A's primary key ID does not match the reservation's `vendorUserId`, the service throws an `AccessDeniedException`. The API responds with `403 Forbidden`.

---

## 4. Injection Resistance

### Test 6: SQL Injection in Search Inputs or Form Fields
* **Procedure**: In the "Special Requirements" comment text area of the booking form, submit the following payload:
  ```text
  '; DROP TABLE reservations; --
  ```
* **Expected Result**: The application saves the booking successfully. The comments are saved literally as `'; DROP TABLE reservations; --`. Because the backend utilizes **Entity Framework Core / Spring Data JPA** parameterized mapping queries, the characters are parameterized, and no SQL commands are executed.

---

## 5. Cross-Site Scripting (XSS) Prevention

### Test 7: script Tag Submission
* **Procedure**: Submit a reservation comment or organization name containing standard script payloads:
  ```html
  <script>alert('XSS Test')</script>
  ```
* **Expected Result**: The comment is stored literally in the database. When rendered on the vendor dashboard or admin page, the script does not execute. React's JSX virtual DOM automatically escapes all text nodes, rendering the tags as visible plain text: `&lt;script&gt;alert('XSS Test')&lt;/script&gt;`.
