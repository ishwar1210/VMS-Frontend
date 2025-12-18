import React, { useEffect, useState } from "react";
import "./Rolemaster.css";
import "./Securityapprovalview.css";
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
  visitorEntry_userReject?: boolean;
  visitorEntry_visitorName?: string;
  [key: string]: any;
}

interface Visitor {
  visitor_Id: number;
  visitor_Name: string;
  visitor_Email?: string;
  visitor_Mobile?: string;
}

function Securityapprovalview() {
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<VisitorEntry | null>(null);
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
    visitorEntry_userReject: false,
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

      const entryRes = await endpoints.visitorEntry.getAll();
      let entryData: any = entryRes?.data;
      if (entryData && typeof entryData === "object") {
        if (Array.isArray(entryData.data)) entryData = entryData.data;
        else if (Array.isArray(entryData.$values))
          entryData = entryData.$values;
        else if (Array.isArray(entryData.visitorEntries))
          entryData = entryData.visitorEntries;
      }

      const normalizedEntries = (Array.isArray(entryData) ? entryData : []).map(
        (it: any) => {
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

          let resolvedId = 0;
          for (const c of idCandidates) {
            if (c !== undefined && c !== null && c !== "") {
              const n = Number(c);
              if (!isNaN(n) && n !== 0) {
                resolvedId = n;
                break;
              }
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
              it.visitorEntry_isApproval ??
              it.isApproval ??
              it.IsApproval ??
              false,
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
            visitorEntry_userReject:
              it.VisitorEntryUser_isReject ??
              it.visitorEntryUser_isReject ??
              it.visitorEntry_userReject ??
              it.visitorEntry_User_isReject ??
              false,
            visitorEntry_visitorName: visitorName,
            __raw: it,
          } as VisitorEntry;
        }
      );

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

  // Set the In Time field to current local datetime (suitable for datetime-local input)
  const setCurrentInTime = () => {
    const now = new Date();
    // Adjust for timezone offset so datetime-local shows local time
    const tzOffsetMs = now.getTimezoneOffset() * 60000;
    const local = new Date(now.getTime() - tzOffsetMs);
    const formatted = local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    setFormData((s: any) => ({ ...s, visitorEntry_Intime: formatted }));
  };

  // Set the In Time for a specific entry immediately (from the table row)
  const setEntryCurrentInTime = async (entry: VisitorEntry) => {
    try {
      setLoading(true);
      setError("");
      const id = Number(entry.visitorEntry_Id ?? entry.id ?? 0);
      if (!id) {
        setError("Invalid entry id");
        return;
      }

      const original = entries.find((it) => Number(it.visitorEntry_Id) === id);
      const original_isCanteen = original
        ? !!original.visitorEntry_isCanteen
        : !!entry.visitorEntry_isCanteen;
      const original_isStay = original
        ? !!original.visitorEntry_isStay
        : !!entry.visitorEntry_isStay;
      const original_isApproval = original
        ? !!original.visitorEntry_isApproval
        : !!entry.visitorEntry_isApproval;

      const now = new Date();
      // produce a local ISO string with timezone offset (eg. 2025-12-10T16:55:00+05:30)
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
      const nowIso = toLocalIsoWithOffset(now);

      const payload: any = {
        visitorEntry_Id: id,
        visitorEntry_visitorId: Number(entry.visitorEntry_visitorId ?? 0),
        visitorEntry_Gatepass: String(entry.visitorEntry_Gatepass ?? "").trim(),
        visitorEntry_Vehicletype: String(
          entry.visitorEntry_Vehicletype ?? ""
        ).trim(),
        visitorEntry_Vehicleno: String(
          entry.visitorEntry_Vehicleno ?? ""
        ).trim(),
        visitorEntry_Date: entry.visitorEntry_Date ?? "",
        visitorEntry_Intime: nowIso,
        visitorEntry_Outtime: entry.visitorEntry_Outtime?.trim() || null,
        visitorEntry_Userid: Number(entry.visitorEntry_Userid ?? 0),
        visitorEntry_isCanteen: original_isCanteen,
        visitorEntry_isStay: original_isStay,
        visitorEntry_isApproval: original_isApproval,
        visitorEntryAdmin_isApproval: !!(
          original?.visitorEntry_adminApproval ??
          entry.visitorEntry_adminApproval
        ),
        visitorEntryuser_isApproval: !!(
          original?.visitorEntry_userApproval ?? entry.visitorEntry_userApproval
        ),
      };

      await endpoints.visitorEntry.update(id, payload);
      await fetchData();
    } catch (err: any) {
      console.error("setEntryCurrentInTime error:", err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to set In Time"
      );
    } finally {
      setLoading(false);
    }
  };

  // Set the Out Time for a specific entry immediately (from the table row)
  const setEntryCurrentOutTime = async (entry: VisitorEntry) => {
    try {
      setLoading(true);
      setError("");
      const id = Number(entry.visitorEntry_Id ?? entry.id ?? 0);
      if (!id) {
        setError("Invalid entry id");
        return;
      }

      const original = entries.find((it) => Number(it.visitorEntry_Id) === id);
      const original_isCanteen = original
        ? !!original.visitorEntry_isCanteen
        : !!entry.visitorEntry_isCanteen;
      const original_isStay = original
        ? !!original.visitorEntry_isStay
        : !!entry.visitorEntry_isStay;
      const original_isApproval = original
        ? !!original.visitorEntry_isApproval
        : !!entry.visitorEntry_isApproval;

      const now = new Date();
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
      const nowIso = toLocalIsoWithOffset(now);

      const payload: any = {
        visitorEntry_Id: id,
        visitorEntry_visitorId: Number(entry.visitorEntry_visitorId ?? 0),
        visitorEntry_Gatepass: String(entry.visitorEntry_Gatepass ?? "").trim(),
        visitorEntry_Vehicletype: String(
          entry.visitorEntry_Vehicletype ?? ""
        ).trim(),
        visitorEntry_Vehicleno: String(
          entry.visitorEntry_Vehicleno ?? ""
        ).trim(),
        visitorEntry_Date: entry.visitorEntry_Date ?? "",
        visitorEntry_Intime:
          (entry.visitorEntry_Intime &&
            String(entry.visitorEntry_Intime).trim()) ||
          null,
        visitorEntry_Outtime: nowIso,
        visitorEntry_Userid: Number(entry.visitorEntry_Userid ?? 0),
        visitorEntry_isCanteen: original_isCanteen,
        visitorEntry_isStay: original_isStay,
        visitorEntry_isApproval: original_isApproval,
        visitorEntryAdmin_isApproval: !!(
          original?.visitorEntry_adminApproval ??
          entry.visitorEntry_adminApproval
        ),
        visitorEntryuser_isApproval: !!(
          original?.visitorEntry_userApproval ?? entry.visitorEntry_userApproval
        ),
      };

      await endpoints.visitorEntry.update(id, payload);
      await fetchData();
    } catch (err: any) {
      console.error("setEntryCurrentOutTime error:", err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to set Out Time"
      );
    } finally {
      setLoading(false);
    }
  };

  // handleView - opens view modal
  const handleView = (entry: VisitorEntry) => {
    setViewingEntry(entry);
    setShowViewModal(true);
  };

  // handleApprove - sets admin approval to true
  const handleApprove = async (entry: VisitorEntry) => {
    try {
      setLoading(true);
      setError("");

      const entryId = Number(entry.visitorEntry_Id);
      const payload: any = {
        visitorEntry_Id: entryId,
        visitorEntry_visitorId: Number(entry.visitorEntry_visitorId ?? 0),
        visitorEntry_Gatepass: String(entry.visitorEntry_Gatepass ?? "").trim(),
        visitorEntry_Vehicletype: String(
          entry.visitorEntry_Vehicletype ?? ""
        ).trim(),
        visitorEntry_Vehicleno: String(
          entry.visitorEntry_Vehicleno ?? ""
        ).trim(),
        visitorEntry_Date: entry.visitorEntry_Date ?? "",
        visitorEntry_Intime:
          (entry.visitorEntry_Intime &&
            String(entry.visitorEntry_Intime).trim()) ||
          null,
        visitorEntry_Outtime: entry.visitorEntry_Outtime?.trim() || null,
        visitorEntry_Userid: Number(entry.visitorEntry_Userid ?? 0),
        visitorEntry_isCanteen: !!entry.visitorEntry_isCanteen,
        visitorEntry_isStay: !!entry.visitorEntry_isStay,
        visitorEntry_isApproval: true,
        visitorEntryAdmin_isApproval: true,
        visitorEntryuser_isApproval: !!entry.visitorEntry_userApproval,
        VisitorEntryUser_isReject: false,
      };

      await endpoints.visitorEntry.update(entryId, payload);
      alert("Visitor entry approved successfully!");
      await fetchData();
    } catch (err: any) {
      console.error("handleApprove error:", err);
      const backendMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to approve entry";
      setError(String(backendMsg));
    } finally {
      setLoading(false);
    }
  };

  // handleReject - sets user reject to true
  const handleReject = async (entry: VisitorEntry) => {
    try {
      const confirmReject = window.confirm(
        "Are you sure you want to reject this entry?"
      );
      if (!confirmReject) return;

      setLoading(true);
      setError("");

      const entryId = Number(entry.visitorEntry_Id);
      const payload: any = {
        visitorEntry_Id: entryId,
        visitorEntry_visitorId: Number(entry.visitorEntry_visitorId ?? 0),
        visitorEntry_Gatepass: String(entry.visitorEntry_Gatepass ?? "").trim(),
        visitorEntry_Vehicletype: String(
          entry.visitorEntry_Vehicletype ?? ""
        ).trim(),
        visitorEntry_Vehicleno: String(
          entry.visitorEntry_Vehicleno ?? ""
        ).trim(),
        visitorEntry_Date: entry.visitorEntry_Date ?? "",
        visitorEntry_Intime:
          (entry.visitorEntry_Intime &&
            String(entry.visitorEntry_Intime).trim()) ||
          null,
        visitorEntry_Outtime: entry.visitorEntry_Outtime?.trim() || null,
        visitorEntry_Userid: Number(entry.visitorEntry_Userid ?? 0),
        visitorEntry_isCanteen: !!entry.visitorEntry_isCanteen,
        visitorEntry_isStay: !!entry.visitorEntry_isStay,
        visitorEntry_isApproval: false,
        visitorEntryAdmin_isApproval: false,
        visitorEntryuser_isApproval: false,
        VisitorEntryUser_isReject: true,
      };

      console.log("Rejecting entry with ID:", entryId, "payload:", payload);

      await endpoints.visitorEntry.update(entryId, payload);

      alert("Visitor entry rejected successfully!");
      await fetchData();
    } catch (err: any) {
      console.error("handleReject error:", err);
      console.error("Error response:", err?.response);
      const backendMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reject entry";
      setError(String(backendMsg));
      alert(`Error: ${backendMsg}`);
    } finally {
      setLoading(false);
    }
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

      // For security users: do not allow changing approval/canteen/stay flags.
      // Use original entry values for these fields to enforce immutability on client.
      const original = entries.find(
        (it) => Number(it.visitorEntry_Id) === Number(editingId)
      );
      const original_isCanteen = original
        ? !!original.visitorEntry_isCanteen
        : !!formData.visitorEntry_isCanteen;
      const original_isStay = original
        ? !!original.visitorEntry_isStay
        : !!formData.visitorEntry_isStay;
      const original_isApproval = original
        ? !!original.visitorEntry_isApproval
        : !!formData.visitorEntry_isApproval;
      const original_adminApproval = original
        ? !!original.visitorEntry_adminApproval
        : !!formData.visitorEntry_adminApproval;
      const original_userApproval = original
        ? !!original.visitorEntry_userApproval
        : !!formData.visitorEntry_userApproval;

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
        visitorEntry_isCanteen: original_isCanteen,
        visitorEntry_isStay: original_isStay,
        visitorEntry_isApproval: original_isApproval,
        visitorEntryAdmin_isApproval: original_adminApproval,
        visitorEntryuser_isApproval: original_userApproval,
      };

      await endpoints.visitorEntry.update(editingId, payload);

      alert("Visitor entry updated successfully (Security)!");
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
      visitorEntry_adminApproval: false,
      visitorEntry_userApproval: false,
    });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const getOutTimeMs = (e: VisitorEntry) => {
    const ts = e.visitorEntry_Outtime || "";
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  // Return only the date part (e.g. 12/10/2025)
  const formatDateOnly = (ts?: string | null) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) return d.toLocaleDateString();
      // fallback for ISO-like strings (YYYY-MM-DDTHH:mm[:ss][...])
      const s = String(ts);
      const parts = s.split("T");
      if (parts[0]) return parts[0];
      return s;
    } catch {
      return String(ts);
    }
  };

  // Return only the time part (e.g. 2:51:00 PM)
  const formatTimeOnly = (ts?: string | null) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString();
      // fallback for ISO-like strings (YYYY-MM-DDTHH:mm[:ss][+TZ])
      const s = String(ts);
      const parts = s.split("T");
      if (parts[1]) {
        // remove timezone offset if present
        const timePart = parts[1].replace(/([+-]\d{2}:?\d{2}|Z)$/, "");
        return timePart;
      }
      return s;
    } catch {
      return String(ts);
    }
  };

  // (formatDateTime removed — use formatDateOnly/formatTimeOnly)

  const nowMs = Date.now();
  // Treat an entry as history only if it has an Out Time set (and that out time is in the past).
  // Until Out Time is set, keep it in current entries even if In Time is past.
  const historyEntries = entries.filter((e) => {
    // If rejected, it goes to history
    if (e.visitorEntry_userReject) return true;
    const outMs = getOutTimeMs(e);
    return outMs !== null && outMs < nowMs;
  });
  const currentEntries = entries.filter((e) => {
    // If rejected, it should not be in current
    if (e.visitorEntry_userReject) return false;
    const outMs = getOutTimeMs(e);
    // If out time is not set, it's current. If set and in future, still current.
    return outMs === null || outMs >= nowMs;
  });

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

  React.useEffect(() => {
    if (currentPage > currentTotalPages) setCurrentPage(currentTotalPages);
    if (currentPage < 1 && currentTotalPages >= 1) setCurrentPage(1);
  }, [currentTotalPages]);

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

  React.useEffect(() => {
    if (historyCurrentPage > historyTotalPages)
      setHistoryCurrentPage(historyTotalPages);
    if (historyCurrentPage < 1 && historyTotalPages >= 1)
      setHistoryCurrentPage(1);
  }, [historyTotalPages]);

  return (
    <div className="rolemaster-container">
      <div className="rolemaster-header">
        <h1 className="rolemaster-title">Security - Visitor Entry Approval</h1>
      </div>

      {showViewModal && viewingEntry && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Visitor Entry Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>
            <div
              className="modal-form"
              style={{
                maxHeight: "calc(70vh - 120px)",
                overflowY: "auto",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Visitor Name:
                  </label>
                  <div
                    style={{
                      color: "#1f2937",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {viewingEntry.visitorEntry_visitorName || "-"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Gatepass:
                  </label>
                  <div
                    style={{
                      color: "#1f2937",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {viewingEntry.visitorEntry_Gatepass || "-"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Vehicle Type:
                  </label>
                  <div
                    style={{
                      color: "#1f2937",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {viewingEntry.visitorEntry_Vehicletype || "-"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Vehicle No:
                  </label>
                  <div
                    style={{
                      color: "#1f2937",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {viewingEntry.visitorEntry_Vehicleno || "-"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Date:
                  </label>
                  <div
                    style={{
                      color: "#1f2937",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {formatDateOnly(viewingEntry.visitorEntry_Date)}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    In Time:
                  </label>
                  <div
                    style={{
                      color: "#1f2937",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {formatTimeOnly(viewingEntry.visitorEntry_Intime)}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Out Time:
                  </label>
                  <div
                    style={{
                      color: "#1f2937",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {formatTimeOnly(viewingEntry.visitorEntry_Outtime) ||
                      "Not Set"}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Admin Approved:
                  </label>
                  <div style={{ textAlign: "right" }}>
                    <span
                      className={`status-badge ${
                        viewingEntry.visitorEntry_adminApproval
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {viewingEntry.visitorEntry_adminApproval ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    User Approved:
                  </label>
                  <div style={{ textAlign: "right" }}>
                    <span
                      className={`status-badge ${
                        viewingEntry.visitorEntry_userApproval
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {viewingEntry.visitorEntry_userApproval ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Rejected:
                  </label>
                  <div style={{ textAlign: "right" }}>
                    <span
                      className={`status-badge ${
                        viewingEntry.visitorEntry_userReject
                          ? "status-rejected"
                          : "inactive"
                      }`}
                    >
                      {viewingEntry.visitorEntry_userReject ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Canteen:
                  </label>
                  <div style={{ textAlign: "right" }}>
                    <span
                      className={`status-badge ${
                        viewingEntry.visitorEntry_isCanteen
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {viewingEntry.visitorEntry_isCanteen ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <label
                    style={{
                      fontWeight: "600",
                      color: "#374151",
                      minWidth: "140px",
                    }}
                  >
                    Stay:
                  </label>
                  <div style={{ textAlign: "right" }}>
                    <span
                      className={`status-badge ${
                        viewingEntry.visitorEntry_isStay ? "active" : "inactive"
                      }`}
                    >
                      {viewingEntry.visitorEntry_isStay ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Visitor Entry (Security)</h2>
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
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    name="visitorEntry_Intime"
                    type="datetime-local"
                    value={formData.visitorEntry_Intime}
                    onChange={handleInputChange}
                    className="role-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={setCurrentInTime}
                    title="Set current time"
                    style={{ padding: "6px 10px" }}
                  >
                    Set Current Time
                  </button>
                </div>
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
                    disabled
                  />{" "}
                  <span>Canteen Access (read-only)</span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    name="visitorEntry_isApproval"
                    type="checkbox"
                    checked={!!formData.visitorEntry_isApproval}
                    onChange={handleInputChange}
                    disabled
                  />{" "}
                  <span>Approved (read-only)</span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    name="visitorEntry_isStay"
                    type="checkbox"
                    checked={!!formData.visitorEntry_isStay}
                    onChange={handleInputChange}
                    disabled
                  />{" "}
                  <span>Stay (read-only)</span>
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
                    <th>Date</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Actions</th>
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
                      <td>{entry.visitorEntry_visitorName}</td>
                      <td>{formatDateOnly(entry.visitorEntry_Date)}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <span>
                            {formatTimeOnly(entry.visitorEntry_Intime)}
                          </span>
                          <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => setEntryCurrentInTime(entry)}
                            title="Set In Time to now"
                            style={{
                              padding: "6px 10px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Set Now
                          </button>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <span>
                            {formatTimeOnly(entry.visitorEntry_Outtime)}
                          </span>
                          <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => setEntryCurrentOutTime(entry)}
                            title="Set Out Time to now"
                            style={{
                              padding: "6px 10px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Set Out
                          </button>
                        </div>
                      </td>
                      <td>
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleView(entry)}
                            title="View Details"
                            aria-label="View Details"
                            style={{
                              padding: "6px 10px",
                              background: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
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
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                          {!entry.visitorEntry_adminApproval && (
                            <>
                              <button
                                className="action-btn approve-btn"
                                onClick={() => handleApprove(entry)}
                                title="Approve"
                                aria-label="Approve"
                                style={{
                                  padding: "6px 12px",
                                  background: "#10b981",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontWeight: "600",
                                  fontSize: "16px",
                                }}
                              >
                                ✓
                              </button>
                              <button
                                className="action-btn reject-btn"
                                onClick={() => handleReject(entry)}
                                title="Reject"
                                aria-label="Reject"
                                style={{
                                  padding: "6px 12px",
                                  background: "#ef4444",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontWeight: "600",
                                  fontSize: "16px",
                                }}
                              >
                                ✕
                              </button>
                            </>
                          )}
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
                    <th>Date</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Actions</th>
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
                      <td>{entry.visitorEntry_visitorName}</td>
                      <td>{formatDateOnly(entry.visitorEntry_Date)}</td>
                      <td>{formatTimeOnly(entry.visitorEntry_Intime)}</td>
                      <td>{formatTimeOnly(entry.visitorEntry_Outtime)}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                          }}
                        >
                          {/* View button */}
                          <button
                            onClick={() => handleView(entry)}
                            style={{
                              background: entry.visitorEntry_userReject
                                ? "#ef4444"
                                : "#3b82f6",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="View Details"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                        </div>
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

export default Securityapprovalview;
