import React, { useEffect, useState } from "react";
import "./Rolemaster.css";
import { endpoints } from "../api/endpoint";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmDialog from "./ConfirmDialog";

interface Location {
  locationId: number;
  locationName: string;
  description: string;
  isActive: boolean;
}

function Locationmaster() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    locationName: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await endpoints.location.getAll();
      let data: any = res.data;
      if (data && typeof data === "object") {
        if (Array.isArray(data.data)) data = data.data;
        else if (Array.isArray(data.$values)) data = data.$values;
        else if (Array.isArray(data.locations)) data = data.locations;
      }
      const normalized = (Array.isArray(data) ? data : []).map((it: any) => ({
        locationId: it.locationId ?? it.LocationId ?? it.id ?? it.Id ?? 0,
        locationName: it.locationName ?? it.LocationName ?? "",
        description: it.description ?? it.Description ?? "",
        isActive:
          it.isActive !== undefined
            ? it.isActive
            : it.IsActive !== undefined
            ? it.IsActive
            : true,
      }));
      setLocations(normalized);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch locations");
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.locationName.trim()) {
      setError("Location name is required");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const payload = {
        locationName: formData.locationName.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
      };
      if (editingId) {
        await endpoints.location.update(editingId, payload);
        toast.success("Location updated");
      } else {
        await endpoints.location.create(payload);
        toast.success("Location created");
      }
      resetForm();
      await fetchLocations();
    } catch (err: any) {
      console.error(err);
      setError("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (loc: Location) => {
    setFormData({
      locationName: loc.locationName,
      description: loc.description,
      isActive: loc.isActive,
    });
    setEditingId(loc.locationId);
    setShowForm(true);
    setError("");
  };

  const handleDelete = (locationId: number) => {
    setLocationToDelete(locationId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      setLoading(true);
      setShowConfirmDialog(false);
      await endpoints.location.delete(locationToDelete);
      await fetchLocations();
      toast.success("Location deleted successfully!");
    } catch (err: any) {
      console.error(err);
      const errorMsg = "Failed to delete location";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setLocationToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({ locationName: "", description: "", isActive: true });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((s) => ({
      ...s,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const filtered = locations.filter(
    (l) =>
      l.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const displayed = filtered.slice(startIndex, startIndex + entriesPerPage);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="rolemaster-container">
        <div className="rolemaster-header">
          <h1 className="rolemaster-title">Locations</h1>
          <button
            className="add-role-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "View All Locations" : "+ Add Location"}
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingId ? "Edit Location" : "Add Location"}
                </h2>
                <button className="modal-close" onClick={resetForm}>
                  ×
                </button>
              </div>
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Location Name *</label>
                  <input
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleInputChange}
                    className="role-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="role-input"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      name="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleInputChange as any}
                    />
                    <span>Active</span>
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
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : editingId ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="role-table-section-full">
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
                placeholder="Search locations..."
              />
            </div>
          </div>

          <div className="role-table-wrapper">
            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? "No locations found" : "No locations added yet"}
              </div>
            ) : (
              <>
                <table className="role-table">
                  <thead>
                    <tr>
                      <th>Sr.No.</th>
                      <th>Location Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((loc, idx) => (
                      <tr key={loc.locationId}>
                        <td>{startIndex + idx + 1}</td>
                        <td>{loc.locationName}</td>
                        <td>{loc.description}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              loc.isActive ? "active" : "inactive"
                            }`}
                          >
                            {loc.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleEdit(loc)}
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
                              onClick={() => handleDelete(loc.locationId)}
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

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="pagination-btn"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirm Delete"
        message="Are you sure you want to delete this location?"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirmDialog(false);
          setLocationToDelete(null);
        }}
      />
    </>
  );
}

export default Locationmaster;
