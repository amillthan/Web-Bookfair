# Architectural Documentation - Secure Exhibition Stall Reservation

This document describes the structural and component-level architecture of the **Secure Exhibition Stall Reservation Web Application**.

---

## 1. Technical Components Overview

The application is structured into four main operational blocks:
1. **Presentation Layer (React Frontend)**: A single-page application (SPA) created via Vite. Handles rendering interactive components, holding user state, and routing.
2. **Identity Provider (OIDC Cloud Host)**: Manage user registry, credential validations, and issues cryptographically signed JWT tokens.
3. **Application Layer (Spring Boot Web API)**: Validates incoming Bearer JWT signatures, provisions profile data, handles business logic, and exposes REST endpoints.
4. **Data Access Layer (MySQL Database)**: Relational tables containing exhibitions, reservations, and JIT-created user profiles.

---

## 2. Sequence Diagram: Authentication and Booking

```mermaid
sequenceDiagram
    autonumber
    actor Vendor
    participant Frontend as React Frontend
    participant IdP as Identity Provider (OIDC)
    participant API as Spring Boot API
    participant DB as MySQL Database

    Vendor->>Frontend: Click SSO Login
    Frontend->>IdP: Redirect with PKCE Authorization Request
    IdP->>Vendor: Display Federated Login Form
    Vendor->>IdP: Authenticate Credentials
    IdP->>Frontend: Redirect with Authorization Code
    Frontend->>IdP: Exchange Authorization Code for Token
    IdP->>Frontend: Return signed ID & Access Token (JWT)
    Frontend->>Vendor: Display Dashboard (logged in)

    Vendor->>Frontend: Submit Booking Request
    Frontend->>API: POST /api/reservations (Header: Authorization Bearer JWT)
    API->>API: Validate Signature, Issuer, Expiration against JWKS
    API->>API: JIT User Profile Provisioning check
    API->>DB: Query current reservations count (limit check)
    API->>DB: Insert new Stall Reservation request
    API->>Frontend: Return 201 Created Response
    Frontend->>Vendor: Display Success Banner
```

---

## 3. Database Entity Relationship (ER)

The relational schema focuses on normalized relationships between exhibitions and vendor profiles:

```mermaid
erDiagram
    USER_PROFILES {
        bigint id PK
        varchar identity_provider_user_id UK
        varchar username
        varchar name
        varchar email UK
        varchar contact_number
        varchar organization_name
        varchar role
        timestamp created_at
    }
    EXHIBITIONS {
        bigint id PK
        varchar name
        text description
        date event_date
        boolean is_active
        timestamp created_at
    }
    RESERVATIONS {
        bigint id PK
        bigint vendor_user_id FK
        bigint exhibition_id FK
        date reservation_date
        varchar stall_type
        varchar stall_size
        int number_of_stalls
        varchar business_category
        text special_requirements
        varchar status
        timestamp created_at
    }
    USER_PROFILES ||--o{ RESERVATIONS : "submits"
    EXHIBITIONS ||--o{ RESERVATIONS : "includes"
```

---

## 4. Key Design Decisions

* **Stateless API Design**: The Spring Boot backend stores no session state locally. Each request carries its own OIDC access token, keeping authentication decentralized and scalable.
* **Just-In-Time (JIT) Provisioning**: User profiles are created automatically upon their first successful OIDC authentication callback to the API. This avoids separate registration stages and keeps profile details synced.
* **Resource Ownership Boundary (BOLA/IDOR)**: The `vendor_user_id` stored inside the reservation record is matched strictly against the authenticated caller's database primary ID on every request, preventing vendors from reading or editing other bookings.
