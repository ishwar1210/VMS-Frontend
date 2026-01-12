import React, { useState } from "react";
import "./Login.css";
import bg from "../assets/login img.png";
import logo from "../assets/vms logo.png";
import endpoint from "../api/endpoint";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Login() {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuthenticated, setToken, setUserRole, fetchUserComponents } =
    useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // call API
    (async () => {
      try {
        setError("");
        setLoading(true);
        const res = await endpoint.auth.login({ username, password });
        console.log("Login success", res.data);
        // determine token and role from response (support multiple shapes)
        const token =
          res?.data?.token ||
          res?.data?.accessToken ||
          res?.data?.data?.token ||
          res?.data?.data?.access_token ||
          null;

        // try to find role from different possible locations
        let role: string | null =
          res?.data?.role ||
          res?.data?.userRole ||
          res?.data?.data?.role ||
          res?.data?.user?.role ||
          res?.data?.data?.user?.role ||
          res?.data?.roleName ||
          null;

        // if role not provided but token looks like JWT, try decode
        if (!role && token && token.split(".").length === 3) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            console.log("JWT Payload:", payload);
            role =
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
            console.log("Extracted role from token:", role);
          } catch (e) {
            // ignore decode errors
          }
        }

        // normalize role to lowercase string (if found)
        if (role && typeof role === "string") {
          role = role.toLowerCase().trim();
          // map "security guard" to "security" for easier checking
          if (role === "security guard") {
            role = "security";
          }
        }

        console.log("Final role (normalized):", role);

        if (token) setToken(token);
        if (role) setUserRole(role);

        // Fetch user's assigned components (skip for admin)
        if (role !== "admin") {
          try {
            // Extract userId from token
            const payload = JSON.parse(atob(token.split(".")[1]));
            const userId =
              payload?.userId ||
              payload?.UserId ||
              payload?.user_id ||
              payload?.sub ||
              payload?.nameid ||
              payload?.nameidentifier ||
              payload?.[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
              ];
            if (userId) {
              await fetchUserComponents(Number(userId));
            }
          } catch (e) {
            console.error("Failed to fetch user components:", e);
          }
        }

        // on successful response set auth state so sidebar is visible
        if (res?.status === 200) {
          setAuthenticated(true);
        }
      } catch (err: any) {
        console.error("Login error", err);
        const message =
          err?.response?.data?.message || err.message || "Login failed";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="login-page">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        )}
      </button>
      <div className="overlay">
        <div className="logo-container">
          <img src={logo} alt="VMS Logo" className="vms-logo" />
        </div>
        <div className="login-container">
          <div className="left">
            <div className="login-card">
              <div className="login-header">
                <h2>VISITOR MANAGEMENT SYSTEM</h2>
                <p>Please login with your credentials to access the system</p>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                <input
                  className="input"
                  type="text"
                  placeholder="User Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <div className="password-input-wrapper">
                  <input
                    className="input password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>

                <button className="login-btn" type="submit">
                  {loading ? "Logging in..." : "Login "}
                </button>

                {error && <div className="error-message">{error}</div>}
              </form>
            </div>
          </div>

          <div className="right">
            <div
              className="illustration"
              style={{ backgroundImage: `url(${bg})` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
