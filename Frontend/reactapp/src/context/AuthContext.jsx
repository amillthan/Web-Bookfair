import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "react-oidc-context";
import { setAuthToken, clearAuthToken } from "../services/AxiosInstance";

const AuthCustomContext = createContext(null);

/**
 * OIDC Configuration for Asgardeo (Authorization Code Flow + PKCE)
 *
 * Required environment variables (.env):
 *   VITE_OIDC_AUTHORITY  = https://api.asgardeo.io/t/<your-org-name>/oauth2/token
 *   VITE_OIDC_CLIENT_ID  = <your-asgardeo-client-id>
 *   VITE_OIDC_AUDIENCE   = <your-asgardeo-api-resource-identifier>
 *
 * Asgardeo-specific notes:
 *   - PKCE is enforced by oidc-client-ts (response_type: "code" always enables it)
 *   - Roles are provisioned via Asgardeo Groups and appear in the "groups" claim
 *   - Add "groups" to Requested Attributes in the Asgardeo Application config
 */
const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || "https://api.asgardeo.io/t/bookfairorg/oauth2/token",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "",
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  // "groups" scope exposes Asgardeo group memberships as a JWT claim
  scope: "openid profile email groups",
  // Automatic silent token renewal prevents mid-session expiry
  automaticSilentRenew: true,
  onSigninCallback: (_user) => {
    // Clean up the ?code=...&state=... from the URL after PKCE code exchange
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export function CustomAuthProvider({ children }) {
  return (
    <AuthProvider {...oidcConfig}>
      <AuthContextHandler>{children}</AuthContextHandler>
    </AuthProvider>
  );
}

function AuthContextHandler({ children }) {
  const auth = useAuth();
  const [role, setRole] = useState("Vendor");

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      /**
       * SECURITY: Role is extracted from the OIDC access token claims for UI navigation only.
       * The backend independently validates the JWT and derives the authoritative role.
       * Never trust client-side role for access control decisions.
       *
       * Asgardeo group claim resolution:
       *   1. "groups" claim (standard Asgardeo group membership)
       *   2. "roles" claim (fallback for custom claim mapping)
       */
      const claims = auth.user.profile;
      const groups =
        claims["groups"] ||                            // Asgardeo standard group claim
        claims["roles"] ||                             // Generic fallback
        claims["https://api.bookfair.com/roles"];      // Legacy Auth0 namespace (migration compat)

      let resolvedRole = "Vendor";
      if (groups) {
        const groupsArray = Array.isArray(groups) ? groups : [groups];
        for (const g of groupsArray) {
          const normalized = g.toLowerCase();
          if (normalized === "organizer" || normalized === "admin" || normalized === "exhibition organizer") {
            resolvedRole = "Organizer";
            break;
          }
        }
      }
      setRole(resolvedRole);

      // SECURITY: Token comes from OIDC library's secure in-memory storage, never localStorage
      if (auth.user.access_token) {
        setAuthToken(auth.user.access_token);
      }
    } else {
      setRole("Vendor");
      clearAuthToken();
    }
  }, [auth.isAuthenticated, auth.user]);

  const login = () => {
    auth.signinRedirect();
  };

  const logout = () => {
    auth.signoutRedirect();
  };

  const contextValue = {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user ? {
      sub: auth.user.profile.sub,
      username: auth.user.profile.preferred_username || auth.user.profile.nickname || auth.user.profile.email?.split("@")[0],
      name: auth.user.profile.name || auth.user.profile.preferred_username,
      email: auth.user.profile.email,
      contactNumber: auth.user.profile.phone_number || "",
      organizationName: auth.user.profile.organization || "",
      role: role
    } : null,
    token: auth.user?.access_token,
    error: auth.error,
    login,
    logout
  };

  return (
    <AuthCustomContext.Provider value={contextValue}>
      {children}
    </AuthCustomContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthCustomContext);
}
