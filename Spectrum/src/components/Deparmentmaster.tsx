import React, { useState, useEffect } from "react";
import "./Deparmentmaster.css";
import { endpoints } from "../api/endpoint";

interface Department {
  departmentId: number;
  departmentName: string;
}

function Deparmentmaster() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [rawResponse, setRawResponse] = useState<any>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await endpoints.department.getAll();
      console.log("API Response (departments):", res.data);
      setRawResponse(res.data);

      let data = res.data;
      if (data && typeof data === "object") {
        if (Array.isArray(data.roles)) {
          // defensive (in case backend returns mixed shapes)
          data = data.roles;
        } else if (Array.isArray(data.departments)) {
          data = data.departments;
        } else if (Array.isArray(data.data)) {
          data = data.data;
        } else if (Array.isArray(data.$values)) {
          data = data.$values;
        } else if (!Array.isArray(data)) {
          data = [];
        }
      }

      const normalized = (Array.isArray(data) ? data : []).map(
        (item: any, idx: number) => {
          if (!item)
            return { departmentId: idx + 1, departmentName: String(item) };

          if (typeof item === "string" || typeof item === "number") {
            return { departmentId: idx + 1, departmentName: String(item) };
          }

          const findByKey = (obj: any, keys: string[]) => {
            for (const k of Object.keys(obj || {})) {
              for (const key of keys) {
                if (k.toLowerCase().includes(key)) return obj[k];
              }
            }
            return undefined;
          };

          const departmentIdRaw =
            item.departmentId ??
            item.id ??
            item.DepartmentId ??
            item.department_id ??
            item.ID ??
            item.Id;
          const departmentId = departmentIdRaw ?? idx + 1;

          const departmentNameRaw =
            item.departmentName ??
            item.Department ??
            item.name ??
            item.DepartmentName ??
            item.department ??
            item.Name;
          let dName =
            departmentNameRaw ??
            findByKey(item, ["department", "name", "departmentname", "title"]);

          if (dName && typeof dName === "object") {
            dName = dName.name ?? dName.departmentName ?? JSON.stringify(dName);
          }

          dName = dName ? String(dName) : "";

          return { departmentId, departmentName: dName };
        }
      );

      console.log("Normalized departments:", normalized);
      setDepartments(normalized);
    } catch (err: any) {
      console.error("Error fetching departments:", err);
      setError(err?.response?.data?.message || "Failed to fetch departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName.trim()) return;

    try {
      setError("");
      if (editingId) {
        await endpoints.department.update(editingId, {
          departmentName: departmentName.trim(),
        });
      } else {
        await endpoints.department.create({
          departmentName: departmentName.trim(),
        });
      }
      setDepartmentName("");
      setEditingId(null);
      await fetchDepartments();
    } catch (err: any) {
      console.error("Error saving department:", err);
      setError(err?.response?.data?.message || "Failed to save department");
    }
  };

  const handleEdit = (dept: Department) => {
    setDepartmentName(dept.departmentName);
    setEditingId(dept.departmentId);
  };

  const handleDelete = async (departmentId: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      setError("");
      await endpoints.department.delete(departmentId);
      await fetchDepartments();
    } catch (err: any) {
      console.error("Error deleting department:", err);
      setError(err?.response?.data?.message || "Failed to delete department");
    }
  };

  const handleCancelEdit = () => {
    setDepartmentName("");
    setEditingId(null);
  };

  const filtered = departments.filter((d) =>
    d.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayed = filtered.slice(0, entriesPerPage);

  return (
    <div className="departmentmaster-container">
      <h1 className="departmentmaster-title">Add Department</h1>

      <div className="departmentmaster-content">
        <div className="department-form-section">
          <h2 className="department-form-title">Department</h2>
          <form className="department-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="department-input"
              placeholder="Department Name *"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                className="department-save-btn"
                disabled={loading || !departmentName.trim()}
              >
                {loading ? "Saving..." : editingId ? "Update" : "Save"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="department-save-btn"
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

        <div className="department-table-section">
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
                placeholder="Search departments..."
              />
            </div>
          </div>

          <div className="department-table-wrapper">
            {loading ? (
              <div className="loading-state">Loading departments...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                {searchTerm
                  ? "No departments found"
                  : "No departments added yet"}
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
              <table className="department-table">
                <thead>
                  <tr>
                    <th className="sortable">Sr.No.</th>
                    <th className="sortable">Department</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((d, index) => (
                    <tr key={d.departmentId}>
                      <td>{index + 1}</td>
                      <td>{d.departmentName}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(d)}
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
                            onClick={() => handleDelete(d.departmentId)}
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

export default Deparmentmaster;
