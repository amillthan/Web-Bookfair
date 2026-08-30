# 📚 Secure Exhibition Stall Reservation Web Application

This repository contains a production-grade, secure web application for managing exhibition stall reservations for the **Colombo International Book Fair 2026**.

The system implements OIDC authentication via **Asgardeo**, JIT user provisioning, role-based dashboards (Stall Vendor vs. Exhibition Organizer), and input-validated bookings. The architecture explicitly mitigates all **OWASP Top 10 (2021)** vulnerabilities and enforces resource-level authorization boundaries.

---

## 📑 Table of Contents
- [Documentation Suite](#-documentation-suite)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [OIDC Authentication & Authorization Flow](#-oidc-authentication--authorization-flow)
- [OWASP Security Implementations](#-owasp-security-implementations)
- [Installation & Setup](#-installation--setup)
- [Asgardeo Configuration](#-asgardeo-configuration)
- [Database Schema Execution](#-database-schema-execution)
- [Local HTTPS Configuration](#-local-https-configuration)
- [Running the Application](#-running-the-application)
- [Security Testing Plan](#-security-testing-plan)

---

## 📚 Documentation Suite

| Document | Description |
|----------|-------------|
| 📐 [Architecture](docs/architecture.md) | Sequence & ER diagrams, component stack, design decisions |
| 🔌 [API Specification](docs/api-specification.md) | Endpoint directory, authorization scopes, payload schemas |
| 🗄 [Database Schema](docs/database-schema.md) | Table definitions, indexes, constraints, cascade logic |
| ⚙ [Setup Guide](docs/setup-guide.md) | Prerequisites, SSL certificates, Asgardeo OIDC config |
| 🧪 [Security Testing](docs/security-testing.md) | BOLA/IDOR, XSS, SQLi, auth bypass test cases |
| ✍ [Blog Post](docs/blog-post.md) | Implementation reflection, security choices, academic outcomes |

---

## 🚀 Features

### Stall Vendor Portal
- **OIDC Login/Logout** — Federated login via Asgardeo using Authorization Code + PKCE flow
- **Verified Profile** — Name, email, username, role, and organization sourced from OIDC claims
- **Stall Booking Form** — Request up to 3 stalls with validated date, type, size, and category
- **My Bookings Table** — Displays current requests filterable by approval status
- **Booking Modification** — Edit details while reservation status remains `Pending`

### Exhibition Organizer Portal
- **Overview Dashboard** — Monitor active vendor counts and booking request statuses
- **Booking Management** — Approve, Reject, or Cancel reservations in real time
- **Data Administration** — Inspect and manage vendor reservation records

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 (Vite), JavaScript, Axios (interceptor-based auth), Tailwind CSS, Framer Motion |
| **Backend** | Java 21, Spring Boot 4, Spring Security (OAuth2 Resource Server), Spring Data JPA |
| **Authentication** | [Asgardeo](https://wso2.com/asgardeo/) — OIDC Authorization Code + PKCE |
| **Database** | MySQL 8.0 |
| **Token Handling** | `react-oidc-context` + `oidc-client-ts` (in-memory secure storage) |

---

## 📐 System Architecture

```
┌─────────────────────────────┐
│   Browser (React / Vite)    │
│   Port 5173                 │
└───────────┬─────────────────┘
            │  1. Login redirect (Authorization Code + PKCE)
            ▼
┌───────────────────────────────┐
│   Asgardeo Identity Provider  │
│   api.asgardeo.io/t/{org}     │
│   - Issues JWT Access Tokens  │
│   - Contains "groups" claim   │
└───────────┬───────────────────┘
            │  2. Access Token (JWT) in Authorization header
            ▼
┌───────────────────────────────┐
│   Spring Boot API  :8088      │
│   ┌───────────────────────┐   │
│   │  RateLimitingFilter   │   │  ← OWASP A04
│   │  JwtAuthConverter     │   │  ← OWASP A07
│   │  SecurityConfig RBAC  │   │  ← OWASP A01
│   │  GlobalExceptionHndlr │   │  ← OWASP A05
│   └───────────────────────┘   │
└───────────┬───────────────────┘
            │  3. JPA Parameterized Queries
            ▼
┌───────────────────────────────┐
│   MySQL Database (Bookfairpro)│
└───────────────────────────────┘
```

---

## 🔐 OIDC Authentication & Authorization Flow

1. User clicks **Login** in the React app
2. Browser redirects to Asgardeo with `response_type=code` + PKCE `code_challenge`
3. User authenticates; Asgardeo returns an authorization `code`
4. `react-oidc-context` exchanges the code for JWT Access + ID tokens — **no token is stored in `localStorage`**
5. The access token is held in memory and injected into every API call via `AxiosInstance`
6. The Spring Boot backend validates the token signature via Asgardeo's JWKS endpoint (auto-discovered from `issuer-uri`)
7. `JwtAuthenticationConverter` maps the `groups` claim to `ROLE_VENDOR` or `ROLE_ORGANIZER`
8. **JIT Provisioning** — on first login, a `UserProfile` row is created from the JWT claims automatically

---

## 🛡 OWASP Security Implementations

| OWASP 2021 | Control | Implementation |
|------------|---------|----------------|
| **A01** Broken Access Control | BOLA/IDOR prevention; method-level RBAC | `verifyOwnershipOrAdmin()` in `ReservationServiceImpl`; `@PreAuthorize` on every controller method; URL-pattern rules in `SecurityConfig` |
| **A02** Cryptographic Failures | No secrets in source; token not in localStorage | All secrets via env vars; OIDC tokens in react-oidc-context memory; HSTS header enforces HTTPS |
| **A03** Injection | SQL injection & XSS prevention | JPA parameterized queries only; `@Valid` + `@Pattern` on all request DTOs; CSP header blocks inline scripts |
| **A04** Insecure Design | Rate limiting; mass assignment prevention | `RateLimitingFilter` (100 req/min, trusted-proxy-aware); `UserProfileUpdateRequest` DTO exposes only 3 safe fields |
| **A05** Security Misconfiguration | Secure HTTP headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (1 yr), `Permissions-Policy`, CSP |
| **A06** Vulnerable Components | Current dependency versions | Spring Boot 4, React 19, oidc-client-ts 3.5 — all current at submission |
| **A07** Authentication Failures | Cryptographic token validation | JWKS-based JWT signature check; `issuer-uri` auto-discovers Asgardeo JWKS; stateless sessions only |
| **A08** Software & Data Integrity | Role from IdP only; no client-trust | Role from Asgardeo `groups` JWT claim; client-side role for navigation only — backend always re-validates |
| **A09** Logging & Monitoring | Structured audit logging | `AuditLogService` — login, reservation, and access-denied events logged with `sub` + resource ID; no PII/tokens logged |
| **A10** SSRF | No server-side outbound calls | No HTTP client to user-controlled URLs; JWKS fetched from pre-configured issuer only |

---

## ⚙ Installation & Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Java JDK | 21+ |
| Maven | (use included `mvnw` wrapper) |
| Node.js | 18+ |
| MySQL Server | 8.0+ |

### 1. Clone the repository
```bash
git clone https://github.com/placeholder/secure-stall-reservation.git
cd secure-stall-reservation
```

### 2. Configure environment variables

Copy `.env.example` to create your local config files.

**Backend** — create `Backend/Book-Fair-Project/.env`:
```properties
OIDC_AUTHORITY=https://api.asgardeo.io/t/<your-org-name>/oauth2/token
OIDC_AUDIENCE=<your-api-resource-identifier>
DATABASE_CONNECTION_STRING=jdbc:mysql://localhost:3306/Bookfairpro?createDatabaseIfNotExist=true
DATABASE_USERNAME=root
DATABASE_PASSWORD=
RATE_LIMITING_ENABLED=true
RATE_LIMIT_RPM=100
```

**Frontend** — create `Frontend/reactapp/.env.local`:
```env
VITE_OIDC_AUTHORITY=https://api.asgardeo.io/t/<your-org-name>/oauth2/token
VITE_OIDC_CLIENT_ID=<your-asgardeo-client-id>
VITE_API_URL=http://localhost:8088
```

### 3. Install frontend dependencies
```bash
cd Frontend/reactapp
npm install
```

---

## 🔑 Asgardeo Configuration

### Step 1 — Create an Application
1. Sign in to [Asgardeo Console](https://console.asgardeo.io)
2. Go to **Applications** → **New Application**
3. Select **Standard-Based Application** → choose **OIDC**
4. Set **Allowed redirect URLs**: `http://localhost:5173`
5. Set **Allowed logout redirect URLs**: `http://localhost:5173`
6. Copy the **Client ID** → paste into `VITE_OIDC_CLIENT_ID`

### Step 2 — Create Groups for Roles
1. Go to **User Management** → **Groups**
2. Create a group named `Organizer` and assign organizer users to it
3. All other users default to the `Vendor` (user) role

### Step 3 — Add Groups Claim to Token
1. Go to **Applications** → your app → **User Attributes**
2. Under **Requested Attributes**, add `Groups` (`http://wso2.org/claims/groups`)
3. Enable **Include in tokens**

### Step 4 — Create an API Resource (audience)
1. Go to **API Resources** → **New API Resource**
2. Set an identifier (e.g. `https://api.bookfair.com`)
3. Copy it into `OIDC_AUDIENCE` (backend) and `VITE_OIDC_AUDIENCE` (frontend)
4. Add the resource to your application under **API Authorization**

---

## 🗄 Database Schema Execution

1. Open MySQL Workbench or shell
2. Run the initialization script:
   ```sql
   SOURCE database/database.sql;
   ```
This creates the `Bookfairpro` database, initializes `user_profiles`, `exhibitions`, and `reservations` tables, and seeds sample exhibition events.

---

## 🔐 Local HTTPS Configuration

HTTPS is optional for local development — Asgardeo supports `http://localhost` redirect URIs by default.

For a production-like HTTPS setup using `mkcert`:

```bash
mkcert -install
mkcert localhost 127.0.0.1
mv localhost.pem localhost-key.pem Frontend/reactapp/
```

Update `vite.config.js`:
```javascript
server: {
  https: { key: './localhost-key.pem', cert: './localhost.pem' },
  port: 5173
}
```

Enable SSL via environment:
```
SSL_ENABLED=true
SSL_KEYSTORE_PATH=classpath:keystore.pfx
SSL_KEYSTORE_PASSWORD=your_password
SSL_KEY_ALIAS=localhost
```

---

## 🏃 Running the Application

### Backend
```bash
cd Backend/Book-Fair-Project
.\mvnw.cmd spring-boot:run      # Windows
./mvnw spring-boot:run          # Linux / macOS
```
API available at: `http://localhost:8088`

### Frontend
```bash
cd Frontend/reactapp
npm run dev
```
App available at: `http://localhost:5173`

---

## 🧪 Security Testing Plan

The full test plan is documented in [`SECURITY.md`](SECURITY.md) and [`docs/security-testing.md`](docs/security-testing.md).

### Quick verification checklist

| Test | Expected Result |
|------|----------------|
| `GET /api/admin/reservations` — no token | `401 Unauthorized` |
| `GET /api/admin/reservations` — Vendor JWT | `403 Forbidden` |
| `GET /api/reservations/{other_vendor_id}` — own Vendor JWT | `403 Forbidden` |
| `POST /api/reservations` with `stallType: "Invalid"` | `400 Bad Request` |
| `PUT /api/profile` with `"role": "Organizer"` in body | Role field silently ignored |
| >100 requests/minute from same IP | `429 Too Many Requests` |
| Browser DevTools → Application → Local Storage | No tokens stored |
| Browser DevTools → Network → Response Headers | `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options` present |
