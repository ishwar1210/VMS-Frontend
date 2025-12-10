import { useState, useEffect } from "react";
import { endpoints } from "../api/endpoint";
import "./Preappointment.css";

type VisitorFormData = {
  visitor_Name: string;
  visitor_mobile: string;
  visitor_Address: string;
  visitor_CompanyName: string;
  visitor_Purposeofvisit: string;
  visitor_Idprooftype: string;
  visitor_idproofno: string;
  visitor_MeetingDate: string;
};

type VisitorEntryFormData = {
  visitorEntry_visitorId: number;
  visitorEntry_Gatepass: string;
  visitorEntry_Vehicletype: string;
  visitorEntry_Vehicleno: string;
  visitorEntry_Date: string;
  visitorEntry_Intime: string;
  visitorEntry_Userid: number;
  visitorEntry_isApproval: boolean;
  visitorEntry_isCanteen: boolean;
  visitorEntry_isStay: boolean;
};

export default function Preappointment() {
  const [step, setStep] = useState<1 | 2>(1);
  const [createdVisitorId, setCreatedVisitorId] = useState<number | null>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [selectedVisitorId, setSelectedVisitorId] = useState<number>(0); // 0 => create new
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [visitorForm, setVisitorForm] = useState<VisitorFormData>({
    visitor_Name: "",
    visitor_mobile: "",
    visitor_Address: "",
    visitor_CompanyName: "",
    visitor_Purposeofvisit: "",
    visitor_Idprooftype: "Aadhar",
    visitor_idproofno: "",
    visitor_MeetingDate: "",
  });

  const [entryForm, setEntryForm] = useState<VisitorEntryFormData>({
    visitorEntry_visitorId: 0,
    visitorEntry_Gatepass: "",
    visitorEntry_Vehicletype: "",
    visitorEntry_Vehicleno: "",
    visitorEntry_Date: "",
    visitorEntry_Intime: "",
    visitorEntry_Userid: 0,
    visitorEntry_isApproval: true,
    visitorEntry_isCanteen: false,
    visitorEntry_isStay: false,
  });

  const handleVisitorChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setVisitorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEntryChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEntryForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setEntryForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // If an existing visitor is selected, reuse it instead of creating
      if (selectedVisitorId && selectedVisitorId > 0) {
        setCreatedVisitorId(selectedVisitorId);
        setEntryForm((prev) => ({
          ...prev,
          visitorEntry_visitorId: selectedVisitorId,
        }));
        setStep(2);
        setLoading(false);
        return;
      }

      const res = await endpoints.visitor.create(visitorForm);
      const newVisitorId = res.data?.visitorId || res.data?.id || res.data;
      if (!newVisitorId) {
        alert(
          "Visitor created but ID not returned. Please check API response."
        );
        setLoading(false);
        return;
      }
      setCreatedVisitorId(newVisitorId);
      setSelectedVisitorId(newVisitorId);
      setEntryForm((prev) => ({
        ...prev,
        visitorEntry_visitorId: newVisitorId,
      }));
      setStep(2);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create visitor"
      );
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchVisitors();
    fetchUsers();
  }, []);

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await endpoints.visitorEntry.create(entryForm);
      alert("Preappointment created successfully!");
      // Reset forms
      setVisitorForm({
        visitor_Name: "",
        visitor_mobile: "",
        visitor_Address: "",
        visitor_CompanyName: "",
        visitor_Purposeofvisit: "",
        visitor_Idprooftype: "Aadhar",
        visitor_idproofno: "",
        visitor_MeetingDate: "",
      });
      setEntryForm({
        visitorEntry_visitorId: 0,
        visitorEntry_Gatepass: "",
        visitorEntry_Vehicletype: "",
        visitorEntry_Vehicleno: "",
        visitorEntry_Date: "",
        visitorEntry_Intime: "",
        visitorEntry_Userid: 0,
        visitorEntry_isApproval: true,
        visitorEntry_isCanteen: false,
        visitorEntry_isStay: false,
      });
      setStep(1);
      setCreatedVisitorId(null);
      // refresh list so created visitor (if any) appears
      fetchVisitors();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create visitor entry"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="preappointment-container">
      <div className="preappointment-header">
        <h2 className="preappointment-title">Pre-appointment</h2>
        <div className="step-indicator">Step {step} of 2</div>
      </div>

      {step === 1 && (
        <section className="preappointment-form-section">
          <h3 className="form-section-title">Visitor Registration</h3>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <label
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                marginRight: 6,
              }}
            >
              Select Visitor
            </label>
            <select
              value={selectedVisitorId}
              onChange={(e) => {
                const id = Number(e.target.value || 0);
                setSelectedVisitorId(id);
                if (id > 0) {
                  const v =
                    visitors.find((x) => Number(x.visitorId || x.id) === id) ||
                    visitors.find(
                      (x) => Number(x.visitor_Id || x.visitorId) === id
                    );
                  if (v) {
                    setVisitorForm((prev) => ({
                      ...prev,
                      visitor_Name: v.visitor_Name || v.name || "",
                      visitor_mobile: v.visitor_mobile || v.mobile || "",
                      visitor_Address: v.visitor_Address || v.address || "",
                      visitor_CompanyName:
                        v.visitor_CompanyName || v.company || "",
                      visitor_Purposeofvisit:
                        v.visitor_Purposeofvisit || v.purpose || "",
                      visitor_Idprooftype:
                        v.visitor_Idprooftype || v.idProofType || "Aadhar",
                      visitor_idproofno:
                        v.visitor_idproofno || v.idProofNo || "",
                      visitor_MeetingDate:
                        v.visitor_MeetingDate || v.meetingDate || "",
                    }));
                    setEntryForm((prev) => ({
                      ...prev,
                      visitorEntry_visitorId: id,
                    }));
                    setCreatedVisitorId(id);
                    setStep(2);
                  }
                } else {
                  setCreatedVisitorId(null);
                  setStep(1);
                }
              }}
              className="form-input"
              style={{ width: 320 }}
            >
              <option value={0}>-- Create New Visitor --</option>
              {visitors.map((v) => {
                const id = Number(
                  v.visitorId || v.id || v.visitor_Id || v.visitorId
                );
                const label = `${v.visitor_Name || v.name || "Unknown"} - ${
                  v.visitor_mobile || v.mobile || "-"
                }`;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
            <button type="button" onClick={fetchVisitors} className="back-btn">
              Refresh
            </button>
          </div>
          <form onSubmit={handleVisitorSubmit} className="preappointment-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="visitor_Name"
                  value={visitorForm.visitor_Name}
                  onChange={handleVisitorChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Mobile *</label>
                <input
                  type="text"
                  name="visitor_mobile"
                  value={visitorForm.visitor_mobile}
                  onChange={handleVisitorChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="visitor_CompanyName"
                  value={visitorForm.visitor_CompanyName}
                  onChange={handleVisitorChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Purpose of Visit *</label>
                <input
                  type="text"
                  name="visitor_Purposeofvisit"
                  value={visitorForm.visitor_Purposeofvisit}
                  onChange={handleVisitorChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address *</label>
              <textarea
                name="visitor_Address"
                value={visitorForm.visitor_Address}
                onChange={handleVisitorChange}
                required
                className="form-input"
                rows={2}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ID Proof Type *</label>
                <select
                  name="visitor_Idprooftype"
                  value={visitorForm.visitor_Idprooftype}
                  onChange={handleVisitorChange}
                  required
                  className="form-input"
                >
                  <option value="Aadhar">Aadhar</option>
                  <option value="PAN">PAN</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                </select>
              </div>
              <div className="form-group">
                <label>ID Proof No *</label>
                <input
                  type="text"
                  name="visitor_idproofno"
                  value={visitorForm.visitor_idproofno}
                  onChange={handleVisitorChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Meeting Date *</label>
              <input
                type="datetime-local"
                name="visitor_MeetingDate"
                value={visitorForm.visitor_MeetingDate}
                onChange={handleVisitorChange}
                required
                className="form-input"
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Saving..." : "Next: Visitor Entry"}
            </button>
          </form>
        </section>
      )}

      {step === 2 && (
        <section className="preappointment-form-section">
          <h3 className="form-section-title">Visitor Entry Details</h3>
          <p className="info-text">Visitor ID: {createdVisitorId}</p>
          <form onSubmit={handleEntrySubmit} className="preappointment-form">
            <div className="form-row">
              <div className="form-group">
                <label>Gate Pass *</label>
                <input
                  type="text"
                  name="visitorEntry_Gatepass"
                  value={entryForm.visitorEntry_Gatepass}
                  onChange={handleEntryChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Vehicle Type</label>
                <input
                  type="text"
                  name="visitorEntry_Vehicletype"
                  value={entryForm.visitorEntry_Vehicletype}
                  onChange={handleEntryChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vehicle No</label>
                <input
                  type="text"
                  name="visitorEntry_Vehicleno"
                  value={entryForm.visitorEntry_Vehicleno}
                  onChange={handleEntryChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>User *</label>
                <select
                  name="visitorEntry_Userid"
                  value={entryForm.visitorEntry_Userid || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value || 0);
                    setEntryForm((prev) => ({
                      ...prev,
                      visitorEntry_Userid: val,
                    }));
                  }}
                  required
                  className="form-input"
                >
                  <option value={0}>-- Select User --</option>
                  {users.length === 0 && (
                    <option value={0}>No users found</option>
                  )}
                  {users.map((u) => {
                    const id = Number(
                      u.userId || u.id || u.user_Id || u.UserId || 0
                    );
                    const name =
                      u.userName ||
                      u.name ||
                      u.fullName ||
                      u.username ||
                      u.user_Name ||
                      "Unnamed";
                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="datetime-local"
                  name="visitorEntry_Date"
                  value={entryForm.visitorEntry_Date}
                  onChange={handleEntryChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>In Time *</label>
                <input
                  type="datetime-local"
                  name="visitorEntry_Intime"
                  value={entryForm.visitorEntry_Intime}
                  onChange={handleEntryChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="visitorEntry_isApproval"
                  checked={entryForm.visitorEntry_isApproval}
                  onChange={handleEntryChange}
                />
                <span>Approval Required (Admin)</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="visitorEntry_isCanteen"
                  checked={entryForm.visitorEntry_isCanteen}
                  onChange={handleEntryChange}
                />
                <span>Canteen Access</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="visitorEntry_isStay"
                  checked={entryForm.visitorEntry_isStay}
                  onChange={handleEntryChange}
                />
                <span>Stay</span>
              </label>
            </div>

            <div className="button-row">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="back-btn"
                disabled={loading}
              >
                Back
              </button>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Submitting..." : "Submit Preappointment"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
