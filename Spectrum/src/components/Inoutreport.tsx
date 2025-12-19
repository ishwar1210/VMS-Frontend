import { useState, useEffect } from "react";
import { endpoints } from "../api/endpoint";
import "./Rolemaster.css";

interface VisitorEntry {
  visitorEntry_Id: number;
  visitorEntry_visitorId: number;
  visitorEntry_Gatepass: string;
  visitorEntry_Date: string;
  visitorEntry_Intime: string;
  visitorEntry_Outtime: string;
  visitorEntry_Userid: number;
  visitorEntry_visitorName?: string;
  visitorEntry_companyName?: string;
  visitorEntry_userName?: string;
  visitorEntry_MeetingDate?: string;
}

interface Visitor {
  visitor_Id: number;
  visitor_Name: string;
  visitor_CompanyName?: string;
}

interface User {
  userId: number;
  userName: string;
  u_Name?: string;
}

function Inoutreport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState<VisitorEntry[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    fetchVisitors();
    fetchUsers();
    fetchEntries();
  }, []);

  const fetchVisitors = async () => {
    try {
      const res = await endpoints.visitor.getAll();
      const data = res?.data || [];
      const list = data?.$values || data?.data || data;

      const normalizedVisitors = (Array.isArray(list) ? list : []).map(
        (item: any) => ({
          visitor_Id:
            item.visitor_Id || item.visitorId || item.VisitorId || item.id || 0,
          visitor_Name:
            item.visitor_Name ||
            item.visitorName ||
            item.VisitorName ||
            item.name ||
            "",
          visitor_CompanyName:
            item.visitor_CompanyName ||
            item.visitorCompanyName ||
            item.VisitorCompanyName ||
            item.companyName ||
            "",
        })
      );

      console.log("🔍 Normalized visitors:", normalizedVisitors);
      setVisitors(normalizedVisitors);
    } catch (err) {
      console.error("Failed to fetch visitors", err);
      setVisitors([]);
    }
  };

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

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await endpoints.visitorEntry.getAll();
      const data = res?.data || [];
      const list = data?.$values || data?.data || data;

      // Normalize entries and enrich with visitor data
      const normalizedEntries = await Promise.all(
        (Array.isArray(list) ? list : []).map(async (item: any) => {
          const visitorId = item.visitorEntry_visitorId || item.visitorId || 0;
          const userId = item.visitorEntry_Userid || item.userId || 0;

          // Fetch visitor details by visitorId
          let visitorName = "-";
          let companyName = "-";

          if (visitorId) {
            try {
              const visitorRes = await endpoints.visitor.getById(
                Number(visitorId)
              );
              const visitorData = visitorRes?.data || {};
              const visitor = visitorData?.data || visitorData || {};

              visitorName =
                visitor.visitor_Name ||
                visitor.visitorName ||
                visitor.name ||
                "-";
              companyName =
                visitor.visitor_CompanyName ||
                visitor.visitorCompanyName ||
                visitor.companyName ||
                "-";
            } catch (err) {
              console.error(
                "Failed to fetch visitor details for ID:",
                visitorId,
                err
              );
            }
          }

          return {
            visitorEntry_Id:
              item.visitorEntry_Id || item.visitorEntryId || item.id || 0,
            visitorEntry_visitorId: visitorId,
            visitorEntry_Gatepass:
              item.visitorEntry_Gatepass || item.gatepass || "",
            visitorEntry_Date: item.visitorEntry_Date || item.date || "",
            visitorEntry_Intime: item.visitorEntry_Intime || item.intime || "",
            visitorEntry_Outtime:
              item.visitorEntry_Outtime || item.outtime || "",
            visitorEntry_Userid: userId,
            visitorEntry_visitorName: visitorName,
            visitorEntry_companyName: companyName,
            visitorEntry_userName: "-", // Will be populated in handleShow
            visitorEntry_MeetingDate:
              item.visitorEntry_MeetingDate || item.meetingDate || "-",
          };
        })
      );

      setEntries(normalizedEntries);
    } catch (err) {
      console.error("Failed to fetch entries", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShow = () => {
    console.log(
      "🔍 Debug - selectedVisitor:",
      selectedVisitor,
      typeof selectedVisitor
    );
    console.log(
      "🔍 Debug - Available visitors:",
      visitors.map((v) => ({ id: v.visitor_Id, name: v.visitor_Name }))
    );
    console.log(
      "🔍 Debug - Sample entries:",
      entries.slice(0, 3).map((e) => ({
        id: e.visitorEntry_Id,
        visitorId: e.visitorEntry_visitorId,
        visitorName: e.visitorEntry_visitorName,
      }))
    );

    // Normalize entries with user data at filter time
    const normalizedEntries = entries.map((item: any) => {
      const userId = item.visitorEntry_Userid;
      const user = users.find((u) => u.userId === userId);

      return {
        ...item,
        visitorEntry_userName: user?.u_Name || user?.userName || "-",
      };
    });

    let filtered = normalizedEntries;

    // Filter by date range
    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      fromDateObj.setHours(0, 0, 0, 0);

      filtered = filtered.filter((entry) => {
        const entryDateStr =
          entry.visitorEntry_Date || entry.visitorEntry_Intime;
        if (!entryDateStr || entryDateStr === "-") return false;
        const entryDate = new Date(entryDateStr);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate >= fromDateObj;
      });
    }

    if (toDate) {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999);

      filtered = filtered.filter((entry) => {
        const entryDateStr =
          entry.visitorEntry_Date || entry.visitorEntry_Intime;
        if (!entryDateStr || entryDateStr === "-") return false;
        const entryDate = new Date(entryDateStr);
        return entryDate <= toDateObj;
      });
    }

    // Filter by visitor
    if (selectedVisitor) {
      const visitorId = Number(selectedVisitor);
      console.log(
        `🔍 Parsed visitor ID: ${visitorId} (type: ${typeof visitorId})`
      );
      filtered = filtered.filter((entry) => {
        const match = entry.visitorEntry_visitorId === visitorId;
        if (match) {
          console.log(`✅ Match found:`, entry);
        }
        return match;
      });
      console.log(
        `Filtering by visitor ID: ${visitorId}, Found: ${filtered.length} records`
      );
    }

    // Filter by employee
    if (selectedEmployee) {
      filtered = filtered.filter(
        (entry) => entry.visitorEntry_Userid === Number(selectedEmployee)
      );
    }

    setFilteredData(filtered);
    setShowResults(true);
  };

  const downloadExcel = () => {
    const headers = [
      "SR.NO.",
      "VISITOR NAME",
      "COMPANY NAME",
      "EMPLOYEE NAME",
      "DATE",
      "IN TIME",
      "OUT TIME",
    ];
    const rows = filteredData.map((entry, idx) => [
      idx + 1,
      entry.visitorEntry_visitorName || "-",
      entry.visitorEntry_companyName || "-",
      entry.visitorEntry_userName || "-",
      formatDate(entry.visitorEntry_Date),
      formatDateTime(entry.visitorEntry_Intime),
      formatDateTime(entry.visitorEntry_Outtime),
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
    link.download = `InOut_Report_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    setShowDownloadMenu(false);
  };

  const downloadPDF = () => {
    const headers = [
      "SR.NO.",
      "VISITOR NAME",
      "COMPANY",
      "EMPLOYEE",
      "DATE",
      "IN TIME",
      "OUT TIME",
    ];
    const rows = filteredData.map((entry, idx) => [
      idx + 1,
      entry.visitorEntry_visitorName,
      entry.visitorEntry_companyName,
      entry.visitorEntry_userName,
      formatDate(entry.visitorEntry_Date),
      formatDateTime(entry.visitorEntry_Intime),
      formatDateTime(entry.visitorEntry_Outtime),
    ]);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>In/Out Report</title>
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
          <h1>In/Out Report</h1>
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
      "VISITOR NAME",
      "COMPANY NAME",
      "EMPLOYEE NAME",
      "DATE",
      "IN TIME",
      "OUT TIME",
    ];
    const rows = filteredData.map((entry, idx) => [
      idx + 1,
      entry.visitorEntry_visitorName,
      entry.visitorEntry_companyName,
      entry.visitorEntry_userName,
      formatDate(entry.visitorEntry_Date),
      formatDateTime(entry.visitorEntry_Intime),
      formatDateTime(entry.visitorEntry_Outtime),
    ]);

    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>In/Out Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
          </style>
        </head>
        <body>
          <h1>In/Out Report</h1>
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
    link.download = `InOut_Report_${
      new Date().toISOString().split("T")[0]
    }.doc`;
    link.click();
    setShowDownloadMenu(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "-") return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
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

  return (
    <div className="rolemaster-container">
      <div className="rolemaster-header">
        <h1 className="rolemaster-title">In/Out Report</h1>
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
            Select Visitor
          </label>
          <select
            value={selectedVisitor}
            onChange={(e) => setSelectedVisitor(e.target.value)}
            className="form-input"
            style={{ width: "100%" }}
          >
            <option key="visitor-placeholder" value="">
              Select Visitor
            </option>
            {visitors.map((visitor) => (
              <option key={visitor.visitor_Id} value={visitor.visitor_Id}>
                {visitor.visitor_Name}
              </option>
            ))}
          </select>
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
                    <th>VISITOR NAME</th>
                    <th>COMPANY NAME</th>
                    <th>EMPLOYEE NAME</th>
                    <th>DATE</th>
                    <th>IN TIME</th>
                    <th>OUT TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((entry, idx) => (
                    <tr key={entry.visitorEntry_Id || idx}>
                      <td>{idx + 1}</td>
                      <td>{entry.visitorEntry_visitorName}</td>
                      <td>{entry.visitorEntry_companyName}</td>
                      <td>{entry.visitorEntry_userName}</td>
                      <td>{formatDate(entry.visitorEntry_Date)}</td>
                      <td>{formatDateTime(entry.visitorEntry_Intime)}</td>
                      <td>{formatDateTime(entry.visitorEntry_Outtime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Inoutreport;
