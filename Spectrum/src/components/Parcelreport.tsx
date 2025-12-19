import { useState, useEffect } from "react";
import { endpoints } from "../api/endpoint";
import "./Rolemaster.css";

interface Parcel {
  parcelId: number;
  parcelBarcode: string;
  parcelCompanyName: string;
  userId: number;
  isActive: boolean;
  createdAt: string;
  parcelHandover?: boolean | string | null;
  parcel_type?: string;
  userName?: string;
}

interface User {
  userId: number;
  userName: string;
  u_Name?: string;
}

function Parcelreport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedParcelType, setSelectedParcelType] = useState("");
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState<Parcel[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchParcels();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await endpoints.user.getAll();
      const data = res?.data || [];
      const list = data?.$values || data?.data || data;
      if (Array.isArray(list)) setUsers(list);
      else setUsers([]);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setUsers([]);
    }
  };

  const fetchParcels = async () => {
    try {
      setLoading(true);
      const res = await endpoints.parcel.getAll();
      const data = res?.data || [];
      const list = data?.$values || data?.data || data;

      setParcels(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch parcels", err);
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShow = () => {
    // Normalize parcels with user data
    const normalizedParcels = parcels.map((item: any) => {
      const userId = item.userId || item.UserId || item.user_Id || 0;
      const user = users.find((u) => u.userId === userId);

      return {
        parcelId: item.parcelId || item.ParcelId || item.id || 0,
        parcelBarcode:
          item.parcelBarcode || item.ParcelBarcode || item.barcode || "",
        parcelCompanyName:
          item.parcelCompanyName ||
          item.ParcelCompanyName ||
          item.companyName ||
          "",
        userId: userId,
        isActive:
          item.isActive !== undefined
            ? item.isActive
            : item.IsActive !== undefined
            ? item.IsActive
            : true,
        createdAt:
          item.createdDate ||
          item.CreatedDate ||
          item.createdAt ||
          item.CreatedAt ||
          new Date().toISOString(),
        parcelHandover:
          item.parcelHandover ||
          item.ParcelHandover ||
          item.parcelHandoverFlag ||
          null,
        parcel_type:
          item.parcel_type || item.Parcel_type || item.parcelType || "",
        userName:
          user?.u_Name || user?.userName || item.userName || item.u_Name || "-",
      };
    });

    let filtered = normalizedParcels;

    // Filter by date range
    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      fromDateObj.setHours(0, 0, 0, 0);

      filtered = filtered.filter((parcel) => {
        if (!parcel.createdAt) return false;
        const parcelDate = new Date(parcel.createdAt);
        parcelDate.setHours(0, 0, 0, 0);
        return parcelDate >= fromDateObj;
      });
    }

    if (toDate) {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999);

      filtered = filtered.filter((parcel) => {
        if (!parcel.createdAt) return false;
        const parcelDate = new Date(parcel.createdAt);
        return parcelDate <= toDateObj;
      });
    }

    // Filter by employee
    if (selectedEmployee) {
      filtered = filtered.filter(
        (parcel) => parcel.userId === Number(selectedEmployee)
      );
    }

    // Filter by parcel type
    if (selectedParcelType) {
      filtered = filtered.filter(
        (parcel) =>
          parcel.parcel_type?.toLowerCase() === selectedParcelType.toLowerCase()
      );
    }

    setFilteredData(filtered);
    setShowResults(true);
  };

  const downloadExcel = () => {
    const headers = [
      "SR.NO.",
      "BARCODE",
      "COMPANY NAME",
      "EMPLOYEE NAME",
      "PARCEL TYPE",
      "DATE",
      "HANDOVER",
    ];
    const rows = filteredData.map((parcel, idx) => [
      idx + 1,
      parcel.parcelBarcode || "-",
      parcel.parcelCompanyName || "-",
      parcel.userName || "-",
      parcel.parcel_type || "-",
      formatDateTime(parcel.createdAt),
      formatHandover(parcel.parcelHandover),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value =
              cell === null || cell === undefined ? "-" : String(cell);
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Parcel_Report_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    setShowDownloadMenu(false);
  };

  const downloadPDF = () => {
    const headers = [
      "SR.NO.",
      "BARCODE",
      "COMPANY",
      "EMPLOYEE",
      "TYPE",
      "DATE",
      "HANDOVER",
    ];
    const rows = filteredData.map((parcel, idx) => [
      idx + 1,
      parcel.parcelBarcode || "-",
      parcel.parcelCompanyName || "-",
      parcel.userName || "-",
      parcel.parcel_type || "-",
      formatDateTime(parcel.createdAt),
      formatHandover(parcel.parcelHandover),
    ]);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Parcel Report</title>
          <style>
            @media print {
              @page { margin: 1cm; }
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 20px;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
              font-size: 12px;
            }
            th { 
              background-color: #4CAF50; 
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <h1>Parcel Report</h1>
          <p style="text-align: center; color: #666;">Generated on: ${new Date().toLocaleDateString(
            "en-IN"
          )}</p>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, "_blank");

    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      };
    }

    setShowDownloadMenu(false);
  };

  const downloadWord = () => {
    const headers = [
      "SR.NO.",
      "BARCODE",
      "COMPANY NAME",
      "EMPLOYEE NAME",
      "PARCEL TYPE",
      "DATE",
      "HANDOVER",
    ];
    const rows = filteredData.map((parcel, idx) => [
      idx + 1,
      parcel.parcelBarcode || "-",
      parcel.parcelCompanyName || "-",
      parcel.userName || "-",
      parcel.parcel_type || "-",
      formatDateTime(parcel.createdAt),
      formatHandover(parcel.parcelHandover),
    ]);

    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Parcel Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
          </style>
        </head>
        <body>
          <h1>Parcel Report</h1>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], {
      type: "application/msword;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Parcel_Report_${
      new Date().toISOString().split("T")[0]
    }.doc`;
    link.click();
    setShowDownloadMenu(false);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr || dateStr === "-") return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatHandover = (value: any) => {
    if (value === null || value === undefined) return "No";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string") {
      const v = value.trim().toLowerCase();
      if (v === "true" || v === "yes") return "Yes";
      if (v === "false" || v === "no") return "No";
      return value;
    }
    return String(value);
  };

  return (
    <div className="rolemaster-container">
      <div className="rolemaster-header">
        <h1 className="rolemaster-title">Parcel Report</h1>
      </div>

      <div
        className="filter-section"
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <div className="form-group" style={{ flex: "1", minWidth: "200px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}
          >
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="form-input"
            style={{ width: "100%" }}
          />
        </div>

        <div className="form-group" style={{ flex: "1", minWidth: "200px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}
          >
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="form-input"
            style={{ width: "100%" }}
          />
        </div>

        <div className="form-group" style={{ flex: "1", minWidth: "200px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}
          >
            Select Employee
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="form-input"
            style={{ width: "100%" }}
          >
            <option key="employee-placeholder" value="">
              Select Employee
            </option>
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.u_Name || user.userName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: "1", minWidth: "200px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}
          >
            Parcel Type
          </label>
          <select
            value={selectedParcelType}
            onChange={(e) => setSelectedParcelType(e.target.value)}
            className="form-input"
            style={{ width: "100%" }}
          >
            <option key="parceltype-placeholder" value="">
              All Types
            </option>
            <option key="company" value="company">
              Company
            </option>
            <option key="personal" value="personal">
              Personal
            </option>
          </select>
        </div>

        <div
          className="form-group"
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "flex-end",
            minWidth: "120px",
          }}
        >
          <button
            onClick={handleShow}
            className="btn-submit"
            style={{
              width: "100%",
              padding: "10px 24px",
              fontSize: "16px",
            }}
          >
            Show
          </button>
        </div>
      </div>

      {showResults && (
        <div className="role-table-wrapper">
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">No records found</div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "16px",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="btn-submit"
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download
                </button>
                {showDownloadMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "4px",
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      zIndex: 1000,
                      minWidth: "150px",
                    }}
                  >
                    <div
                      onClick={downloadExcel}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "white")
                      }
                    >
                      📊 Excel
                    </div>
                    <div
                      onClick={downloadPDF}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "white")
                      }
                    >
                      📄 PDF
                    </div>
                    <div
                      onClick={downloadWord}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "white")
                      }
                    >
                      📝 Word
                    </div>
                  </div>
                )}
              </div>
              <table className="role-table">
                <thead>
                  <tr>
                    <th>SR.NO.</th>
                    <th>BARCODE</th>
                    <th>COMPANY NAME</th>
                    <th>EMPLOYEE NAME</th>
                    <th>PARCEL TYPE</th>
                    <th>DATE</th>
                    <th>HANDOVER</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((parcel, idx) => (
                    <tr key={parcel.parcelId || idx}>
                      <td>{idx + 1}</td>
                      <td>{parcel.parcelBarcode}</td>
                      <td>{parcel.parcelCompanyName}</td>
                      <td>{parcel.userName}</td>
                      <td style={{ textTransform: "capitalize" }}>
                        {parcel.parcel_type || "-"}
                      </td>
                      <td>{formatDateTime(parcel.createdAt)}</td>
                      <td>{formatHandover(parcel.parcelHandover)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>{" "}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Parcelreport;
