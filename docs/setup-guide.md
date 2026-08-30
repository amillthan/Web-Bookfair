# Installation & Setup Guide

This guide provides step-by-step instructions to configure, run, and deploy both the React Vite frontend and Spring Boot backend in local development environment over secure HTTPS protocol, integrated with OIDC (Auth0).

---

## 📋 Prerequisites

Before starting, install the following tools:
* **Java Development Kit (JDK) 21**: Required for compiling and running the backend API.
* **Node.js (v18.0.0 or higher)**: Required for package manager (NPM) and the frontend Vite server.
* **MySQL Server (v8.0 or higher)**: Relational database to store profile and booking records.
* **mkcert** (Optional but highly recommended): CLI tool for generating valid local SSL certificates.

---

## 🗄 1. Database Initialization

Create the schema and tables in your local MySQL instance:

1. Connect to your MySQL server using MySQL Workbench, CLI, or any database tool.
2. Run the initialization script located in the database folder:
   ```sql
   SOURCE database/database.sql;
   ```
   *Alternatively, copy-paste the SQL contents from [`database/database.sql`](file:///c:/Users/kisha/Desktop/Bookfair/database/database.sql).*
3. This creates a schema named `Bookfairpro` containing tables for:
   * `user_profiles` (JIT-provisioned users)
   * `exhibitions` (available exhibitions)
   * `reservations` (submitted bookings)
4. It also seeds exhibitions and mocks a vendor and organizer profile.

---

## 🔑 2. Local SSL Certificates Configuration (HTTPS)

OIDC providers require redirect targets and session tokens to be transmitted over secure HTTPS connections. We will configure both React and Spring Boot to use SSL/TLS locally.

### Step A: Install mkcert
* **Windows (via Chocolatey)**: `choco install mkcert`
* **macOS (via Homebrew)**: `brew install mkcert`
* **Linux (Ubuntu/Debian)**: `sudo apt install mkcert`

### Step B: Generate local CA and Certificate
Run the following commands in your shell:
```bash
# 1. Install local Root Certificate Authority
mkcert -install

# 2. Generate local certificates (run this in root folder of the project)
mkcert localhost 127.0.0.1
```
This produces two files:
* `localhost.pem` (Public certificate)
* `localhost-key.pem` (Private key)

---

## ☕ 3. Backend (Spring Boot API) Setup

### Step A: Create Keystore file
Spring Boot requires certificates to be packaged inside a `.pfx` or `.jks` keystore. Run the following OpenSSL command to package the generated PEM files:
```bash
openssl pkcs12 -export \
  -in localhost.pem \
  -inkey localhost-key.pem \
  -out Backend/Book-Fair-Project/src/main/resources/keystore.pfx \
  -name localhost \
  -passout pass:changeit
```
*Note: This creates `keystore.pfx` inside the resources folder with the password `changeit`.*

### Step B: Configure environment variables
1. Go to [`Backend/Book-Fair-Project/`](file:///c:/Users/kisha/Desktop/Bookfair/Backend/Book-Fair-Project/).
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Fill in your MySQL credentials and OIDC details:
   ```env
   # OIDC Configuration
   OIDC_AUTHORITY=https://your-domain.auth0.com/
   OIDC_CLIENT_ID=your-client-id
   OIDC_CLIENT_SECRET=your-client-secret
   OIDC_AUDIENCE=https://api.bookfair.com

   # Database Configuration
   DATABASE_CONNECTION_STRING=jdbc:mysql://localhost:3306/Bookfairpro?createDatabaseIfNotExist=true
   DATABASE_USERNAME=root
   DATABASE_PASSWORD=your_mysql_password

   # URLs
   FRONTEND_URL=https://localhost:5173
   BACKEND_URL=https://localhost:8088
   ```

### Step C: Configure application.properties
Append the following SSL parameters to configure HTTPS in your [`Backend/Book-Fair-Project/src/main/resources/application.properties`](file:///c:/Users/kisha/Desktop/Bookfair/Backend/Book-Fair-Project/src/main/resources/application.properties):
```properties
# Enable HTTPS SSL key
server.ssl.key-store=classpath:keystore.pfx
server.ssl.key-store-password=changeit
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=localhost
```

---

## ⚡ 4. Frontend (React Vite) Setup

### Step A: Configure SSL Certificates
1. Copy the generated certificate files (`localhost.pem` and `localhost-key.pem`) from the root folder into [`Frontend/reactapp/`](file:///c:/Users/kisha/Desktop/Bookfair/Frontend/reactapp/).

### Step B: Configure Environment Variables
1. Go to [`Frontend/reactapp/`](file:///c:/Users/kisha/Desktop/Bookfair/Frontend/reactapp/).
2. Create a `.env` file:
   ```env
   VITE_API_BASE_URL=https://localhost:8088/api
   VITE_OIDC_AUTHORITY=https://your-domain.auth0.com/
   VITE_OIDC_CLIENT_ID=your-client-id
   VITE_OIDC_AUDIENCE=https://api.bookfair.com
   ```

### Step C: Configure vite.config.js
Modify the file [`vite.config.js`](file:///c:/Users/kisha/Desktop/Bookfair/Frontend/reactapp/vite.config.js) to tell Vite to run over HTTPS using the cert files:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: './localhost-key.pem',
      cert: './localhost.pem',
    },
    port: 5173
  }
});
```

---

## 🛡 5. OIDC Identity Provider Configuration (e.g., Auth0)

Configure your OIDC tenant settings:

### Step A: Register the Frontend Application
1. Log in to your OIDC dashboard (e.g. Auth0).
2. Create a **Single Page Web Application**.
3. Configure the following URIs:
   * **Allowed Callback URLs**: `https://localhost:5173`
   * **Allowed Logout URLs**: `https://localhost:5173`
   * **Allowed Web Origins**: `https://localhost:5173`
4. Set the **Grant Types** to include `Authorization Code` and `Refresh Token`.

### Step B: Register the Backend API
1. Go to the API section in OIDC dashboard and click **Create API**.
2. Configure settings:
   * **Name**: `Bookfair Stall API`
   * **Identifier (Audience)**: `https://api.bookfair.com`
   * **Signing Algorithm**: `RS256`

### Step C: Configure Role Mapping Custom Claim
To pass roles down to JWT tokens, create a login action/rule:
* In Auth0 Actions, create a **Custom Login Flow Trigger**:
  ```javascript
  exports.onExecutePostLogin = async (event, api) => {
    const namespace = 'https://api.bookfair.com';
    if (event.authorization) {
      api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
      api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    }
  };
  ```
* Save and deploy the action, adding it to your Post Login trigger pipeline.

---

## 🏃 6. Running the Applications

### Start Backend
From [`Backend/Book-Fair-Project/`](file:///c:/Users/kisha/Desktop/Bookfair/Backend/Book-Fair-Project/) directory, run:
```bash
# Windows PowerShell
.\mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```
*Note: Make sure your local MySQL server is active.*

### Start Frontend
From [`Frontend/reactapp/`](file:///c:/Users/kisha/Desktop/Bookfair/Frontend/reactapp/) directory, run:
```bash
# Install NPM dependencies
npm install

# Launch Development Server
npm run dev
```

Visit the application at `https://localhost:5173` in your browser.
