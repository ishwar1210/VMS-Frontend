import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import endpoints from "../api/endpoint";

function Barcodescanner() {
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  // Auto-focus on input when component mounts
  useEffect(() => {
    const inputElement = document.getElementById("barcode-input");
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  // Global buffered listener for barcode scanners (fast input + Enter)
  useEffect(() => {
    const buf = { chars: "", lastTime: 0 } as {
      chars: string;
      lastTime: number;
    };
    const THRESHOLD_MS = 100; // reset buffer if gap > 100ms

    const onKeyDown = (e: KeyboardEvent) => {
      // Only capture when BarcodeScanner component is active (this component is mounted)
      // Ignore if user is typing into an input/textarea/contenteditable
      const active = document.activeElement as HTMLElement | null;
      const isTextField =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable);
      if (isTextField) return; // let normal input handle it

      const now = Date.now();
      if (now - buf.lastTime > THRESHOLD_MS) buf.chars = "";

      if (e.key === "Enter") {
        if (buf.chars.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const code = buf.chars;
          buf.chars = "";
          buf.lastTime = 0;
          console.log("[Barcode Scanner - global] Detected barcode:", code);
          // call the same handler used by the form
          void handleScan(code);
        }
        return;
      }

      if (e.key.length === 1) {
        buf.chars += e.key;
        buf.lastTime = now;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleScan = async (gatepassNo: string) => {
    if (!gatepassNo || gatepassNo.trim() === "") {
      toast.error("Invalid barcode");
      return;
    }

    console.log("[Barcode Scan] Starting scan for gatepass:", gatepassNo);

    try {
      setLoading(true);

      // Fetch all visitor entries
      const entryRes = await endpoints.visitorEntry.getAll();
      let entryData: any = entryRes?.data;

      if (entryData && typeof entryData === "object") {
        if (Array.isArray(entryData.data)) entryData = entryData.data;
        else if (Array.isArray(entryData.$values))
          entryData = entryData.$values;
        else if (Array.isArray(entryData.visitorEntries))
          entryData = entryData.visitorEntries;
      }

      const entries = Array.isArray(entryData) ? entryData : [];

      // Find entry with matching gatepass number
      const entry = entries.find(
        (e: any) =>
          String(
            e.visitorEntry_Gatepass ||
              e.VisitorEntry_Gatepass ||
              e.gatepass ||
              ""
          )
            .trim()
            .toUpperCase() === gatepassNo.trim().toUpperCase()
      );

      if (!entry) {
        toast.error(`Gatepass ${gatepassNo} not found`);
        return;
      }

      // Resolve entry ID from multiple possible field names
      const idCandidates = [
        entry.visitorEntry_Id,
        entry.VisitorEntry_Id,
        entry.visitorEntryId,
        entry.visitorentryId,
        entry.visitorEntryid,
        entry.id,
        entry.Id,
        entry.visitorEntryID,
        entry.VisitorEntryId,
        entry.VisitorEntryID,
      ];
      let entryId = 0;
      for (const c of idCandidates) {
        if (c !== undefined && c !== null && c !== "") {
          const n = Number(c);
          if (!isNaN(n) && n !== 0) {
            entryId = n;
            break;
          }
          if (!isNaN(n) && entryId === 0) entryId = n;
        }
      }

      if (!entryId) {
        toast.error("Invalid entry ID");
        console.debug("Entry object missing numeric id:", entry);
        return;
      }

      console.log("[Barcode Scan] Resolved entry ID:", entryId);

      // Check if In Time / Out Time already set — consider multiple field names and empty strings
      const inTimeValue =
        entry.visitorEntry_Intime ||
        entry.VisitorEntry_Intime ||
        entry.intime ||
        entry.Intime ||
        null;
      const outTimeValue =
        entry.visitorEntry_Outtime ||
        entry.VisitorEntry_Outtime ||
        entry.outtime ||
        entry.Outtime ||
        null;

      const hasInTime = !!inTimeValue;
      const hasOutTime = !!outTimeValue;

      console.log(
        "[Barcode Scan] Has In Time:",
        hasInTime,
        "| In time value:",
        inTimeValue
      );
      console.log(
        "[Barcode Scan] Has Out Time:",
        hasOutTime,
        "| Out time value:",
        outTimeValue
      );

      // Generate local timestamp with timezone offset
      const toLocalIsoWithOffset = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        const seconds = pad(d.getSeconds());
        const offsetMin = -d.getTimezoneOffset();
        const sign = offsetMin >= 0 ? "+" : "-";
        const offH = pad(Math.floor(Math.abs(offsetMin) / 60));
        const offM = pad(Math.abs(offsetMin) % 60);
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offH}:${offM}`;
      };

      const now = new Date();
      const nowIso = toLocalIsoWithOffset(now);

      let payload: any;
      let actionType: string;

      if (!hasInTime) {
        // First scan - Set In Time
        payload = {
          visitorEntry_Id: entryId,
          visitorEntry_visitorId: Number(entry.visitorEntry_visitorId || 0),
          visitorEntry_Gatepass: String(
            entry.visitorEntry_Gatepass || ""
          ).trim(),
          visitorEntry_Vehicletype: String(
            entry.visitorEntry_Vehicletype || ""
          ).trim(),
          visitorEntry_Vehicleno: String(
            entry.visitorEntry_Vehicleno || ""
          ).trim(),
          visitorEntry_Date: entry.visitorEntry_Date || "",
          visitorEntry_Intime: nowIso,
          visitorEntry_Outtime: entry.visitorEntry_Outtime?.trim() || null,
          visitorEntry_Userid: Number(entry.visitorEntry_Userid || 0),
          visitorEntry_isCanteen: !!entry.visitorEntry_isCanteen,
          visitorEntry_isStay: !!entry.visitorEntry_isStay,
          visitorEntry_isApproval: !!entry.visitorEntry_isApproval,
          visitorEntryAdmin_isApproval: !!(
            entry.visitorEntryAdmin_isApproval ||
            entry.visitorEntry_adminApproval
          ),
          visitorEntryuser_isApproval: !!(
            entry.visitorEntryuser_isApproval || entry.visitorEntry_userApproval
          ),
        };
        actionType = "IN";
      } else if (!hasOutTime) {
        // Second scan - Set Out Time (only if Out not set)
        payload = {
          visitorEntry_Id: entryId,
          visitorEntry_visitorId: Number(entry.visitorEntry_visitorId || 0),
          visitorEntry_Gatepass: String(
            entry.visitorEntry_Gatepass || ""
          ).trim(),
          visitorEntry_Vehicletype: String(
            entry.visitorEntry_Vehicletype || ""
          ).trim(),
          visitorEntry_Vehicleno: String(
            entry.visitorEntry_Vehicleno || ""
          ).trim(),
          visitorEntry_Date: entry.visitorEntry_Date || "",
          visitorEntry_Intime:
            (entry.visitorEntry_Intime &&
              String(entry.visitorEntry_Intime).trim()) ||
            null,
          visitorEntry_Outtime: nowIso,
          visitorEntry_Userid: Number(entry.visitorEntry_Userid || 0),
          visitorEntry_isCanteen: !!entry.visitorEntry_isCanteen,
          visitorEntry_isStay: !!entry.visitorEntry_isStay,
          visitorEntry_isApproval: !!entry.visitorEntry_isApproval,
          visitorEntryAdmin_isApproval: !!(
            entry.visitorEntryAdmin_isApproval ||
            entry.visitorEntry_adminApproval
          ),
          visitorEntryuser_isApproval: !!(
            entry.visitorEntryuser_isApproval || entry.visitorEntry_userApproval
          ),
        };
        actionType = "OUT";
      } else {
        // Both IN and OUT already present — do not overwrite OUT repeatedly
        toast.info(`Gatepass ${gatepassNo} already has IN and OUT set`);
        console.log(
          "[Barcode Scan] Skipping update — both times present for:",
          gatepassNo,
          entryId
        );
        return;
      }

      console.log(
        "[Barcode Scan] Updating entry with action:",
        actionType,
        "| Payload:",
        payload
      );
      await endpoints.visitorEntry.update(entryId, payload);

      console.log("[Barcode Scan] Update successful!");

      // Try to resolve visitor name from visitor API using visitor id from entry
      let visitorName = "";
      const visitorIdCandidates = [
        entry.visitorEntry_visitorId,
        entry.VisitorEntry_visitorId,
        entry.visitorId,
        entry.VisitorId,
        entry.visitor_id,
        entry.Visitor_id,
      ];
      let visitorId = 0;
      for (const v of visitorIdCandidates) {
        if (v !== undefined && v !== null && v !== "") {
          const n = Number(v);
          if (!isNaN(n) && n !== 0) {
            visitorId = n;
            break;
          }
          if (!isNaN(n) && visitorId === 0) visitorId = n;
        }
      }

      if (visitorId) {
        try {
          const visRes = await endpoints.visitor.getById(visitorId);
          let visData: any = visRes?.data;
          if (visData && typeof visData === "object") {
            if (Array.isArray(visData.data)) visData = visData.data;
            else if (Array.isArray(visData.$values)) visData = visData.$values;
            else if (visData.visitor) visData = visData.visitor;
          }

          if (visData) {
            visitorName =
              visData.visitor_Name ||
              visData.visitor_name ||
              visData.Visitor_Name ||
              visData.visitorName ||
              visData.name ||
              visData.fullName ||
              (visData.firstName &&
                visData.firstName +
                  (visData.lastName ? ` ${visData.lastName}` : "")) ||
              "";
          }
        } catch (err) {
          console.debug("[Barcode Scan] visitor.getById failed:", err);
        }
      }

      // Fallback to entry fields if visitor API did not return a name
      if (!visitorName) {
        visitorName =
          entry.visitorEntry_visitorName ||
          entry.VisitorEntry_visitorName ||
          entry.visitor_Name ||
          entry.visitor_name ||
          entry.Visitor_Name ||
          entry.visitorName ||
          entry.VisitorName ||
          entry.name ||
          entry.Name ||
          (entry.visitor &&
            (entry.visitor.name ||
              entry.visitor.fullName ||
              entry.visitor.visitorName ||
              entry.visitor.visitor_Name)) ||
          "";

        if (!visitorName) {
          const first =
            entry.visitorFirstName ||
            entry.visitorFirstname ||
            entry.firstName ||
            entry.first_name ||
            "";
          const last =
            entry.visitorLastName ||
            entry.visitorLastname ||
            entry.lastName ||
            entry.last_name ||
            "";
          visitorName = `${first} ${last}`.trim();
        }
      }

      if (!visitorName) visitorName = "Unknown Visitor";

      toast.success(
        `${actionType} Time set for ${visitorName} (${gatepassNo}) at ${new Date().toLocaleTimeString()}`
      );

      // Add to recent scans
      setRecentScans((prev) => [
        {
          gatepass: gatepassNo,
          visitor: visitorName,
          action: actionType,
          time: new Date().toLocaleString(),
        },
        ...prev.slice(0, 9), // Keep last 10 scans
      ]);
    } catch (err: any) {
      console.error("[Barcode Scan] Error:", err);
      console.error("[Barcode Scan] Error response:", err?.response);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to process scan";
      toast.error(errorMsg);
      console.error(
        "[Barcode Scan] Full error details:",
        JSON.stringify(err, null, 2)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      handleScan(scanInput.trim());
      setScanInput("");
    }
  };

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
          <h1 className="rolemaster-title">
            Barcode Scanner - Entry/Exit Management
          </h1>
        </div>

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{ marginTop: 0, marginBottom: "20px", color: "#374151" }}
            >
              Scan Gatepass Barcode
            </h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", gap: "12px" }}
            >
              <input
                id="barcode-input"
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan or enter Gate Pass Number..."
                className="role-input"
                style={{ flex: 1, fontSize: "16px", padding: "12px" }}
                autoFocus
                disabled={loading}
              />
              <button
                type="submit"
                className="btn-submit"
                disabled={loading || !scanInput.trim()}
                style={{ padding: "12px 24px", whiteSpace: "nowrap" }}
              >
                {loading ? "Processing..." : "Submit"}
              </button>
            </form>
            <div
              style={{ marginTop: "16px", fontSize: "14px", color: "#6b7280" }}
            >
              <p style={{ margin: "8px 0" }}>
                <strong>Instructions:</strong>
              </p>
              <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                <li>First scan sets IN Time</li>
                <li>Second scan sets OUT Time</li>
                <li>Ensure barcode scanner is in focus on the input field</li>
              </ul>
            </div>
          </div>

          {recentScans.length > 0 && (
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{ marginTop: 0, marginBottom: "16px", color: "#374151" }}
              >
                Recent Scans
              </h3>
              <table className="role-table">
                <thead>
                  <tr>
                    <th>Gate Pass</th>
                    <th>Visitor</th>
                    <th>Action</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan, idx) => (
                    <tr key={idx}>
                      <td>{scan.gatepass}</td>
                      <td>{scan.visitor}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "6px",
                            fontWeight: "600",
                            color: "white",
                            background:
                              scan.action === "IN" ? "#10b981" : "#ef4444",
                          }}
                        >
                          {scan.action}
                        </span>
                      </td>
                      <td>{scan.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Barcodescanner;
