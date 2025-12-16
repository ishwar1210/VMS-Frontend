import { useState, useEffect } from "react";
import { endpoints } from "../api/endpoint";
import "./Rolemaster.css";

interface Parcel {
  parcelId?: number;
  parcelBarcode: string;
  parcelCompanyName: string;
  userId: number;
  isActive: boolean;
  parcelHandover?: boolean;
  createdDate?: string;
  updatedDate?: string;
  userName?: string;
}

interface User {
  userId: number;
  username: string;
  u_Name: string;
}

interface SecurityparcelentryProps {
  onParcelAdded?: () => void;
}

function Securityparcelentry({ onParcelAdded }: SecurityparcelentryProps) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    parcelBarcode: "",
    parcelCompanyName: "",
    userId: "",
    isActive: true,
    parcelHandover: false,
  });

  useEffect(() => {
    fetchParcels();
    fetchUsers();
  }, []);

  const fetchParcels = async () => {
    try {
      setLoading(true);
      const response = await endpoints.parcel.getAll();
      const data = response?.data || [];
      const parcelList = data?.$values || data?.data || data || [];

      // Normalize parcels
      const normalizedParcels = (
        Array.isArray(parcelList) ? parcelList : []
      ).map((item: any) => ({
        parcelId: item.parcelId || item.ParcelId || item.id || 0,
        parcelBarcode:
          item.parcelBarcode || item.ParcelBarcode || item.barcode || "",
        parcelCompanyName:
          item.parcelCompanyName ||
          item.ParcelCompanyName ||
          item.companyName ||
          "",
        userId: item.userId || item.UserId || item.user_Id || 0,
        isActive:
          item.isActive !== undefined
            ? item.isActive
            : item.IsActive !== undefined
            ? item.IsActive
            : true,
        parcelHandover:
          item.parcelHandover !== undefined
            ? item.parcelHandover
            : item.ParcelHandover !== undefined
            ? item.ParcelHandover
            : false,
        createdDate:
          item.createdDate || item.CreatedDate || item.created_date || "",
        updatedDate:
          item.updatedDate || item.UpdatedDate || item.updated_date || "",
      }));

      setParcels(normalizedParcels);
    } catch (err) {
      console.error("Error fetching parcels:", err);
      setError("Failed to load parcels");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await endpoints.user.getAll();
      const data = response?.data || [];
      const userList = data?.$values || data?.data || data || [];

      const normalizedUsers = (Array.isArray(userList) ? userList : []).map(
        (item: any) => ({
          userId: item.userId || item.UserId || item.id || 0,
          username: item.username || item.Username || item.userName || "",
          u_Name: item.u_Name || item.name || item.fullName || "",
        })
      );

      setUsers(normalizedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const payload = {
        parcelBarcode: formData.parcelBarcode.trim(),
        parcelCompanyName: formData.parcelCompanyName.trim(),
        userId: Number(formData.userId),
        isActive: formData.isActive,
        parcelHandover: formData.parcelHandover,
      };

      if (editingId) {
        await endpoints.parcel.update(editingId, payload);
        alert("Parcel updated successfully!");
      } else {
        await endpoints.parcel.create(payload);
        alert("Parcel created successfully!");

        // Notify parent to refresh notification count
        if (onParcelAdded) {
          onParcelAdded();
        }
      }

      resetForm();
      await fetchParcels();
    } catch (err: any) {
      console.error("Error saving parcel:", err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to save parcel"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (parcel: Parcel) => {
    setFormData({
      parcelBarcode: parcel.parcelBarcode,
      parcelCompanyName: parcel.parcelCompanyName,
      userId: String(parcel.userId),
      isActive: parcel.isActive,
      parcelHandover: parcel.parcelHandover || false,
    });
    setEditingId(parcel.parcelId || null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this parcel?")) return;

    try {
      setLoading(true);
      await endpoints.parcel.delete(id);
      alert("Parcel deleted successfully!");
      await fetchParcels();
    } catch (err: any) {
      console.error("Error deleting parcel:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete parcel"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      parcelBarcode: "",
      parcelCompanyName: "",
      userId: "",
      isActive: true,
      parcelHandover: false,
    });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  // Filter and pagination logic
  const filteredParcels = parcels.filter(
    (parcel) =>
      parcel.parcelBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.parcelCompanyName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (users.find((u) => u.userId === parcel.userId)?.u_Name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredParcels.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const displayedParcels = filteredParcels.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  return (
    <div className="role-master-container">
      <div className="role-header">
        <h2 className="role-title">Parcel Entry Management</h2>
        <button className="add-role-btn" onClick={() => setShowForm(true)}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Parcel
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Edit Parcel" : "Add New Parcel"}</h3>
              <button className="modal-close" onClick={resetForm}>
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Barcode *</label>
                <input
                  type="text"
                  name="parcelBarcode"
                  value={formData.parcelBarcode}
                  onChange={handleInputChange}
                  placeholder="e.g., PCL-20251234"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="parcelCompanyName"
                  value={formData.parcelCompanyName}
                  onChange={handleInputChange}
                  placeholder="e.g., Acme Logistics"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Assign to User *</label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.u_Name || user.username} ({user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="parcelHandover"
                    checked={formData.parcelHandover}
                    onChange={handleInputChange}
                  />
                  <span>Parcel Handover</span>
                </label>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-controls">
        <div className="show-entries">
          <span>Show</span>
          <select
            className="entries-select"
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
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
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search parcels..."
          />
        </div>
      </div>

      <div className="role-table-wrapper">
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : displayedParcels.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? "No parcels found" : "No parcels yet"}
          </div>
        ) : (
          <table className="role-table">
            <thead>
              <tr>
                <th>SR.NO.</th>
                <th>BARCODE</th>
                <th>COMPANY NAME</th>
                <th>ASSIGNED USER</th>
                <th>HANDOVER</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {displayedParcels.map((parcel, idx) => {
                const user = users.find((u) => u.userId === parcel.userId);
                return (
                  <tr key={parcel.parcelId || idx}>
                    <td>{startIndex + idx + 1}</td>
                    <td>{parcel.parcelBarcode}</td>
                    <td>{parcel.parcelCompanyName}</td>
                    <td>{user ? user.u_Name || user.username : "N/A"}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          parcel.parcelHandover ? "active" : "inactive"
                        }`}
                      >
                        {parcel.parcelHandover ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          parcel.isActive ? "active" : "inactive"
                        }`}
                      >
                        {parcel.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(parcel)}
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
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() =>
                            parcel.parcelId && handleDelete(parcel.parcelId)
                          }
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
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Securityparcelentry;
