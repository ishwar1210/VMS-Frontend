import { useState, useEffect } from "react";
import { endpoints } from "../api/endpoint";
import "./Preappointment.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type VisitorFormData = {
  visitor_Name: string;
  visitor_mobile: string;
  visitor_Address: string;
  visitor_CompanyName: string;
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
  visitorEntry_Purposeofvisit: string;
  visitorEntry_isApproval: boolean;
  visitorEntry_isCanteen: boolean;
  visitorEntry_isStay: boolean;
};

export default function Preappointment() {
  const [step, setStep] = useState<1 | 2>(1);
  const [createdVisitorId, setCreatedVisitorId] = useState<number | null>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [selectedVisitorId, setSelectedVisitorId] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [visitorSearchTerm, setVisitorSearchTerm] = useState("");
  const [showVisitorDropdown, setShowVisitorDropdown] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [appointmentEmail, setAppointmentEmail] = useState("");
  const [appointmentName, setAppointmentName] = useState("");
  const [sendingLink, setSendingLink] = useState(false);

  const generateGatePass = (persist: boolean = false) => {
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const day = pad(now.getDate());
      const month = pad(now.getMonth() + 1);
      const todayKey = `${now.getFullYear()}-${month}-${day}`; // YYYY-MM-DD

      const storageKey = "gatepass_seq";
      let seq = 1;
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed &&
            parsed.date === todayKey &&
            typeof parsed.seq === "number"
          ) {
            seq = parsed.seq + 1;
          }
        }
      } catch (e) {
        // ignore localStorage parse errors
      }

      const seqStr = String(seq).padStart(4, "0");

      // only persist when explicitly asked (on actual save)
      if (persist) {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ date: todayKey, seq })
          );
        } catch (e) {
          // ignore storage errors
        }
      }

      return `GP-${day}-${month}-${seqStr}`;
    } catch (e) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      return `GP${timestamp}${random}`;
    }
  };

  const getLocalDateTimeForInput = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [visitorForm, setVisitorForm] = useState<VisitorFormData>({
    visitor_Name: "",
    visitor_mobile: "",
    visitor_Address: "",
    visitor_CompanyName: "",
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
    visitorEntry_Purposeofvisit: "",
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
    if (name === "visitor_mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setVisitorForm((prev) => ({ ...prev, [name]: digits }));
      if (digits.length === 10) setMobileError("");
      else if (digits.length === 0) setMobileError("");
      else setMobileError("Mobile number must be 10 digits");
      return;
    }

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
      if (selectedVisitorId && selectedVisitorId > 0) {
        const gatePass = generateGatePass();
        setCreatedVisitorId(selectedVisitorId);
        setEntryForm((prev) => ({
          ...prev,
          visitorEntry_visitorId: selectedVisitorId,
          visitorEntry_Gatepass: gatePass,
        }));
        setStep(2);
        setLoading(false);
        return;
      }

      if (!selectedVisitorId || selectedVisitorId === 0) {
        if (!/^\d{10}$/.test(visitorForm.visitor_mobile || "")) {
          toast.error("Mobile number must be 10 digits");
          setMobileError("Mobile number must be 10 digits");
          setLoading(false);
          return;
        }
      }

      if (visitorForm.visitor_MeetingDate) {
        const selected = new Date(visitorForm.visitor_MeetingDate);
        const now = new Date();
        now.setSeconds(0, 0);
        if (selected < now) {
          toast.error("Registered Date cannot be in the past");
          setLoading(false);
          return;
        }
      }

      const gatePass = generateGatePass();

      const visitorPayload = {
        visitor_Name: visitorForm.visitor_Name,
        visitor_mobile: visitorForm.visitor_mobile,
        visitor_Address: visitorForm.visitor_Address,
        visitor_CompanyName: visitorForm.visitor_CompanyName,
        visitor_Idprooftype: visitorForm.visitor_Idprooftype,
        visitor_idproofno: visitorForm.visitor_idproofno,
        visitor_MeetingDate: visitorForm.visitor_MeetingDate,
      };

      const res = await endpoints.visitor.create(visitorPayload);
      const newVisitorId = res.data?.visitorId || res.data?.id || res.data;
      if (!newVisitorId) {
        toast.error(
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
        visitorEntry_Gatepass: gatePass,
      }));
      setStep(2);
    } catch (err: any) {
      toast.error(
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

    // no special cleanup required
    return () => {};
  }, []);

  const handleSendAppointmentLink = async () => {
    if (!appointmentEmail || !appointmentName) {
      toast.error("Please enter both email and name");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(appointmentEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSendingLink(true);
    try {
      await endpoints.visitor.sendAppointmentLink({
        email: appointmentEmail,
        name: appointmentName,
      });
      toast.success("Appointment link sent successfully!");
      setAppointmentEmail("");
      setAppointmentName("");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send appointment link"
      );
    } finally {
      setSendingLink(false);
    }
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (entryForm.visitorEntry_Date) {
        const selected = new Date(entryForm.visitorEntry_Date);
        const now = new Date();
        now.setSeconds(0, 0);
        if (selected < now) {
          toast.error("Date cannot be in the past");
          setLoading(false);
          return;
        }
      }
      const payload: any = { ...entryForm };
      // Reserve and persist gatepass only when actually saving to DB
      try {
        payload.visitorEntry_Gatepass = generateGatePass(true);
      } catch (e) {
        // fallback to existing value
        payload.visitorEntry_Gatepass =
          payload.visitorEntry_Gatepass || generateGatePass(false);
      }
      if (!payload.visitorEntry_Intime) payload.visitorEntry_Intime = null;
      await endpoints.visitorEntry.create(payload);
      toast.success("Preappointment created successfully!");
      setVisitorForm({
        visitor_Name: "",
        visitor_mobile: "",
        visitor_Address: "",
        visitor_CompanyName: "",
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
        visitorEntry_Purposeofvisit: "",
        visitorEntry_isApproval: true,
        visitorEntry_isCanteen: false,
        visitorEntry_isStay: false,
      });
      setStep(1);
      setCreatedVisitorId(null);
      setSelectedVisitorId(0);
      setVisitorSearchTerm("");
      setUserSearchTerm("");
      fetchVisitors();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create visitor entry"
      );
    } finally {
      setLoading(false);
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
      <div className="preappointment-container">
        <div className="preappointment-header">
          <h2 className="preappointment-title">Pre-appointment</h2>
          <div className="step-indicator">Step {step} of 2</div>
        </div>

        {step === 1 && (
          <>
            <section
              className="preappointment-form-section"
              style={{ marginBottom: 24 }}
            >
              <h3 className="form-section-title">Send Appointment Link</h3>
              <div className="preappointment-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Visitor Name *</label>
                    <input
                      type="text"
                      value={appointmentName}
                      onChange={(e) => setAppointmentName(e.target.value)}
                      placeholder="Enter visitor name"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={appointmentEmail}
                      onChange={(e) => setAppointmentEmail(e.target.value)}
                      placeholder="visitor@example.com"
                      className="form-input"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendAppointmentLink}
                  disabled={sendingLink}
                  className="submit-btn"
                  style={{ maxWidth: 250 }}
                >
                  {sendingLink ? "Sending..." : "Send Appointment Link"}
                </button>
              </div>
            </section>

            <section className="preappointment-form-section">
              <h3 className="form-section-title">Visitor Registration</h3>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 12,
                  position: "relative",
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
                <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
                  <input
                    type="text"
                    placeholder="Search by name or mobile number..."
                    value={visitorSearchTerm}
                    onChange={(e) => {
                      setVisitorSearchTerm(e.target.value);
                      setShowVisitorDropdown(true);
                    }}
                    onFocus={() => setShowVisitorDropdown(true)}
                    className="form-input"
                    style={{ width: "100%" }}
                  />
                  {showVisitorDropdown && visitorSearchTerm && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        maxHeight: 300,
                        overflowY: "auto",
                        backgroundColor: "#0b1220",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 4,
                        marginTop: 4,
                        zIndex: 1000,
                        boxShadow: "0 6px 18px rgba(2,6,23,0.6)",
                        color: "#fff",
                      }}
                    >
                      <div
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          backgroundColor:
                            selectedVisitorId === 0 ? "#0f1724" : "#0b1220",
                          color: "#fff",
                        }}
                        onClick={() => {
                          setSelectedVisitorId(0);
                          setVisitorSearchTerm("");
                          setShowVisitorDropdown(false);
                          setCreatedVisitorId(null);
                          setStep(1);
                        }}
                      >
                        + Create New Visitor
                      </div>
                      {visitors
                        .filter((v) => {
                          const mobile = (
                            v.visitor_mobile ||
                            v.mobile ||
                            ""
                          ).toString();
                          const search = visitorSearchTerm.trim();
                          return mobile.includes(search);
                        })
                        .map((v) => {
                          const id = Number(
                            v.visitorId || v.id || v.visitor_Id || v.visitorId
                          );
                          const name = v.visitor_Name || v.name || "Unknown";
                          const mobile = v.visitor_mobile || v.mobile || "-";
                          return (
                            <div
                              key={id}
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.04)",
                                backgroundColor:
                                  selectedVisitorId === id
                                    ? "#0f1724"
                                    : "#0b1220",
                                color: "#fff",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#142033";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  selectedVisitorId === id
                                    ? "#0f1724"
                                    : "#0b1220";
                              }}
                              onClick={() => {
                                const gatePass = generateGatePass();
                                setSelectedVisitorId(id);
                                setVisitorSearchTerm(`${name} - ${mobile}`);
                                setShowVisitorDropdown(false);
                                setVisitorForm((prev) => ({
                                  ...prev,
                                  visitor_Name: v.visitor_Name || v.name || "",
                                  visitor_mobile:
                                    v.visitor_mobile || v.mobile || "",
                                  visitor_Address:
                                    v.visitor_Address || v.address || "",
                                  visitor_CompanyName:
                                    v.visitor_CompanyName || v.company || "",
                                  visitor_Idprooftype:
                                    v.visitor_Idprooftype ||
                                    v.idProofType ||
                                    "Aadhar",
                                  visitor_idproofno:
                                    v.visitor_idproofno || v.idProofNo || "",
                                  visitor_MeetingDate:
                                    v.visitor_MeetingDate ||
                                    v.meetingDate ||
                                    "",
                                }));
                                setEntryForm((prev) => ({
                                  ...prev,
                                  visitorEntry_visitorId: id,
                                  visitorEntry_Gatepass: gatePass,
                                }));
                                setCreatedVisitorId(id);
                                setStep(2);
                              }}
                            >
                              <div style={{ fontWeight: 500 }}>{name}</div>
                              <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                                Mobile: {mobile}
                              </div>
                            </div>
                          );
                        })}
                      {visitors.filter((v) => {
                        const mobile = (
                          v.visitor_mobile ||
                          v.mobile ||
                          ""
                        ).toString();
                        const search = visitorSearchTerm.trim();
                        return mobile.includes(search);
                      }).length === 0 &&
                        visitorSearchTerm && (
                          <div
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color: "#cbd5e1",
                            }}
                          >
                            No visitors found matching this mobile number
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
              <form
                onSubmit={handleVisitorSubmit}
                className="preappointment-form"
              >
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={visitorForm.visitor_mobile}
                      onChange={handleVisitorChange}
                      onBlur={() => {
                        if (
                          visitorForm.visitor_mobile &&
                          visitorForm.visitor_mobile.length !== 10
                        ) {
                          setMobileError("Mobile number must be 10 digits");
                        } else {
                          setMobileError("");
                        }
                      }}
                      required
                      className="form-input"
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

                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? "Saving..." : "Next: Visitor Entry"}
                </button>
              </form>
            </section>
          </>
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
                    className="form-input"
                    disabled
                    style={{
                      backgroundColor: "#f5f5f5",
                      cursor: "not-allowed",
                    }}
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
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Search user by name..."
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setShowUserDropdown(true);
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      required
                      className="form-input"
                      style={{ width: "100%" }}
                    />
                    {showUserDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          maxHeight: 300,
                          overflowY: "auto",
                          backgroundColor: "#0b1220",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 4,
                          marginTop: 4,
                          zIndex: 1000,
                          boxShadow: "0 6px 18px rgba(2,6,23,0.6)",
                          color: "#fff",
                        }}
                      >
                        {users
                          .filter((u) => {
                            const name = (
                              u.userName ||
                              u.name ||
                              u.fullName ||
                              u.username ||
                              u.user_Name ||
                              ""
                            )
                              .toLowerCase()
                              .trim();
                            const search = userSearchTerm.toLowerCase().trim();
                            return !search || name.includes(search);
                          })
                          .map((u) => {
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
                            const email = u.email || u.userEmail || "";
                            return (
                              <div
                                key={id}
                                style={{
                                  padding: "8px 12px",
                                  cursor: "pointer",
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.04)",
                                  backgroundColor:
                                    entryForm.visitorEntry_Userid === id
                                      ? "#0f1724"
                                      : "#0b1220",
                                  color: "#fff",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "#142033";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    entryForm.visitorEntry_Userid === id
                                      ? "#0f1724"
                                      : "#0b1220";
                                }}
                                onClick={() => {
                                  setEntryForm((prev) => ({
                                    ...prev,
                                    visitorEntry_Userid: id,
                                  }));
                                  setUserSearchTerm(name);
                                  setShowUserDropdown(false);
                                }}
                              >
                                <div style={{ fontWeight: 500 }}>{name}</div>
                                {email && (
                                  <div
                                    style={{ fontSize: 12, color: "#cbd5e1" }}
                                  >
                                    {email}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        {users.filter((u) => {
                          const name = (
                            u.userName ||
                            u.name ||
                            u.fullName ||
                            u.username ||
                            u.user_Name ||
                            ""
                          )
                            .toLowerCase()
                            .trim();
                          const search = userSearchTerm.toLowerCase().trim();
                          return !search || name.includes(search);
                        }).length === 0 && (
                          <div
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color: "#cbd5e1",
                            }}
                          >
                            No users found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Purpose of Visit *</label>
                  <input
                    type="text"
                    name="visitorEntry_Purposeofvisit"
                    value={entryForm.visitorEntry_Purposeofvisit}
                    onChange={handleEntryChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="datetime-local"
                    name="visitorEntry_Date"
                    value={entryForm.visitorEntry_Date}
                    onChange={handleEntryChange}
                    min={getLocalDateTimeForInput()}
                    required
                    className="form-input"
                  />
                </div>
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
    </>
  );
}
