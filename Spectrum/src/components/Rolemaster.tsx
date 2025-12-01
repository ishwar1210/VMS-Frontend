import React, { useState, useEffect } from "react";
import "./Rolemaster.css";
import { endpoints } from "../api/endpoint";

interface Role {
  roleId: number;
  roleName: string;
}

function Rolemaster() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleName, setRoleName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [rawResponse, setRawResponse] = useState<any>(null);

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await endpoints.role.getAll();
      console.log("API Response:", res.data);
      setRawResponse(res.data);

      // Handle different response formats
      let rolesData = res.data;
      if (rolesData && typeof rolesData === "object") {
        // If response has a roles property containing the array
        if (Array.isArray(rolesData.roles)) {
          rolesData = rolesData.roles;
        }
        // If response has a data property containing the array
        else if (Array.isArray(rolesData.data)) {
          rolesData = rolesData.data;
        }
        // If response has a $values property (common in .NET responses)
        else if (Array.isArray(rolesData.$values)) {
          rolesData = rolesData.$values;
        }
        // If response itself is an array
        else if (!Array.isArray(rolesData)) {
          rolesData = [];
        }
      }

      // Normalize each item to { roleId, roleName }
      const normalized = (Array.isArray(rolesData) ? rolesData : []).map(
        (item: any, idx: number) => {
          if (!item) return { roleId: idx + 1, roleName: String(item) };

          // If item is a primitive (string/number), use it as roleName
          if (typeof item === "string" || typeof item === "number") {
            return { roleId: idx + 1, roleName: String(item) };
          }

          // Helper: find first property value whose key contains any of these keywords
          const findByKey = (obj: any, keys: string[]) => {
            for (const k of Object.keys(obj || {})) {
              for (const key of keys) {
                if (k.toLowerCase().includes(key)) return obj[k];
              }
            }
            return undefined;
          };

          // Try common property names for id and name, fallback to findByKey
          const roleIdRaw =
            item.roleId ??
            item.id ??
            item.RoleId ??
            item.role_id ??
            item.ID ??
            item.Id;
          const roleId = roleIdRaw ?? idx + 1;

          const roleNameRaw =
            item.roleName ??
            item.Role ??
            item.name ??
            item.RoleName ??
            item.role ??
            item.RoleName;
          let roleName =
            roleNameRaw ??
            findByKey(item, ["role", "name", "rolename", "title"]);

          // If still object, try nested common paths
          if (roleName && typeof roleName === "object") {
            roleName =
              roleName.name ?? roleName.roleName ?? JSON.stringify(roleName);
          }

          roleName = roleName ? String(roleName) : "";

          return { roleId, roleName };
        }
      );

      console.log("Normalized roles:", normalized);
      setRoles(normalized);
    } catch (err: any) {
      console.error("Error fetching roles:", err);
      setError(err?.response?.data?.message || "Failed to fetch roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    try {
      setError("");
      if (editingId) {
        // Update existing role
        await endpoints.role.update(editingId, { roleName: roleName.trim() });
      } else {
        // Create new role
        await endpoints.role.create({ roleName: roleName.trim() });
      }
      setRoleName("");
      setEditingId(null);
      await fetchRoles();
    } catch (err: any) {
      console.error("Error saving role:", err);
      setError(err?.response?.data?.message || "Failed to save role");
    }
  };

  const handleEdit = (role: Role) => {
    setRoleName(role.roleName);
    setEditingId(role.roleId);
  };

  const handleDelete = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      setError("");
      await endpoints.role.delete(roleId);
      await fetchRoles();
    } catch (err: any) {
      console.error("Error deleting role:", err);
      setError(err?.response?.data?.message || "Failed to delete role");
    }
  };

  const handleCancelEdit = () => {
    setRoleName("");
    setEditingId(null);
  };

  // Filter roles based on search
  const filteredRoles = roles.filter((role) =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate
  const displayedRoles = filteredRoles.slice(0, entriesPerPage);

  return (
    <div className="rolemaster-container">
      <h1 className="rolemaster-title">Add User Role</h1>

      <div className="rolemaster-content">
        {/* Form Section */}
        <div className="role-form-section">
          <h2 className="role-form-title">User Role</h2>
          <form className="role-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="role-input"
              placeholder="Role Name *"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                className="role-save-btn"
                disabled={loading || !roleName.trim()}
              >
                {loading ? "Saving..." : editingId ? "Update" : "Save"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="role-save-btn"
                  onClick={handleCancelEdit}
                  style={{ background: "#64748b" }}
                >
                  Cancel
                </button>
              )}
            </div>
            {error && <div className="error-message">{error}</div>}
          </form>
        </div>

        {/* Table Section */}
        <div className="role-table-section">
          <div className="table-controls">
            <div className="show-entries">
              <span>Show</span>
              <select
                className="entries-select"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            <div className="search-box">
              <span>Search:</span>
              <input
                type="text"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search roles..."
              />
            </div>
          </div>

          <div className="role-table-wrapper">
            {loading ? (
              <div className="loading-state">Loading roles...</div>
            ) : filteredRoles.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? "No roles found" : "No roles added yet"}
                {/* Debug: show raw response when empty so we can see API shape */}
                {rawResponse && (
                  <pre
                    style={{
                      textAlign: "left",
                      marginTop: 12,
                      maxHeight: 240,
                      overflow: "auto",
                      background: "rgba(0,0,0,0.04)",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    {JSON.stringify(rawResponse, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <table className="role-table">
                <thead>
                  <tr>
                    <th className="sortable">Sr.No.</th>
                    <th className="sortable">Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRoles.map((role, index) => (
                    <tr key={role.roleId}>
                      <td>{index + 1}</td>
                      <td>{role.roleName}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(role)}
                            title="Edit"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(role.roleId)}
                            title="Delete"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rolemaster;
