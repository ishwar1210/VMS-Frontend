import React from "react";
import "./Topbar.css";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { endpoints } from "../api/endpoint";
import { toast } from "react-toastify";

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
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    username: "",
    u_Name: "",
    u_Mobile: "",
    u_Email: "",
    u_Address: "",
    password: "",
  });
  const [currentUserId, setCurrentUserId] = React.useState<number | null>(null);
  const name =
    getNameFromToken(token) || localStorage.getItem("userName") || "admin";
  const dept = getDeptFromToken(token) || localStorage.getItem("userDept");

  const initials = initialsFromName(name);

  React.useEffect(() => {
    if (showEditModal) {
      loadCurrentUserData();
    }
  }, [showEditModal]);

  const loadCurrentUserData = async () => {
    try {
      const res = await endpoints.user.getAll();
      let users = res.data;
      if (users && typeof users === "object") {
        if (Array.isArray(users.users)) users = users.users;
        else if (Array.isArray(users.data)) users = users.data;
        else if (Array.isArray(users.$values)) users = users.$values;
        else if (!Array.isArray(users)) users = [];
      }
      const currentUser = (Array.isArray(users) ? users : []).find(
        (u: any) => u.username === name || u.u_Name === name
      );
      if (currentUser) {
        setCurrentUserId(
          currentUser.userId || currentUser.id || currentUser.UserId
        );
        setEditForm({
          username: currentUser.username || currentUser.Username || "",
          u_Name: currentUser.u_Name || currentUser.name || "",
          u_Mobile: currentUser.u_Mobile || currentUser.mobile || "",
          u_Email: currentUser.u_Email || currentUser.email || "",
          u_Address: currentUser.u_Address || currentUser.address || "",
          password: "",
        });
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      toast.error("Failed to load user data");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("User ID not found");
      return;
    }
    try {
      setLoading(true);
      const payload: any = {
        username: editForm.username.trim(),
        u_Name: editForm.u_Name.trim(),
        u_Mobile: editForm.u_Mobile.trim(),
        u_Email: editForm.u_Email.trim(),
        u_Address: editForm.u_Address.trim(),
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }
      await endpoints.user.update(currentUserId, payload);
      toast.success("Profile updated successfully!");
      setShowEditModal(false);
      // Update localStorage name if changed
      if (editForm.u_Name.trim()) {
        localStorage.setItem("userName", editForm.u_Name.trim());
      }
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topbar-wrapper">
      <div className="topbar-card">
        <div className="topbar-left">
          <div
            className="avatar-circle"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ cursor: "pointer", position: "relative" }}
          >
            {initials}
            {showDropdown && (
              <div
                className="avatar-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="avatar-dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowEditModal(true);
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: 8 }}
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </button>
              </div>
            )}
          </div>
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

          <button
            className="logout-topbar"
            onClick={() => setShowLogoutConfirm(true)}
          >
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
      {showLogoutConfirm && (
        <div
          className="logout-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-icon">!</div>
            <h2 id="logout-title" className="logout-modal-title">
              Are you sure?
            </h2>
            <div className="logout-modal-actions">
              <button
                className="confirm-logout-btn"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  clearAuth();
                  // reload to ensure app state is fully reset after logout
                  setTimeout(() => window.location.reload(), 50);
                }}
              >
                Yes, log out!
              </button>
              <button
                className="cancel-logout-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && (
        <div
          className="logout-modal-overlay"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="edit-profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-profile-header">
              <h2>Edit Profile</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form className="edit-profile-form" onSubmit={handleEditSubmit}>
              <div className="form-group-topbar">
                <label htmlFor="edit-username">Username *</label>
                <input
                  id="edit-username"
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group-topbar">
                <label htmlFor="edit-name">Full Name *</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editForm.u_Name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, u_Name: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group-topbar">
                <label htmlFor="edit-mobile">Mobile</label>
                <input
                  id="edit-mobile"
                  type="tel"
                  maxLength={10}
                  value={editForm.u_Mobile}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      u_Mobile: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  disabled={loading}
                />
              </div>
              <div className="form-group-topbar">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.u_Email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, u_Email: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="form-group-topbar">
                <label htmlFor="edit-address">Address</label>
                <textarea
                  id="edit-address"
                  rows={2}
                  value={editForm.u_Address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, u_Address: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="form-group-topbar">
                <label htmlFor="edit-password">
                  New Password (leave blank to keep current)
                </label>
                <input
                  id="edit-password"
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  disabled={loading}
                  style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
                />
              </div>
              <div className="edit-profile-actions">
                <button
                  type="button"
                  className="cancel-logout-btn"
                  onClick={() => setShowEditModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="confirm-logout-btn"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Topbar;
