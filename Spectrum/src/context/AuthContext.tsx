import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  token: string | null;
  setToken: (t: string | null) => void;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const v = localStorage.getItem("isAuthenticated");
    return v === "true";
  });

  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const AUTO_LOGOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
  const AUTH_TIMESTAMP_KEY = "auth_timestamp";

  const [userRole, setUserRoleState] = useState<string | null>(() => {
    return localStorage.getItem("userRole");
  });

  // If token exists but userRole isn't in localStorage, try to decode role from token
  useEffect(() => {
    if (!userRole && token) {
      try {
        if (token.split(".").length === 3) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const decodedRole =
            payload?.[
              "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ] ||
            payload?.role ||
            (Array.isArray(payload?.roles)
              ? payload.roles[0]
              : payload?.roles) ||
            payload?.user?.role ||
            payload?.roleName ||
            null;
          if (decodedRole && typeof decodedRole === "string") {
            const normalized = decodedRole.toLowerCase();
            setUserRoleState(normalized);
            localStorage.setItem("userRole", normalized);
          }
        }
      } catch (e) {
        // ignore decode errors
      }
    }
  }, [token, userRole]);

  const setAuthenticated = (v: boolean) => {
    setIsAuthenticated(v);
    localStorage.setItem("isAuthenticated", v ? "true" : "false");
    if (v) {
      try {
        localStorage.setItem(AUTH_TIMESTAMP_KEY, String(Date.now()));
      } catch {}
    } else {
      try {
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      } catch {}
    }
  };

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
    // ensure we have a timestamp when token is set
    if (t) {
      try {
        const existing = localStorage.getItem(AUTH_TIMESTAMP_KEY);
        if (!existing)
          localStorage.setItem(AUTH_TIMESTAMP_KEY, String(Date.now()));
      } catch {}
    }
  };

  const setUserRole = (role: string | null) => {
    setUserRoleState(role);
    if (role) localStorage.setItem("userRole", role);
    else localStorage.removeItem("userRole");
  };

  const clearAuth = () => {
    setAuthenticated(false);
    setToken(null);
    setUserRole(null);
  };

  // Auto-logout effect: schedule logout after 24 hours from stored timestamp
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_TIMESTAMP_KEY);
      if (!raw) return;
      const ts = Number(raw) || 0;
      const elapsed = Date.now() - ts;
      if (elapsed >= AUTO_LOGOUT_MS) {
        // already expired
        clearAuth();
        return;
      }
      const remaining = AUTO_LOGOUT_MS - elapsed;
      const id = setTimeout(() => {
        clearAuth();
      }, remaining);
      return () => clearTimeout(id);
    } catch (e) {
      // ignore
    }
  }, [token, isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setAuthenticated,
        token,
        setToken,
        userRole,
        setUserRole,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
