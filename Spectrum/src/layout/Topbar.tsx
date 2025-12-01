import React from "react";
import "./Topbar.css";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function getNameFromToken(token: string | null) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return (
      payload?.name ||
      payload?.unique_name ||
      payload?.upn ||
      payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      null
    );
  } catch (e) {
    return null;
  }
}

function getDeptFromToken(token: string | null) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload?.department || payload?.dept || null;
  } catch (e) {
    return null;
  }
}

function initialsFromName(name: string | null) {
  if (!name) return "VS";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const Topbar: React.FC = () => {
  const { token, clearAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const name =
    getNameFromToken(token) || localStorage.getItem("userName") || "admin";
  const dept = getDeptFromToken(token) || localStorage.getItem("userDept");

  const initials = initialsFromName(name);

  return (
    <div className="topbar-wrapper">
      <div className="topbar-card">
        <div className="topbar-left">
          <div className="avatar-circle">{initials}</div>
          <div className="topbar-texts">
            <div className="topbar-username">{name}</div>
            <div className="topbar-dept">{dept}</div>
          </div>
        </div>

        <div className="topbar-right">
          <button
            className="theme-toggle-topbar"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "light" ? (
              // moon icon for light -> switch to dark
              <svg
                width="16"
                height="16"
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
              // sun icon for dark -> switch to light
              <svg
                width="16"
                height="16"
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

          <button className="logout-topbar" onClick={clearAuth}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 8 }}
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
