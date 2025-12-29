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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuthenticated, setToken, setUserRole } = useAuth();

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

                <input
                  className="input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

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
