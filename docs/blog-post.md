# Advanced Security Engineering: Mitigating the OWASP Top 10 in a modern React & Spring Boot OIDC Web App

## 1. Introduction

Modern web applications must be engineered around security rather than treating it as an afterthought. For high-volume exhibition events like the **Colombo International Book Fair 2026**, booking systems are exposed to concurrency, data integrity attacks, and unauthorized privilege escalation risks.

This guide provides a deep-dive security audit and implementation blueprint of a production-quality **Secure Exhibition Stall Reservation Web Application** built with a **Java Spring Boot API**, a **React (Vite) Single Page Application (SPA)**, and a **MySQL Database**. We will discuss how we transitioned from local credentials to OpenID Connect (OIDC) via **Asgardeo**, how we enforced strict object-level authorization boundaries, and how we systematically mitigated the critical **OWASP Top 10 (2021)** vulnerabilities.

---

## 2. System Architecture & Threat Model

Our security design follows the **Defense in Depth** principle. The frontend client acts as an interactive routing boundary, while the stateless backend API layer is the final security boundary protecting database mutations.

```
┌─────────────────────────────────┐
│   Browser SPA (React / Vite)    │
│   Port 5173 (HTTPS)             │
└───────────────┬─────────────────┘
                │  1. Login Redirect (Auth Code Flow + PKCE)
                ▼
┌─────────────────────────────────┐
│    Asgardeo OIDC Identity IdP   │
│    api.asgardeo.io/t/{org}      │
│    - Authenticates User         │
│    - Returns JWT Access Token   │
└───────────────┬─────────────────┘
                │  2. API Request with Bearer JWT (Authorization: Bearer <token>)
                ▼
┌─────────────────────────────────┐
│   Spring Boot Web API Gateway   │
│   Port 8088 (HTTPS)             │
│                                 │
│   ┌─────────────────────────┐   │
│   │  RateLimitingFilter     │   │  ← Prevents Spoofing & DoS (A04)
│   │  JwtAuthentication      │   │  ← Signature / Issuer Check (A07)
│   │  SecurityConfig Headers │   │  ← CSP, HSTS, Nosniff (A05)
│   │  GlobalExceptionHandler │   │  ← Prevents Stack Trace Leaks (A05)
│   └─────────────────────────┘   │
└───────────────┬─────────────────┘
                │  3. Parameterized JPA Queries (No SQL Injection)
                ▼
┌─────────────────────────────────┐
│   MySQL Database (Bookfairpro)  │
└─────────────────────────────────┘
```

---

## 3. OIDC Authentication: Standardizing Identity with PKCE

Traditional username/password authentication introduces major security vectors: password hashing audits, database storage risks, session hijacking, password resets, and credential stuffing. We mitigated these risks by delegating identity management to **Asgardeo** using OpenID Connect (OIDC) and the **Authorization Code Flow with PKCE (Proof Key for Code Exchange)**.

### The Authentication Protocol Stack
- **Authorization Code Flow with PKCE** ensures that even if an authorization code is intercepted in transit, it cannot be exchanged for tokens without the original, cryptographically verified `code_verifier` secret.
- **Stateless Tokens**: The backend verifies incoming JSON Web Tokens (JWT) dynamically without local sessions using the **JWKS (JSON Web Key Set)** public keys exposed by Asgardeo:
  `spring.security.oauth2.resourceserver.jwt.issuer-uri=https://api.asgardeo.io/t/{org}/oauth2/token`

### Secure Token Storage (Avoiding XSS Theft)
A common security anti-pattern is storing JWTs in `localStorage` or `sessionStorage` where they are vulnerable to Cross-Site Scripting (XSS) extraction. In this implementation:
- The React application utilizes `react-oidc-context` based on the standard `oidc-client-ts` library.
- Tokens are held in **secure in-memory JavaScript variables** (or isolated transient session states) and automatically injected into outbound requests via an Axios interceptor.
- The deprecated custom endpoint `/api/auth/login` and local storage code in `Authentication.jsx` were deleted to eliminate token exposure.

---

## 4. JIT User Provisioning & Dynamic Role Mapping

Federated identities are synced on-demand via **Just-In-Time (JIT) Provisioning** at the backend resource level.

### The JIT Provisioning & Verification Lifecycle
When a validated JWT hits the resource server, the backend extracts the verified `sub` (subject) claim.
1. If the user does not exist locally, the backend provisions a new `UserProfile` record from the trusted OIDC claims:
   - `email` (mapped securely from `email` or `email_address`)
   - `name` (mapped from `name` or `preferred_username`)
   - `role` (derived dynamically from the JWT `groups` claim)
2. If the user profile already exists, local attributes are synchronized if they differ from token claims.
3. String inputs from token claims are trimmed to prevent oversized storage exhaustion attacks:

```java
// Snippet from UserProfileServiceImpl.java
@Override
@Transactional
public UserProfile getOrCreateProfile(Jwt jwt) {
    String sub = jwt.getSubject();
    if (sub == null || sub.isBlank()) {
        throw new IllegalArgumentException("JWT subject (sub) claim is missing");
    }

    String email = trimClaim(jwt.getClaimAsString("email"));
    String name = trimClaim(jwt.getClaimAsString("name"));
    
    // Asgardeo Groups Claim resolution
    String resolvedRole = "Vendor";
    List<String> groups = jwt.getClaimAsStringList("groups");
    if (groups != null) {
        for (String g : groups) {
            String normalized = g.trim().toLowerCase();
            if (normalized.equals("organizer") || normalized.equals("admin")) {
                resolvedRole = "Organizer";
                break;
            }
        }
    }
    // Provision or update user profile mapping
    ...
}
```

---

## 5. Mitigation of OWASP Top 10 (2021) Vulnerabilities

### 🛡 A01: Broken Access Control (BOLA / IDOR Prevention)
**Vulnerability**: A malicious client changes a resource parameter in the API call (e.g., `GET /api/reservations/15` to `GET /api/reservations/16`) to view or delete another vendor's reservation.

**Mitigation**: 
1. **Object-Level Checks**: In the service layer ([`ReservationServiceImpl.java`](file:///c:/Users/kisha/Desktop/Bookfair/Backend/Book-Fair-Project/src/main/java/com/example/Book_Fair_Project/service/ReservationServiceImpl.java)), the resource owner is verified against the principal ID resolved from the cryptographically validated JWT.
2. **Method-Level Security**: Added `@PreAuthorize` annotations on controllers to restrict access early.

```java
// ReservationServiceImpl.java
private void verifyOwnershipOrAdmin(Reservation reservation, UserProfile userProfile) {
    boolean isOrganizer = userProfile.getRole().equalsIgnoreCase("Organizer");
    boolean isOwner = reservation.getVendorUserProfile().getId().equals(userProfile.getId());
    
    if (!isOrganizer && !isOwner) {
        // Log Access Violation attempt for audit monitoring
        auditLogService.logAccessDenied(userProfile.getIdentityProviderUserId(), "RESERVATION", reservation.getId().toString());
        throw new AccessDeniedException("Access denied: You do not have permission to access this resource.");
    }
}
```

---

### 🛡 A03: Injection (SQL & XSS Prevention)
**Vulnerability**: Attacker injects SQL syntax into inputs to manipulate the database or inputs script tags to execute malicious JavaScript.

**Mitigation**:
1. **Parameterized Queries**: All database queries are executed via **Spring Data JPA / Hibernate**, using parameterized bindings that treat inputs as values, never as executable code.
2. **Strict Request Validation**: Used validation annotations on DTOs like `ReservationCreateRequest` to enforce strict formatting, preventing buffer overflows or injection attempts.
3. **Content Security Policy (CSP)**: Set via HTTP header to restrict script execution to the same origin, mitigating XSS risks.

```java
// ReservationCreateRequest.java
@NotBlank(message = "Stall type is required.")
@Pattern(regexp = "Standard|Premium|Corner Stall", message = "Stall type must be 'Standard', 'Premium', or 'Corner Stall'.")
private String stallType;
```

---

### 🛡 A04: Insecure Design (Mass Assignment & IP Spoofing Prevention)
**Vulnerability 1**: Accept a raw database entity as a request body, allowing a client to send extra parameters (like `"role": "Organizer"`) to elevate privileges.

**Mitigation 1 (Mass Assignment Prevention)**: Explicitly created DTOs that only expose mutable fields for client requests.

```java
// UserProfileUpdateRequest.java
public class UserProfileUpdateRequest {
    @NotBlank(message = "Name is required.")
    @Size(max = 100)
    private String name;

    @Size(max = 50)
    @Pattern(regexp = "^[+\\d\\s\\-()]*$")
    private String contactNumber;

    @Size(max = 100)
    private String organizationName;
}
```

**Vulnerability 2**: Rate limiters rely on the `X-Forwarded-For` HTTP header. An attacker spoofs this header to rotate IP addresses and bypass rate limits.

**Mitigation 2 (IP Spoofing Prevention)**: The `RateLimitingFilter` checks if the incoming request originates from a configured trusted proxy IP before trusting `X-Forwarded-For`. Otherwise, it falls back to the direct socket IP (`getRemoteAddr()`).

```java
// RateLimitingFilter.java
private String getClientIp(HttpServletRequest request) {
    String remoteAddr = request.getRemoteAddr();
    if (trustedProxyIp != null && !trustedProxyIp.isBlank() && trustedProxyIp.equals(remoteAddr)) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
    }
    return remoteAddr;
}
```

---

### 🛡 A05: Security Misconfiguration (Secure Headers & Error Handling)
**Vulnerability**: Leaked server metadata, stack traces in error messages, or missing standard headers allowing clickjacking and MIME sniffing.

**Mitigation**:
1. **Global Exception Interception**: Centralized `GlobalExceptionHandler` captures exceptions, writes a secure log, generates a correlation UUID, and returns a sanitized client response without stack traces.
2. **Hardened Headers**: Configured custom HTTP headers in `SecurityConfig.java`:

```java
// SecurityConfig.java
.headers(headers -> headers
    .contentTypeOptions(contentType -> {}) // X-Content-Type-Options: nosniff
    .frameOptions(frame -> frame.deny())  // Deny clickjacking
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'; frame-ancestors 'none';"))
    .httpStrictTransportSecurity(hsts -> hsts // Strict Transport Security
        .includeSubDomains(true)
        .maxAgeInSeconds(31536000) // 1 year
    )
    .addHeaderWriter(new StaticHeadersWriter(
        "Permissions-Policy", "geolocation=(), microphone=(), camera=()"
    ))
)
```

---

### 🛡 A09: Security Logging & Monitoring (Audit Trail & Log Injection Prevention)
**Vulnerability**: Systems that don't log security-critical events (log-ins, privilege failures) fail compliance. Also, attackers can input newlines (`\n`) to forge log entries (Log Injection).

**Mitigation**:
- Built an `AuditLogService` logging to `logs/bookfair.log`.
- All logging values are sanitized by replacing newlines, carriage returns, and tabs to prevent log forging.

```java
// AuditLogService.java
public void logAccessDenied(String userSub, String resource, String resourceId) {
    auditLog.warn("[ACCESS] DENIED | sub={} | resource={} | resourceId={} | outcome=BLOCKED",
            sanitize(userSub), resource, resourceId);
}

private String sanitize(String value) {
    if (value == null) return "null";
    return value.replaceAll("[\n\r\t]", "_");
}
```

---

## 6. Implementation Architecture Details

### Frontend Token Handshake (Memory Scope)
The Axios configuration in [`AxiosInstance.js`](file:///c:/Users/kisha/Desktop/Bookfair/Frontend/reactapp/src/services/AxiosInstance.js) injects the dynamic token securely in memory:

```javascript
let currentAuthToken = null;

export const setAuthToken = (token) => {
  currentAuthToken = token;
};

AxiosInstance.interceptors.request.use((config) => {
  if (currentAuthToken) {
    config.headers.Authorization = `Bearer ${currentAuthToken}`;
  }
  return config;
});
```

---

## 7. Security Verification Plan

Verification of security controls is conducted using automated test plans:

1. **Authentication Bypass**: Requesting `/api/admin/reservations` without a JWT → Expects `401 Unauthorized`.
2. **BOLA/IDOR Violation**: Sending a Vendor A token to fetch Vendor B's reservation → Expects `403 Forbidden` and triggers `[ACCESS] DENIED` in the audit log.
3. **Mass Assignment**: Submitting a PUT profile request with `"role": "Organizer"` in body → Field is silently ignored; role remains `"Vendor"`.
4. **IP Rate Limit**: Executing >100 requests per minute from a single client IP → Expects `429 Too Many Requests`.

---

## 8. Conclusion

By building verified security gates directly into the server architecture and abstracting identity management to a secure OIDC provider, we successfully resolved major vulnerability vectors. Moving identity and authorization verification to backend boundaries makes the application audit-ready, robust, and resilient against active exploitation patterns.
