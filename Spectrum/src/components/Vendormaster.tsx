// Vendormaster.tsx  vendor update is not working  

import React, { useState, useEffect } from "react";
import "./Vendormaster.css";
import { endpoints } from "../api/endpoint";

interface Vendor {
  vendorId: number;
  vendorCode: string;
  vendorName: string;
  vendorMobile: string;
  idProofType: string;
  idProof: string;
  vendorAddress: string;
  company: string;
  isActive: boolean;
}

function Vendormaster() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    vendorCode: "",
    vendorName: "",
    vendorMobile: "",
    idProofType: "",
    idProof: "",
    vendorAddress: "",
    company: "",
    isActive: true,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await endpoints.vendor.getAll();
      console.log("API Response (vendors):", res.data);

      let data = res.data;
      if (data && typeof data === "object") {
        if (Array.isArray(data.vendors)) {
          data = data.vendors;
        } else if (Array.isArray(data.data)) {
          data = data.data;
        } else if (Array.isArray(data.$values)) {
          data = data.$values;
        } else if (!Array.isArray(data)) {
          data = [];
        }
      }

      const normalized = (Array.isArray(data) ? data : []).map((item: any) => ({
        vendorId: item.vendorId || item.VendorId || item.id || item.Id || 0,
        vendorCode: item.vendorCode || item.VendorCode || "",
        vendorName: item.vendorName || item.VendorName || "",
        vendorMobile: item.vendorMobile || item.VendorMobile || "",
        idProofType: item.idProofType || item.IdProofType || "",
        idProof: item.idProof || item.IdProof || "",
        vendorAddress: item.vendorAddress || item.VendorAddress || "",
        company: item.company || item.Company || "",
        isActive:
          item.isActive !== undefined
            ? item.isActive
            : item.IsActive !== undefined
            ? item.IsActive
            : true,
      }));

      console.log("Normalized vendors:", normalized);
      setVendors(normalized);
    } catch (err: any) {
      console.error("Error fetching vendors:", err);
      setError(err?.response?.data?.message || "Failed to fetch vendors");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorCode.trim()) {
      setError("Vendor code is required");
      return;
    }

    if (!formData.vendorName.trim()) {
      setError("Vendor name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        vendorCode: formData.vendorCode.trim(),
        vendorName: formData.vendorName.trim(),
        vendorMobile: formData.vendorMobile.trim(),
        idProofType: formData.idProofType.trim(),
        idProof: formData.idProof.trim(),
        vendorAddress: formData.vendorAddress.trim(),
        company: formData.company.trim(),
        isActive: formData.isActive,
      };

      if (editingId) {
        console.log("Updating vendor ID:", editingId);
        console.log("Payload:", payload);
        await endpoints.vendor.update(editingId, payload);
        alert("Vendor updated successfully!");
      } else {
        console.log("Creating vendor:", payload);
        await endpoints.vendor.create(payload);
        alert("Vendor created successfully!");
      }

      resetForm();
      await fetchVendors();
    } catch (err: any) {
      console.error("Error saving vendor:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          "Failed to save vendor"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    console.log("Editing vendor:", vendor);
    setFormData({
      vendorCode: vendor.vendorCode,
      vendorName: vendor.vendorName,
      vendorMobile: vendor.vendorMobile,
      idProofType: vendor.idProofType,
      idProof: vendor.idProof,
      vendorAddress: vendor.vendorAddress,
      company: vendor.company,
      isActive: vendor.isActive,
    });
    setEditingId(vendor.vendorId);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (vendorId: number) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;

    try {
      setError("");
      setLoading(true);
      await endpoints.vendor.delete(vendorId);
      await fetchVendors();
      alert("Vendor deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting vendor:", err);
      setError(err?.response?.data?.message || "Failed to delete vendor");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendorCode: "",
      vendorName: "",
      vendorMobile: "",
      idProofType: "",
      idProof: "",
      vendorAddress: "",
      company: "",
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVendors.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const displayedVendors = filteredVendors.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  return (
    <div className="vendormaster-container">
      <div className="vendormaster-header">
        <h1 className="vendormaster-title">Vendors</h1>
        <button
          className="add-vendor-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "View All Vendors" : "+ Add Vendor"}
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingId ? "Edit Vendor" : "Add New Vendor"}
              </h2>
              <button className="modal-close" onClick={handleCancelEdit}>
                <svg
                  width="24"
                  height="24"
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
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vendorCode">Vendor Code *</label>
                  <input
                    id="vendorCode"
                    name="vendorCode"
                    type="text"
                    className="vendor-input"
                    placeholder="Enter vendor code"
                    value={formData.vendorCode}
                    onChange={handleInputChange}
                    disabled={editingId !== null}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vendorName">Vendor Name *</label>
                  <input
                    id="vendorName"
                    name="vendorName"
                    type="text"
                    className="vendor-input"
                    placeholder="Enter vendor name"
                    value={formData.vendorName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="vendorMobile">Mobile</label>
                  <input
                    id="vendorMobile"
                    name="vendorMobile"
                    type="tel"
                    className="vendor-input"
                    placeholder="Enter mobile number"
                    value={formData.vendorMobile}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    className="vendor-input"
                    placeholder="Enter company name"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="idProofType">ID Proof Type</label>
                  <select
                    id="idProofType"
                    name="idProofType"
                    className="vendor-input"
                    value={formData.idProofType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select ID Proof Type</option>
                    <option value="Aadhar">Aadhar</option>
                    <option value="PAN">PAN</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="idProof">ID Proof Number</label>
                  <input
                    id="idProof"
                    name="idProof"
                    type="text"
                    className="vendor-input"
                    placeholder="Enter ID proof number"
                    value={formData.idProof}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="vendorAddress">Address</label>
                <textarea
                  id="vendorAddress"
                  name="vendorAddress"
                  className="vendor-input"
                  placeholder="Enter address"
                  value={formData.vendorAddress}
                  onChange={handleInputChange}
                  rows={2}
                />
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

              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="vendor-table-section-full">
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
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search vendors..."
            />
          </div>
        </div>

        <div className="vendor-table-wrapper">
          {loading ? (
            <div className="loading-state">Loading vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? "No vendors found" : "No vendors added yet"}
            </div>
          ) : (
            <>
              <table className="vendor-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Vendor Code</th>
                    <th>Vendor Name</th>
                    <th>Mobile</th>
                    <th>Company</th>
                    <th>ID Proof Type</th>
                    <th>ID Proof</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedVendors.map((vendor, index) => (
                    <tr key={vendor.vendorId}>
                      <td>{startIndex + index + 1}</td>
                      <td>{vendor.vendorCode}</td>
                      <td>{vendor.vendorName}</td>
                      <td>{vendor.vendorMobile}</td>
                      <td>{vendor.company}</td>
                      <td>{vendor.idProofType}</td>
                      <td>{vendor.idProof}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            vendor.isActive ? "active" : "inactive"
                          }`}
                        >
                          {vendor.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(vendor)}
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
                            onClick={() => handleDelete(vendor.vendorId)}
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
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
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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

export default Vendormaster;
