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
      if (Array.isArray(list)) setVisitors(list);
      else setVisitors([]);
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
      filtered = filtered.filter(
        (entry) => entry.visitorEntry_visitorId === Number(selectedVisitor)
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
          )}
        </div>
      )}
    </div>
  );
}

export default Inoutreport;
