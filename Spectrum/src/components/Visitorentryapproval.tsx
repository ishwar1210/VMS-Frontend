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
  visitorEntry_Outtime?: string;
  visitorEntry_Userid: number;
  visitorEntry_isCanteen: boolean;
  visitorEntry_isStay: boolean;
  visitorEntry_isApproval?: boolean;
  visitorEntry_adminApproval?: boolean;
  visitorEntry_userApproval?: boolean;
  visitorEntry_visitorName?: string;
  // include any unknown keys
  [key: string]: any;
}

interface Visitor {
  visitor_Id: number;
  visitor_Name: string;
  visitor_Email?: string;
  visitor_Mobile?: string;
}

function Visitorentryapproval() {
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyEntriesPerPage, setHistoryEntriesPerPage] = useState(10);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

  const [formData, setFormData] = useState<any>({
    visitorEntry_visitorId: 0,
    visitorEntry_Gatepass: "",
    visitorEntry_Vehicletype: "",
    visitorEntry_Vehicleno: "",
    visitorEntry_Date: "",
    visitorEntry_Intime: "",
    visitorEntry_Outtime: "",
    visitorEntry_Userid: 0,
    visitorEntry_isCanteen: false,
    visitorEntry_isStay: false,
    visitorEntry_isApproval: false,
    visitorEntry_adminApproval: false,
    visitorEntry_userApproval: false,
    visitorEntry_visitorName: "",
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // --- Fetch visitors ---
      const visitorRes = await endpoints.visitor.getAll();
      let visitorData: any = visitorRes?.data;
      if (visitorData && typeof visitorData === "object") {
        if (Array.isArray(visitorData.data)) visitorData = visitorData.data;
        else if (Array.isArray(visitorData.$values))
          visitorData = visitorData.$values;
        else if (Array.isArray(visitorData.visitors))
          visitorData = visitorData.visitors;
      }
      const normalizedVisitors = (
        Array.isArray(visitorData) ? visitorData : []
      ).map((v: any) => ({
        visitor_Id:
          v.visitor_Id ??
          v.Visitor_Id ??
          v.VisitorEntry_visitorId ??
          v.visitorId ??
          v.VisitorId ??
          v.id ??
          v.Id ??
          0,
        visitor_Name:
          v.visitor_Name ??
          v.Visitor_Name ??
          v.visitorName ??
          v.name ??
          v.Name ??
          v.fullName ??
          (`${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || "Unknown"),
        visitor_Email: v.visitor_Email ?? v.email ?? v.Email ?? "",
        visitor_Mobile:
          v.visitor_Mobile ?? v.mobile ?? v.phone ?? v.Phone ?? "",
      }));
      setVisitors(normalizedVisitors);

      // --- Fetch visitor entries ---
      const entryRes = await endpoints.visitorEntry.getAll();
      let entryData: any = entryRes?.data;
      if (entryData && typeof entryData === "object") {
        if (Array.isArray(entryData.data)) entryData = entryData.data;
        else if (Array.isArray(entryData.$values))
          entryData = entryData.$values;
        else if (Array.isArray(entryData.visitorEntries))
          entryData = entryData.visitorEntries;
      }

      // robust normalization with many fallbacks for id fields
      const normalizedEntries = (Array.isArray(entryData) ? entryData : []).map(
        (it: any) => {
          // possible id field names (add more if your backend uses different names)
          const idCandidates = [
            it.visitorEntry_Id,
            it.VisitorEntry_Id,
            it.visitorEntryId,
            it.visitorentryId,
            it.visitorEntryid,
            it.id,
            it.Id,
            it.visitorEntryID,
            it.VisitorEntryId,
            it.VisitorEntryID,
          ];

          // find first non-null/undefined numeric-like id
          let resolvedId = 0;
          for (const c of idCandidates) {
            if (c !== undefined && c !== null && c !== "") {
              const n = Number(c);
              if (!isNaN(n) && n !== 0) {
                resolvedId = n;
                break;
              }
              // allow zero only as last resort
              if (!isNaN(n) && resolvedId === 0) resolvedId = n;
            }
          }

          const visitorIdCandidates = [
            it.visitorEntry_visitorId,
            it.VisitorEntry_visitorId,
            it.VisitorEntryVisitorId,
            it.visitorId,
            it.VisitorId,
            it.visitor_id,
            it.visitorid,
            it.visitorID,
          ];
          let resolvedVisitorId = 0;
          for (const c of visitorIdCandidates) {
            if (c !== undefined && c !== null && c !== "") {
              const n = Number(c);
              if (!isNaN(n)) {
                resolvedVisitorId = n;
                break;
              }
            }
          }

          const visitor = normalizedVisitors.find(
            (v: Visitor) => v.visitor_Id === resolvedVisitorId
          );
          const visitorName = visitor
            ? visitor.visitor_Name
            : it.visitorEntry_visitorName ??
              it.visitorName ??
              `Visitor ID: ${resolvedVisitorId}`;

          return {
            // ensure numeric id
            visitorEntry_Id: resolvedId,
            visitorEntry_visitorId: resolvedVisitorId,
            visitorEntry_Gatepass:
              it.visitorEntry_Gatepass ??
              it.VisitorEntry_Gatepass ??
              it.gatepass ??
              it.Gatepass ??
              "",
            visitorEntry_Vehicletype:
              it.visitorEntry_Vehicletype ??
              it.VisitorEntry_Vehicletype ??
              it.vehicletype ??
              it.VehicleType ??
              "",
            visitorEntry_Vehicleno:
              it.visitorEntry_Vehicleno ??
              it.VisitorEntry_Vehicleno ??
              it.vehicleno ??
              it.VehicleNo ??
              "",
            visitorEntry_Date:
              it.visitorEntry_Date ??
              it.VisitorEntry_Date ??
              it.date ??
              it.Date ??
              "",
            visitorEntry_Intime:
              it.visitorEntry_Intime ??
              it.VisitorEntry_Intime ??
              it.intime ??
              it.Intime ??
              "",
            visitorEntry_Outtime:
              it.visitorEntry_Outtime ??
              it.VisitorEntry_Outtime ??
              it.outtime ??
              it.Outtime ??
              "",
            visitorEntry_Userid:
              it.visitorEntry_Userid ??
              it.VisitorEntry_Userid ??
              it.userid ??
              it.Userid ??
              0,
            visitorEntry_isCanteen:
              it.visitorEntry_isCanteen ??
              it.visitorEntry_IsCanteen ??
              it.isCanteen ??
              it.IsCanteen ??
              false,
            visitorEntry_isStay:
              it.visitorEntry_isStay ??
              it.visitorEntry_IsStay ??
              it.isStay ??
              it.IsStay ??
              false,
            visitorEntry_isApproval:
              // keep legacy/combined flag when present
              it.visitorEntry_isApproval ??
              it.isApproval ??
              it.IsApproval ??
              false,
            // explicit admin/user approval flags (new fields)
            visitorEntry_adminApproval:
              it.visitorEntryAdmin_isApproval ??
              it.visitorEntry_Admin_isApproval ??
              it.visitorEntryAdminIsApproval ??
              it.visitorEntry_AdminIsApproval ??
              it.visitorEntry_isApproval ??
              false,
            visitorEntry_userApproval:
              it.visitorEntryuser_isApproval ??
              it.visitorEntry_User_isApproval ??
              it.visitorEntryUserIsApproval ??
              false,
            visitorEntry_visitorName: visitorName,
            // include raw object for debugging if needed
            __raw: it,
          } as VisitorEntry;
        }
      );

      // debug log: check resolved ids
      console.log("Raw entries from API:", entryData);
      console.log("Normalized entries (with resolved ids):", normalizedEntries);

      // sort newest first by id (higher id first)
      normalizedEntries.sort(
        (a, b) => (b.visitorEntry_Id || 0) - (a.visitorEntry_Id || 0)
      );

      setEntries(normalizedEntries);
    } catch (err: any) {
      console.error("fetchData error:", err);
      setError("Failed to fetch data");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // handleEdit uses resolved id
  const handleEdit = (entry: VisitorEntry) => {
    console.log("handleEdit entry clicked:", entry);
    setFormData({
      visitorEntry_visitorId: Number(entry.visitorEntry_visitorId ?? 0),
      visitorEntry_Gatepass: entry.visitorEntry_Gatepass ?? "",
      visitorEntry_Vehicletype: entry.visitorEntry_Vehicletype ?? "",
      visitorEntry_Vehicleno: entry.visitorEntry_Vehicleno ?? "",
      visitorEntry_Date: entry.visitorEntry_Date ?? "",
      visitorEntry_Intime: entry.visitorEntry_Intime ?? "",
      visitorEntry_Outtime: entry.visitorEntry_Outtime ?? "",
      visitorEntry_Userid: Number(entry.visitorEntry_Userid ?? 0),
      visitorEntry_isCanteen: !!entry.visitorEntry_isCanteen,
      visitorEntry_isStay: !!entry.visitorEntry_isStay,
      visitorEntry_isApproval: !!entry.visitorEntry_isApproval,
      visitorEntry_adminApproval: !!entry.visitorEntry_adminApproval,
      visitorEntry_userApproval: !!entry.visitorEntry_userApproval,
      visitorEntry_visitorName: entry.visitorEntry_visitorName ?? "",
    });
    // set editingId from resolved field
    setEditingId(Number(entry.visitorEntry_Id ?? entry.id ?? entry.Id ?? 0));
    setShowForm(true);
    setError("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const name = target.name;
    if (target.type === "checkbox") {
      setFormData((s: any) => ({
        ...s,
        [name]: (target as HTMLInputElement).checked,
      }));
      return;
    }
    if (target.type === "number") {
      const val = target.value === "" ? "" : Number(target.value);
      setFormData((s: any) => ({ ...s, [name]: val }));
      return;
    }
    setFormData((s: any) => ({ ...s, [name]: target.value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError("");

      if (editingId === null) {
        setError("No entry selected for update.");
        setLoading(false);
        return;
      }

      const payload: any = {
        visitorEntry_Id: Number(editingId),
        visitorEntry_visitorId: Number(formData.visitorEntry_visitorId ?? 0),
        visitorEntry_Gatepass: String(
          formData.visitorEntry_Gatepass ?? ""
        ).trim(),
        visitorEntry_Vehicletype: String(
          formData.visitorEntry_Vehicletype ?? ""
        ).trim(),
        visitorEntry_Vehicleno: String(
          formData.visitorEntry_Vehicleno ?? ""
        ).trim(),
        visitorEntry_Date: formData.visitorEntry_Date ?? "",
        visitorEntry_Intime:
          (formData.visitorEntry_Intime &&
            String(formData.visitorEntry_Intime).trim()) ||
          null,
        visitorEntry_Outtime: formData.visitorEntry_Outtime?.trim() || null,
        visitorEntry_Userid: Number(formData.visitorEntry_Userid ?? 0),
        visitorEntry_isCanteen: !!formData.visitorEntry_isCanteen,
        visitorEntry_isStay: !!formData.visitorEntry_isStay,
        // include both admin and user approval flags per new API
        visitorEntry_isApproval: !!formData.visitorEntry_isApproval,
        visitorEntryAdmin_isApproval: !!formData.visitorEntry_adminApproval,
        visitorEntryuser_isApproval: !!formData.visitorEntry_userApproval,
      };

      console.log("Submitting update. id:", editingId, "payload:", payload);

      // send PUT with id in route and body
      await endpoints.visitorEntry.update(editingId, payload);

      alert("Visitor entry updated successfully!");
      resetForm();
      await fetchData();
    } catch (err: any) {
      console.error("handleSubmit error:", err);
      const backendMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save visitor entry";
      setError(String(backendMsg));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      visitorEntry_visitorId: 0,
      visitorEntry_visitorName: "",
      visitorEntry_Gatepass: "",
      visitorEntry_Vehicletype: "",
      visitorEntry_Vehicleno: "",
      visitorEntry_Date: "",
      visitorEntry_Intime: "",
      visitorEntry_Outtime: "",
      visitorEntry_Userid: 0,
      visitorEntry_isCanteen: false,
      visitorEntry_isStay: false,
      visitorEntry_isApproval: false,
    });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  // derived lists
  // Helper: classify entries. Use Intime only; if absent, treat as current.
  const getEntryTimeMs = (e: VisitorEntry) => {
    const ts = e.visitorEntry_Intime || "";
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  // Format a datetime string (ISO or other parseable) for display; returns
  // empty string for falsy values and falls back to the raw input when parsing fails.
  const formatDateTime = (ts?: string | null) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return String(ts);
      // Use locale string for readable display; adjust options if you need a specific format
      return d.toLocaleString();
    } catch {
      return String(ts);
    }
  };

  const nowMs = Date.now();
  const historyEntries = entries.filter((e) => {
    const t = getEntryTimeMs(e);
    return t !== null && t < nowMs;
  });
  const currentEntries = entries.filter((e) => {
    const t = getEntryTimeMs(e);
    return t === null || t >= nowMs;
  });

  // Use currentEntries for the first table instead of all filtered
  const currentFiltered = currentEntries.filter((e) =>
    (
      (e.visitorEntry_Gatepass ?? "") +
      " " +
      (e.visitorEntry_Vehicleno ?? "") +
      " " +
      (e.visitorEntry_visitorName ?? "")
    )
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
  const currentTotalPages = Math.max(
    1,
    Math.ceil(currentFiltered.length / entriesPerPage)
  );
  const currentStartIndex = (currentPage - 1) * entriesPerPage;
  const currentDisplayed = currentFiltered.slice(
    currentStartIndex,
    currentStartIndex + entriesPerPage
  );

  // Clamp current pagination when list size changes
  React.useEffect(() => {
    if (currentPage > currentTotalPages) {
      setCurrentPage(currentTotalPages);
    }
    if (currentPage < 1 && currentTotalPages >= 1) {
      setCurrentPage(1);
    }
  }, [currentTotalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  // History table filtering/pagination
  const historyFiltered = historyEntries.filter((e) =>
    (
      (e.visitorEntry_Gatepass ?? "") +
      " " +
      (e.visitorEntry_Vehicleno ?? "") +
      " " +
      (e.visitorEntry_visitorName ?? "")
    )
      .toLowerCase()
      .includes(historySearchTerm.toLowerCase())
  );
  const historyTotalPages = Math.max(
    1,
    Math.ceil(historyFiltered.length / historyEntriesPerPage)
  );
  const historyStartIndex = (historyCurrentPage - 1) * historyEntriesPerPage;
  const historyDisplayed = historyFiltered.slice(
    historyStartIndex,
    historyStartIndex + historyEntriesPerPage
  );

  // Clamp history pagination when list size changes
  React.useEffect(() => {
    if (historyCurrentPage > historyTotalPages) {
      setHistoryCurrentPage(historyTotalPages);
    }
    if (historyCurrentPage < 1 && historyTotalPages >= 1) {
      setHistoryCurrentPage(1);
    }
  }, [historyTotalPages]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <form className="modal-form" onSubmit={(e) => handleSubmit(e)}>
              <div className="form-group">
                <label>Visitor Name</label>
                <input
                  name="visitorEntry_visitorName"
                  value={formData.visitorEntry_visitorName}
                  className="role-input"
                  disabled
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                />
              </div>
              <div className="form-group">
                <label>Visitor ID</label>
                <input
                  name="visitorEntry_visitorId"
                  type="number"
                  value={formData.visitorEntry_visitorId}
                  onChange={handleInputChange}
                  className="role-input"
                  required
                  disabled
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
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
                  <option value="Two Wheeler">Two Wheeler</option>
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
                <label>Out Time</label>
                <input
                  name="visitorEntry_Outtime"
                  type="datetime-local"
                  value={formData.visitorEntry_Outtime}
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
                    checked={!!formData.visitorEntry_isCanteen}
                    onChange={handleInputChange}
                  />{" "}
                  <span>Canteen Access</span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    name="visitorEntry_isApproval"
                    type="checkbox"
                    checked={!!formData.visitorEntry_isApproval}
                    onChange={handleInputChange}
                  />{" "}
                  <span>Approved</span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    name="visitorEntry_isStay"
                    type="checkbox"
                    checked={!!formData.visitorEntry_isStay}
                    onChange={handleInputChange}
                  />{" "}
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
        {/* Current entries controls */}
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
              placeholder="Search by name, gatepass or vehicle..."
            />
          </div>
        </div>

        <div className="role-table-wrapper">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : currentFiltered.length === 0 ? (
            <div className="empty-state">
              {searchTerm
                ? "No current entries found"
                : "No current visitor entries"}
            </div>
          ) : (
            <>
              <table className="role-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Gatepass</th>
                    <th>Visitor Name</th>
                    <th>Vehicle Type</th>
                    <th>Vehicle No</th>
                    <th>Date</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Admin Approved</th>
                    <th>User Approved</th>
                    <th>Canteen</th>
                    <th>Stay</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDisplayed.map((entry, idx) => (
                    <tr
                      key={
                        entry.visitorEntry_Id
                          ? `cur-${entry.visitorEntry_Id}`
                          : `cur-${entry.visitorEntry_Gatepass || "gp"}-${
                              currentStartIndex + idx
                            }`
                      }
                    >
                      <td>{currentStartIndex + idx + 1}</td>
                      <td>{entry.visitorEntry_Gatepass}</td>
                      <td>
                        <strong>{entry.visitorEntry_visitorName}</strong>
                      </td>
                      <td>{entry.visitorEntry_Vehicletype}</td>
                      <td>{entry.visitorEntry_Vehicleno}</td>
                      <td>{formatDateTime(entry.visitorEntry_Date)}</td>
                      <td>{formatDateTime(entry.visitorEntry_Intime)}</td>
                      <td>{formatDateTime(entry.visitorEntry_Outtime)}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            entry.visitorEntry_adminApproval
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {entry.visitorEntry_adminApproval ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            entry.visitorEntry_userApproval
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {entry.visitorEntry_userApproval ? "Yes" : "No"}
                        </span>
                      </td>
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

              {currentTotalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {currentTotalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(currentTotalPages, p + 1))
                    }
                    disabled={currentPage === currentTotalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* History section (read-only, no edit/update) */}
      <div className="role-table-section-full" style={{ marginTop: 24 }}>
        <div
          className="rolemaster-header"
          style={{ paddingLeft: 0, paddingRight: 0 }}
        >
          <h2 className="rolemaster-title">Visitor Entry Approval History</h2>
        </div>

        <div className="table-controls">
          <div className="show-entries">
            <span>Show</span>
            <select
              className="entries-select"
              value={historyEntriesPerPage}
              onChange={(e) => {
                setHistoryEntriesPerPage(Number(e.target.value));
                setHistoryCurrentPage(1);
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
              value={historySearchTerm}
              onChange={(e) => {
                setHistorySearchTerm(e.target.value);
                setHistoryCurrentPage(1);
              }}
              placeholder="Search history by name, gatepass or vehicle..."
            />
          </div>
        </div>

        <div className="role-table-wrapper">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : historyFiltered.length === 0 ? (
            <div className="empty-state">
              {historySearchTerm
                ? "No history entries found"
                : "No visitor entry history"}
            </div>
          ) : (
            <>
              <table className="role-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Gatepass</th>
                    <th>Visitor Name</th>
                    <th>Vehicle Type</th>
                    <th>Vehicle No</th>
                    <th>Date</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Admin Approved</th>
                    <th>User Approved</th>
                    <th>Canteen</th>
                    <th>Stay</th>
                    {/* No Action column */}
                  </tr>
                </thead>
                <tbody>
                  {historyDisplayed.map((entry, idx) => (
                    <tr
                      key={
                        entry.visitorEntry_Id
                          ? `hist-${entry.visitorEntry_Id}`
                          : `hist-${entry.visitorEntry_Gatepass || "gp"}-${
                              historyStartIndex + idx
                            }`
                      }
                    >
                      <td>{historyStartIndex + idx + 1}</td>
                      <td>{entry.visitorEntry_Gatepass}</td>
                      <td>
                        <strong>{entry.visitorEntry_visitorName}</strong>
                      </td>
                      <td>{entry.visitorEntry_Vehicletype}</td>
                      <td>{entry.visitorEntry_Vehicleno}</td>
                      <td>{formatDateTime(entry.visitorEntry_Date)}</td>
                      <td>{formatDateTime(entry.visitorEntry_Intime)}</td>
                      <td>{formatDateTime(entry.visitorEntry_Outtime)}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            entry.visitorEntry_adminApproval
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {entry.visitorEntry_adminApproval ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            entry.visitorEntry_userApproval
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {entry.visitorEntry_userApproval ? "Yes" : "No"}
                        </span>
                      </td>
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
                    </tr>
                  ))}
                </tbody>
              </table>

              {historyTotalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() =>
                      setHistoryCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={historyCurrentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {historyCurrentPage} of {historyTotalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() =>
                      setHistoryCurrentPage((p) =>
                        Math.min(historyTotalPages, p + 1)
                      )
                    }
                    disabled={historyCurrentPage === historyTotalPages}
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
