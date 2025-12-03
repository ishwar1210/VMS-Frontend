import React, { useEffect, useState } from "react";
import "./Rolemaster.css";
import { endpoints } from "../api/endpoint";

interface VisitorEntry {
  visitorEntry_Id: number;
  visitorEntry_visitorId: number;
  visitorEntry_Gatepass: string;
  visitorEntry_Vehicletype: string;
  visitorEntry_Vehicleno: string;
  visitorEntry_Date: string;
  visitorEntry_Intime: string;
  visitorEntry_Userid: number;
  visitorEntry_isCanteen: boolean;
  visitorEntry_isStay: boolean;
}

function Visitorentryapproval() {
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    visitorEntry_visitorId: 0,
    visitorEntry_Gatepass: "",
    visitorEntry_Vehicletype: "",
    visitorEntry_Vehicleno: "",
    visitorEntry_Date: "",
    visitorEntry_Intime: "",
    visitorEntry_Userid: 0,
    visitorEntry_isCanteen: false,
    visitorEntry_isStay: false,
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await endpoints.visitorEntry.getAll();
      let data: any = res.data;

      if (data && typeof data === "object") {
        if (Array.isArray(data.data)) data = data.data;
        else if (Array.isArray(data.$values)) data = data.$values;
        else if (Array.isArray(data.visitorEntries)) data = data.visitorEntries;
      }

      const normalized = (Array.isArray(data) ? data : []).map((it: any) => ({
        visitorEntry_Id: it.visitorEntry_Id ?? it.id ?? it.Id ?? 0,
        visitorEntry_visitorId: it.visitorEntry_visitorId ?? it.visitorId ?? 0,
        visitorEntry_Gatepass: it.visitorEntry_Gatepass ?? it.gatepass ?? "",
        visitorEntry_Vehicletype:
          it.visitorEntry_Vehicletype ?? it.vehicletype ?? "",
        visitorEntry_Vehicleno: it.visitorEntry_Vehicleno ?? it.vehicleno ?? "",
        visitorEntry_Date: it.visitorEntry_Date ?? it.date ?? "",
        visitorEntry_Intime: it.visitorEntry_Intime ?? it.intime ?? "",
        visitorEntry_Userid: it.visitorEntry_Userid ?? it.userid ?? 0,
        visitorEntry_isCanteen:
          it.visitorEntry_isCanteen ?? it.isCanteen ?? false,
        visitorEntry_isStay: it.visitorEntry_isStay ?? it.isStay ?? false,
      }));

      // Sort by ID descending (newest first)
      normalized.sort(
        (a: VisitorEntry, b: VisitorEntry) =>
          b.visitorEntry_Id - a.visitorEntry_Id
      );

      setEntries(normalized);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch visitor entries");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const payload = {
        visitorEntry_visitorId: formData.visitorEntry_visitorId,
        visitorEntry_Gatepass: formData.visitorEntry_Gatepass.trim(),
        visitorEntry_Vehicletype: formData.visitorEntry_Vehicletype.trim(),
        visitorEntry_Vehicleno: formData.visitorEntry_Vehicleno.trim(),
        visitorEntry_Date: formData.visitorEntry_Date,
        visitorEntry_Intime: formData.visitorEntry_Intime,
        visitorEntry_Userid: formData.visitorEntry_Userid,
        visitorEntry_isCanteen: formData.visitorEntry_isCanteen,
        visitorEntry_isStay: formData.visitorEntry_isStay,
      };

      if (editingId) {
        await endpoints.visitorEntry.update(editingId, payload);
        alert("Visitor entry updated");
      }

      resetForm();
      await fetchEntries();
    } catch (err: any) {
      console.error(err);
      setError("Failed to save visitor entry");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: VisitorEntry) => {
    setFormData({
      visitorEntry_visitorId: entry.visitorEntry_visitorId,
      visitorEntry_Gatepass: entry.visitorEntry_Gatepass,
      visitorEntry_Vehicletype: entry.visitorEntry_Vehicletype,
      visitorEntry_Vehicleno: entry.visitorEntry_Vehicleno,
      visitorEntry_Date: entry.visitorEntry_Date,
      visitorEntry_Intime: entry.visitorEntry_Intime,
      visitorEntry_Userid: entry.visitorEntry_Userid,
      visitorEntry_isCanteen: entry.visitorEntry_isCanteen,
      visitorEntry_isStay: entry.visitorEntry_isStay,
    });
    setEditingId(entry.visitorEntry_Id);
    setShowForm(true);
    setError("");
  };

  const resetForm = () => {
    setFormData({
      visitorEntry_visitorId: 0,
      visitorEntry_Gatepass: "",
      visitorEntry_Vehicletype: "",
      visitorEntry_Vehicleno: "",
      visitorEntry_Date: "",
      visitorEntry_Intime: "",
      visitorEntry_Userid: 0,
      visitorEntry_isCanteen: false,
      visitorEntry_isStay: false,
    });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((s) => ({
      ...s,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const filtered = entries.filter(
    (e) =>
      e.visitorEntry_Gatepass
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      e.visitorEntry_Vehicleno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const displayed = filtered.slice(startIndex, startIndex + entriesPerPage);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="rolemaster-container">
      <div className="rolemaster-header">
        <h1 className="rolemaster-title">Visitor Entry Approval</h1>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Visitor Entry</h2>
              <button className="modal-close" onClick={resetForm}>
                ×
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Visitor ID</label>
                <input
                  name="visitorEntry_visitorId"
                  type="number"
                  value={formData.visitorEntry_visitorId}
                  onChange={handleInputChange}
                  className="role-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Gatepass</label>
                <input
                  name="visitorEntry_Gatepass"
                  value={formData.visitorEntry_Gatepass}
                  onChange={handleInputChange}
                  className="role-input"
                />
              </div>
              <div className="form-group">
                <label>Vehicle Type</label>
                <select
                  name="visitorEntry_Vehicletype"
                  value={formData.visitorEntry_Vehicletype}
                  onChange={handleInputChange}
                  className="role-input"
                >
                  <option value="">Select Type</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Truck">Truck</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Vehicle No</label>
                <input
                  name="visitorEntry_Vehicleno"
                  value={formData.visitorEntry_Vehicleno}
                  onChange={handleInputChange}
                  className="role-input"
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  name="visitorEntry_Date"
                  type="datetime-local"
                  value={formData.visitorEntry_Date}
                  onChange={handleInputChange}
                  className="role-input"
                />
              </div>
              <div className="form-group">
                <label>In Time</label>
                <input
                  name="visitorEntry_Intime"
                  type="datetime-local"
                  value={formData.visitorEntry_Intime}
                  onChange={handleInputChange}
                  className="role-input"
                />
              </div>
              <div className="form-group">
                <label>User ID</label>
                <input
                  name="visitorEntry_Userid"
                  type="number"
                  value={formData.visitorEntry_Userid}
                  onChange={handleInputChange}
                  className="role-input"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    name="visitorEntry_isCanteen"
                    type="checkbox"
                    checked={formData.visitorEntry_isCanteen}
                    onChange={handleInputChange}
                  />
                  <span>Canteen Access</span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    name="visitorEntry_isStay"
                    type="checkbox"
                    checked={formData.visitorEntry_isStay}
                    onChange={handleInputChange}
                  />
                  <span>Stay</span>
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
                  {loading ? "Saving..." : "Update"}
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
              placeholder="Search by gatepass or vehicle..."
            />
          </div>
        </div>

        <div className="role-table-wrapper">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? "No entries found" : "No visitor entries yet"}
            </div>
          ) : (
            <>
              <table className="role-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Gatepass</th>
                    <th>Visitor ID</th>
                    <th>Vehicle Type</th>
                    <th>Vehicle No</th>
                    <th>Date</th>
                    <th>In Time</th>
                    <th>Canteen</th>
                    <th>Stay</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((entry, idx) => (
                    <tr key={entry.visitorEntry_Id}>
                      <td>{startIndex + idx + 1}</td>
                      <td>{entry.visitorEntry_Gatepass}</td>
                      <td>{entry.visitorEntry_visitorId}</td>
                      <td>{entry.visitorEntry_Vehicletype}</td>
                      <td>{entry.visitorEntry_Vehicleno}</td>
                      <td>{formatDateTime(entry.visitorEntry_Date)}</td>
                      <td>{formatDateTime(entry.visitorEntry_Intime)}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            entry.visitorEntry_isCanteen ? "active" : "inactive"
                          }`}
                        >
                          {entry.visitorEntry_isCanteen ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            entry.visitorEntry_isStay ? "active" : "inactive"
                          }`}
                        >
                          {entry.visitorEntry_isStay ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(entry)}
                            title="Edit"
                            aria-label="Edit"
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
  );
}

export default Visitorentryapproval;
