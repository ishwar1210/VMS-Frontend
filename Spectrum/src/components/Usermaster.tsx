import React, { useState, useEffect, useRef } from "react";
import "./Usermaster.css";
import { endpoints } from "../api/endpoint";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import axiosInstance from "../api/axiosInstance";

interface User {
  userId: number;
  username: string;
  u_Name: string;
  u_Mobile: string;
  u_Email: string;
  u_Address: string;
  u_RoleId: number;
  u_DepartmentID: number;
  u_ReportingToId: number | null;
  roleName?: string;
  departmentName?: string;
}

interface Role {
  roleId: number;
  roleName: string;
}

interface Department {
  departmentId: number;
  departmentName: string;
}

function Usermaster() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    u_Name: "",
    u_Mobile: "",
    u_Email: "",
    u_Address: "",
    u_RoleId: "",
    u_DepartmentID: "",
    u_ReportingToId: "",
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchRoles();
      await fetchDepartments();
      await fetchUsers();
    };
    loadData();
  }, []);

  const fetchUsers = async (rolesList = roles, deptsList = departments) => {
    try {
      setLoading(true);
      setError("");
      const res = await endpoints.user.getAll();
      console.log("API Response (users):", res.data);

      let data = res.data;
      if (data && typeof data === "object") {
        if (Array.isArray(data.users)) {
          data = data.users;
        } else if (Array.isArray(data.data)) {
          data = data.data;
        } else if (Array.isArray(data.$values)) {
          data = data.$values;
        } else if (!Array.isArray(data)) {
          data = [];
        }
      }

      const normalized = (Array.isArray(data) ? data : []).map((item: any) => {
        const roleId = item.u_RoleId || item.roleId || item.RoleId || 0;
        const deptId =
          item.u_DepartmentID ||
          item.departmentId ||
          item.DepartmentId ||
          item.departmentID ||
          0;

        return {
          userId: item.userId || item.id || item.UserId || item.ID || 0,
          username: item.username || item.Username || item.userName || "",
          u_Name: item.u_Name || item.name || item.Name || item.fullName || "",
          u_Mobile:
            item.u_Mobile || item.mobile || item.Mobile || item.phone || "",
          u_Email: item.u_Email || item.email || item.Email || "",
          u_Address: item.u_Address || item.address || item.Address || "",
          u_RoleId: roleId,
          u_DepartmentID: deptId,
          u_ReportingToId:
            item.u_ReportingToId ||
            item.reportingToId ||
            item.ReportingToId ||
            null,
          roleName: item.roleName || item.RoleName || "",
          departmentName: item.departmentName || item.DepartmentName || "",
        };
      });

      console.log("Normalized users:", normalized);
      console.log("Available roles for mapping:", rolesList);
      console.log("Available departments for mapping:", deptsList);

      // Map role and department names from fetched data if not present in user object
      const enrichedUsers = normalized.map((user) => ({
        ...user,
        roleName:
          user.roleName ||
          rolesList.find((r) => r.roleId === user.u_RoleId)?.roleName ||
          "",
        departmentName:
          user.departmentName ||
          deptsList.find((d) => d.departmentId === user.u_DepartmentID)
            ?.departmentName ||
          "",
      }));

      console.log("Enriched users with role/dept names:", enrichedUsers);
      setUsers(enrichedUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err?.response?.data?.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await endpoints.role.getAll();
      console.log("API Response (roles):", res.data);

      let data = res.data;
      if (data && typeof data === "object") {
        if (Array.isArray(data.roles)) {
          data = data.roles;
        } else if (Array.isArray(data.data)) {
          data = data.data;
        } else if (Array.isArray(data.$values)) {
          data = data.$values;
        } else if (!Array.isArray(data)) {
          data = [];
        }
      }

      const normalized = (Array.isArray(data) ? data : []).map((item: any) => ({
        roleId: item.roleId || item.RoleId || item.id || item.ID || 0,
        roleName:
          item.roleName || item.RoleName || item.name || item.Name || "",
      }));

      console.log("Normalized roles:", normalized);
      setRoles(normalized);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRoles([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await endpoints.department.getAll();
      console.log("API Response (departments):", res.data);

      let data = res.data;
      if (data && typeof data === "object") {
        if (Array.isArray(data.departments)) {
          data = data.departments;
        } else if (Array.isArray(data.data)) {
          data = data.data;
        } else if (Array.isArray(data.$values)) {
          data = data.$values;
        } else if (!Array.isArray(data)) {
          data = [];
        }
      }

      const normalized = (Array.isArray(data) ? data : []).map((item: any) => ({
        departmentId:
          item.departmentId ||
          item.DepartmentId ||
          item.departmentID ||
          item.id ||
          item.ID ||
          0,
        departmentName:
          item.departmentName ||
          item.department ||
          item.name ||
          item.Name ||
          "",
      }));
      console.log("Normalized departments:", normalized);
      setDepartments(normalized);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setDepartments([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }

    if (!formData.u_Name.trim()) {
      setError("Full name is required");
      return;
    }

    if (!formData.u_RoleId) {
      setError("Please select a role");
      return;
    }

    if (!formData.u_DepartmentID) {
      setError("Please select a department");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Validate mobile if provided: must be exactly 10 digits
      if (formData.u_Mobile && !/^\d{10}$/.test(formData.u_Mobile)) {
        setError("Mobile number must be 10 digits");
        setMobileError("Mobile number must be 10 digits");
        setLoading(false);
        return;
      }

      const payload = {
        username: formData.username.trim(),
        password: formData.password.trim(),
        u_Name: formData.u_Name.trim(),
        u_Mobile: formData.u_Mobile.trim(),
        u_Email: formData.u_Email.trim(),
        u_Address: formData.u_Address.trim(),
        u_RoleId: parseInt(formData.u_RoleId) || 0,
        u_DepartmentID: parseInt(formData.u_DepartmentID) || 0,
        u_ReportingToId: formData.u_ReportingToId
          ? parseInt(formData.u_ReportingToId)
          : null,
      };

      if (editingId) {
        await endpoints.user.update(editingId, payload);
      } else {
        if (!payload.password) {
          setError("Password is required for new user");
          setLoading(false);
          return;
        }
        await endpoints.user.create(payload);
      }

      resetForm();
      await fetchUsers();
      toast.success(
        editingId ? "User updated successfully!" : "User created successfully!"
      );
    } catch (err: any) {
      console.error("Error saving user:", err);
      setError(err?.response?.data?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      username: user.username,
      password: "",
      u_Name: user.u_Name,
      u_Mobile: user.u_Mobile,
      u_Email: user.u_Email,
      u_Address: user.u_Address,
      u_RoleId: user.u_RoleId.toString(),
      u_DepartmentID: user.u_DepartmentID.toString(),
      u_ReportingToId: user.u_ReportingToId
        ? user.u_ReportingToId.toString()
        : "",
    });
    setEditingId(user.userId);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      setError("");
      setLoading(true);
      await endpoints.user.delete(userId);
      await fetchUsers();
      toast.success("User deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      u_Name: "",
      u_Mobile: "",
      u_Email: "",
      u_Address: "",
      u_RoleId: "",
      u_DepartmentID: "",
      u_ReportingToId: "",
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
    const { name, value } = e.target;
    if (name === "u_Mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, [name]: digits });
      if (digits.length === 10) setMobileError("");
      else if (digits.length === 0) setMobileError("");
      else setMobileError("Mobile number must be 10 digits");
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      toast.error("Please upload a valid .xlsx file");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      // Use native fetch so the browser sets the multipart boundary automatically
      const token = localStorage.getItem("token");
      const uploadUrl = `${
        (axiosInstance.defaults && axiosInstance.defaults.baseURL) || ""
      }/api/UserImport/upload`;

      const resp = await fetch(uploadUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Upload failed: ${resp.status} ${text}`);
      }

      toast.success("Users imported successfully!");
      await fetchUsers();
      resetForm();
    } catch (err: any) {
      console.error("Error uploading file:", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to upload file. Please check the format."
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.u_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.u_Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.u_Mobile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entriesPerPage]);

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
      <div className="usermaster-container">
        <div className="usermaster-header">
          <h1 className="usermaster-title">Users</h1>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="download-xlsx-btn"
              onClick={() => {
                try {
                  const wb = XLSX.utils.book_new();

                  const rows = users.map((u) => {
                    const role =
                      u.roleName ||
                      roles.find((r) => r.roleId === u.u_RoleId)?.roleName ||
                      "";
                    const dept =
                      u.departmentName ||
                      departments.find(
                        (d) => d.departmentId === u.u_DepartmentID
                      )?.departmentName ||
                      "";
                    const reportingTo =
                      users.find((x) => x.userId === u.u_ReportingToId)
                        ?.u_Name || "";

                    return {
                      "Full Name": u.u_Name || "",
                      Mobile: u.u_Mobile || "",
                      "Email Address": u.u_Email || "",
                      Role: role,
                      Department: dept,
                      "Reporting To": reportingTo,
                    };
                  });

                  const ws = XLSX.utils.json_to_sheet(rows, {
                    header: [
                      "Full Name",
                      "Mobile",
                      "Email Address",
                      "Role",
                      "Department",
                      "Reporting To",
                    ],
                  });
                  XLSX.utils.book_append_sheet(wb, ws, "Users");
                  const fileName = `Users_${new Date()
                    .toISOString()
                    .slice(0, 10)}.xlsx`;
                  XLSX.writeFile(wb, fileName);
                } catch (err) {
                  console.error("Export XLSX error:", err);
                  toast.error("Failed to generate XLSX file");
                }
              }}
            >
              Download XLSX
            </button>

            <button
              className="download-xlsx-template-btn"
              onClick={() => {
                try {
                  const wb = XLSX.utils.book_new();
                  const headers = [
                    "FullName",
                    "Mobile",
                    "Email",
                    "RoleName",
                    "DepartmentName",
                    "ReportingToName",
                    "Address",
                  ];
                  // create an empty sheet with only header row
                  const ws = XLSX.utils.aoa_to_sheet([headers]);
                  XLSX.utils.book_append_sheet(wb, ws, "Users_Template");
                  const fileName = `Users_Template_${new Date()
                    .toISOString()
                    .slice(0, 10)}.xlsx`;
                  XLSX.writeFile(wb, fileName);
                } catch (err) {
                  console.error("Export Template XLSX error:", err);
                  toast.error("Failed to generate XLSX template");
                }
              }}
            >
              Download Template
            </button>
            <button
              className="add-user-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "View All Users" : " Add Employee"}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingId ? "Edit Employee" : "Add New Employee"}
                </h2>
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  {!editingId && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx"
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        className="upload-excel-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                      >
                        📤 Upload Excel
                      </button>
                    </>
                  )}
                  <button className="modal-close" onClick={resetForm}>
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
              </div>
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="username">Username *</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      className="user-input"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      disabled={editingId !== null}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">
                      Password {!editingId && "*"}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="user-input"
                      placeholder={
                        editingId
                          ? "Leave blank to keep current"
                          : "Enter password"
                      }
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingId}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="u_Name">Full Name *</label>
                    <input
                      id="u_Name"
                      name="u_Name"
                      type="text"
                      className="user-input"
                      placeholder="Enter full name"
                      value={formData.u_Name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="u_Mobile">Mobile</label>
                    <input
                      id="u_Mobile"
                      name="u_Mobile"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      className="user-input"
                      placeholder="Enter mobile number"
                      value={formData.u_Mobile}
                      onChange={handleInputChange}
                      onBlur={() => {
                        if (
                          formData.u_Mobile &&
                          formData.u_Mobile.length !== 10
                        ) {
                          setMobileError("Mobile number must be 10 digits");
                        } else {
                          setMobileError("");
                        }
                      }}
                    />
                    {mobileError && (
                      <div
                        style={{ color: "#d32f2f", fontSize: 12, marginTop: 6 }}
                      >
                        {mobileError}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="u_Email">Email</label>
                  <input
                    id="u_Email"
                    name="u_Email"
                    type="email"
                    className="user-input"
                    placeholder="Enter email address"
                    value={formData.u_Email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="u_Address">Address</label>
                  <textarea
                    id="u_Address"
                    name="u_Address"
                    className="user-input"
                    placeholder="Enter address"
                    value={formData.u_Address}
                    onChange={handleInputChange}
                    rows={2}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="u_RoleId">Role *</label>
                    <select
                      id="u_RoleId"
                      name="u_RoleId"
                      className="user-input"
                      value={formData.u_RoleId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))}
                    </select>
                    {roles.length === 0 && (
                      <small style={{ color: "#666", fontSize: "12px" }}>
                        No roles available
                      </small>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="u_DepartmentID">Department *</label>
                    <select
                      id="u_DepartmentID"
                      name="u_DepartmentID"
                      className="user-input"
                      value={formData.u_DepartmentID}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option
                          key={dept.departmentId}
                          value={dept.departmentId}
                        >
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                    {departments.length === 0 && (
                      <small style={{ color: "#666", fontSize: "12px" }}>
                        No departments available
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="u_ReportingToId">Reporting To</label>
                  <select
                    id="u_ReportingToId"
                    name="u_ReportingToId"
                    className="user-input"
                    value={formData.u_ReportingToId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Reporting Manager</option>
                    {users
                      .filter((user) => user.userId !== editingId)
                      .map((user) => (
                        <option key={user.userId} value={user.userId}>
                          {user.u_Name}
                        </option>
                      ))}
                  </select>
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

        <div className="user-table-section-full">
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
                placeholder="Search users..."
              />
            </div>
          </div>

          <div className="user-table-wrapper">
            {loading && users.length === 0 ? (
              <div className="loading-state">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                {searchTerm
                  ? "No users found matching your search"
                  : "No users added yet. Click 'Add User' to get started."}
              </div>
            ) : (
              <>
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Sr.No.</th>
                      <th>Username</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUsers.map((user, index) => (
                      <tr key={user.userId}>
                        <td>{startIndex + index + 1}</td>
                        <td>{user.username}</td>
                        <td>{user.u_Name}</td>
                        <td>{user.u_Email || "-"}</td>
                        <td>{user.u_Mobile || "-"}</td>
                        <td>
                          {user.roleName ||
                            roles.find((r) => r.roleId === user.u_RoleId)
                              ?.roleName ||
                            `Role ID: ${user.u_RoleId}`}
                        </td>
                        <td>
                          {user.departmentName ||
                            departments.find(
                              (d) => d.departmentId === user.u_DepartmentID
                            )?.departmentName ||
                            `Dept ID: ${user.u_DepartmentID}`}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleEdit(user)}
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
                              onClick={() => handleDelete(user.userId)}
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {currentPage} of {totalPages} ({filteredUsers.length}{" "}
                      total entries)
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
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
    </>
  );
}

export default Usermaster;
