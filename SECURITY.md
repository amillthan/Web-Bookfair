# SECURITY.md - Stall Reservation Web Application Security Audit & Mitigations

This document outlines the security architecture, threat model, OWASP Top 10 mitigations, and testing results of the **Secure Exhibition Stall Reservation Web Application**.

---

## 1. Threat Model & Security Architecture

The application handles exhibition bookings and business details for vendors, managed by exhibition organizers. The primary security boundary is the backend API; the client frontend serves as an interactive user boundary.

```
+----------------+      Token Request       +------------------------+
|                | -----------------------> |                        |
| React Frontend | <----------------------- | OIDC Identity Provider |
| (Vite SPA)     |       Access Token       | (Auth0 / Okta)         |
+----------------+                          +------------------------+
        |
        | Send API Requests (Bearer JWT in Authorization Header)
        v
+-----------------------+   Validate JWT via JWKS   +------------------------+
|   Spring Boot API     | ------------------------> | OIDC JWKS Endpoint     |
| (Stateless Backend)   | <------------------------ | (Public Signature Key) |
+-----------------------+                           +------------------------+
        |
        | Parameterized DB Queries
        v
+-------------------+
|  MySQL Database   |
+-------------------+
```

---

## 2. OWASP Top 10 Vulnerability Analysis & Mitigations

### A01:2021 — Broken Access Control
* **Description**: Users bypassing authorization checks to access or modify resources belonging to others (e.g. IDOR).
* **Mitigation**:
  - The API endpoints verify role-based permissions via Spring Security (`hasRole('ROLE_ORGANIZER')` or `hasRole('ROLE_VENDOR')`).
  - Resource-level checks are strictly enforced in `ReservationServiceImpl.java` using `verifyOwnershipOrAdmin()`. A vendor can only view, update, or cancel reservations where `vendorUserId == currentAuthenticatedUserId`.
  - Client-supplied IDs in the request bodies are never trusted for authorization; the identity is resolved JIT from the validated `sub` claim inside the JWT token.

### A02:2021 — Cryptographic Failures
* **Description**: Exposing sensitive data in transit or committing secrets (private keys, database passwords) to source control.
* **Mitigation**:
  - The application is configured to run entirely over **HTTPS** (secured with SSL/TLS) both in local development and production.
  - All application secrets, database credentials, and OIDC keys are externalized into environment variables (managed locally using `.env` and `.gitignore` and in production via hosting vault providers). No credentials are committed to Git.

### A03:2021 — Injection
* **Description**: Unsanitized user inputs causing arbitrary code execution or database command manipulation (e.g. SQL Injection).
* **Mitigation**:
  - Object-Relational Mapping (ORM) is handled via **Entity Framework Core / Spring Data JPA** which utilizes strictly parameterized queries for all database actions.
  - Form validation on the backend validates date constraints, numeric ranges, and enums (e.g. Stall size, categories) before database persistence.

### A04:2021 — Insecure Design
* **Description**: Relying on frontend validation or missing fundamental security constraints in architecture.
* **Mitigation**:
  - Enforced a secure-by-default architecture: all API endpoints under `/api/**` require a validated JWT token except public endpoints.
  - Double-validation: All date and stall limits validated on the frontend are validated again on the backend.

### A05:2021 — Security Misconfiguration
* **Description**: Insecure default settings, open CORS, or verbose error logs disclosing stack traces.
* **Mitigation**:
  - CORS is restricted exclusively to the authorized origin defined in `app.frontend.origin` (no `AllowAnyOrigin()` with credentials).
  - Explicit secure security headers are added to every HTTP response (Content-Security-Policy, Frame-Options, Referrer-Policy).
  - `GlobalExceptionHandler.java` catches all exceptions, logs the details internally, and returns generic user-friendly JSON payloads (e.g. `500 Internal Server Error` with no stack traces or database info).

### A06:2021 — Vulnerable and Outdated Components
* **Description**: Using unmaintained frameworks or packages with known security exploits.
* **Mitigation**:
  - Built using standard maintained versions of Java 21, Spring Boot, React 19, and Vite.
  - Production builds lock package versions via `package-lock.json` and regular scanning is implemented via `npm audit`.

### A07:2021 — Identification and Authentication Failures
* **Description**: Weak passwords, custom authentication vulnerabilities, or unvalidated login sessions.
* **Mitigation**:
  - Outsourced user credentials and login flows entirely to an **OIDC Identity Provider (Auth0/Okta)** using the state-of-the-art **PKCE Authorization Code Flow**.
  - Access tokens are validated against public keys fetched dynamically from the IdP's official JWKS endpoint.

### A08:2021 — Software and Data Integrity Failures
* **Description**: Blindly accepting untrusted code dependencies or unverified data structures.
* **Mitigation**:
  - Avoided ad-hoc external packages on both frontend and backend.
  - Version verification enabled via lockfiles.

### A09:2021 — Security Logging and Monitoring Failures
* **Description**: Under-logging security events or logging highly sensitive credentials.
* **Mitigation**:
  - High-priority security and database state changes are logged using SLF4J loggers.
  - Prevented credential logging: Since authentication is managed off-site via OIDC, passwords and raw credentials never touch our logs.

### A10:2021 — Server-Side Request Forgery (SSRF)
* **Description**: Application fetching arbitrary remote URLs.
* **Mitigation**:
  - The application only queries configured OIDC provider discovery endpoints (derived safely from the static configuration `spring.security.oauth2.resourceserver.jwt.issuer-uri`).

---

## 3. OIDC Authentication & JWT Validation Architecture

Access tokens passed in the `Authorization: Bearer <JWT>` header are validated:
1. **Signature**: Verified against the public keys retrieved from the IdP's `.well-known/jwks.json` endpoint.
2. **Issuer**: Confirmed to match the configured OIDC Authority.
3. **Audience**: Verified to match the registered resource audience claim.
4. **Expiration**: Enforced strictly via claims check.

---

## 4. Security Test Results

| Test Scenario | Action | Expected Output | Status |
|---|---|---|---|
| **Test 1** | Unauthenticated user accesses Dashboard page or calls `/api/reservations/my` | Redirects to `/sign-in` (frontend) / Returns `401 Unauthorized` (API) | **PASSED** |
| **Test 2** | Vendor accesses their own reservation | Returns `200 OK` with reservation JSON | **PASSED** |
| **Test 3** | Vendor attempts to access another vendor's reservation (IDOR check) | Returns `403 Forbidden` / Prevents access | **PASSED** |
| **Test 4** | Vendor calls Organizer API (`/api/admin/**`) | Returns `403 Forbidden` | **PASSED** |
| **Test 5** | Call API with an invalid / malformed JWT token | Returns `401 Unauthorized` | **PASSED** |
| **Test 6** | Call API with an expired JWT token | Returns `401 Unauthorized` | **PASSED** |
| **Test 7** | Input SQL injection string (e.g. `' OR '1'='1`) into form | Input safely stored as a literal string parameter; no DB manipulation occurs. | **PASSED** |
| **Test 8** | Input script tag (e.g. `<script>alert('XSS')</script>`) | Input safely escaped by React virtual DOM rendering; script does not execute. | **PASSED** |
| **Test 9** | Submit reservation with a past date | Returns `400 Bad Request` with message: "Reservation date cannot be in the past." | **PASSED** |
| **Test 10** | Submit reservation with negative or excess stalls (>3) | Returns `400 Bad Request` with business rule error message. | **PASSED** |
