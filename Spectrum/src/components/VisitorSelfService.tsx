import { useState, useEffect, useRef } from "react";
import { endpoints } from "../api/endpoint";
import "./VisitorSelfService.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Webcam from "react-webcam";

type VisitorFormData = {
  visitor_Name: string;
  visitor_mobile: string;
  visitor_Email: string;
  visitor_Address: string;
  visitor_CompanyName: string;
  visitor_Idprooftype: string;
  visitor_idproofno: string;
};

type VisitorEntryFormData = {
  visitorEntry_visitorId: number;
  visitorEntry_Gatepass: string;
  visitorEntry_Vehicletype: string;
  visitorEntry_Vehicleno: string;
  visitorEntry_Date: string;
  visitorEntry_Userid: number;
  visitorEntry_Purposeofvisit: string;
  visitorEntry_isApproval: boolean;
  visitorEntry_isCanteen: boolean;
  visitorEntry_isStay: boolean;
  meetingTimeFrom: string;
  meetingTimeTo: string;
};

interface VisitorSelfServiceProps {
  onAppointmentAdded?: () => void;
}

const VisitorSelfService: React.FC<VisitorSelfServiceProps> = ({
  onAppointmentAdded,
} = {}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [createdVisitorId, setCreatedVisitorId] = useState<number | null>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [selectedVisitorId, setSelectedVisitorId] = useState<number>(0); // 0 => create new
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [visitorSearchTerm, setVisitorSearchTerm] = useState("");
  const [showVisitorDropdown, setShowVisitorDropdown] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const webcamRef = useRef<any>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showUserDropdownLocal, setShowUserDropdownLocal] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );
  const [gatepassMessage, setGatepassMessage] = useState<string | null>(null);

  const [visitorForm, setVisitorForm] = useState<VisitorFormData>({
    visitor_Name: "",
    visitor_mobile: "",
    visitor_Email: "",
    visitor_Address: "",
    visitor_CompanyName: "",
    visitor_Idprooftype: "Aadhar",
    visitor_idproofno: "",
  });

  const [entryForm, setEntryForm] = useState<VisitorEntryFormData>({
    visitorEntry_visitorId: 0,
    visitorEntry_Gatepass: "",
    visitorEntry_Vehicletype: "",
    visitorEntry_Vehicleno: "",
    visitorEntry_Date: "",
    visitorEntry_Userid: 0,
    visitorEntry_Purposeofvisit: "",
    visitorEntry_isApproval: false,
    visitorEntry_isCanteen: false,
    visitorEntry_isStay: false,
    meetingTimeFrom: "",
    meetingTimeTo: "",
  });

  const handleVisitorChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "visitor_mobile") {
      // Allow only digits and limit to 10 characters
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setVisitorForm((prev) => ({ ...prev, [name]: digits }));
      // Clear error when length is exactly 10, otherwise show message if user typed something
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

  const startCamera = async () => {
    try {
      setCameraActive(true);
      toast.success("Camera opened");
    } catch (err: any) {
      console.error("Camera error details:", err);
      toast.error(`Camera error: ${err.message || "Permission denied"}`);
    }
  };

  const stopCamera = () => {
    try {
      const videoEl = webcamRef.current?.video as HTMLVideoElement | undefined;
      const stream = videoEl?.srcObject as MediaStream | undefined;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      console.warn("Error stopping camera stream", e);
    }
    setCameraActive(false);
  };

  const dataURLToBlob = (dataURL: string) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const capturePhoto = async () => {
    try {
      const screenshot = webcamRef.current?.getScreenshot();
      if (!screenshot) {
        toast.error("Failed to capture photo");
        return;
      }
      const blob = dataURLToBlob(screenshot);
      setCapturedBlob(blob);
      setCapturedImage(screenshot);
      stopCamera();
      toast.success("Photo captured!");
    } catch (err) {
      console.error("capture error", err);
      toast.error("Failed to capture photo");
    }
  };

  const uploadVisitorImage = async (imageBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("file", imageBlob, "visitor.jpg");
    const response = await endpoints.visitor.uploadImage(formData);
    return response.data.imagePath || response.data;
  };

  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Generate gate pass
      const gatePass = generateGatePass();

      if (selectedVisitorId && selectedVisitorId > 0) {
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

      // Validate mobile for new visitor entries
      if (!selectedVisitorId || selectedVisitorId === 0) {
        if (!/^\d{10}$/.test(visitorForm.visitor_mobile || "")) {
          toast.error("Mobile number must be 10 digits");
          setMobileError("Mobile number must be 10 digits");
          setLoading(false);
          return;
        }
      }

      // Step 1: Upload image if captured
      let imagePath = null;
      if (capturedBlob) {
        try {
          imagePath = await uploadVisitorImage(capturedBlob);
        } catch (err) {
          toast.error("Failed to upload visitor image");
          setLoading(false);
          return;
        }
      }

      // Step 2: Create visitor with image path
      const visitorPayload = {
        ...visitorForm,
        Visitor_image: imagePath,
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
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdownLocal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (entryForm.visitorEntry_Userid) {
      const user = users.find((u) => {
        const id = Number(u.userId || u.id || u.user_Id || u.UserId || 0);
        return id === entryForm.visitorEntry_Userid;
      });
      if (user) {
        const name =
          user.userName ||
          user.name ||
          user.fullName ||
          user.username ||
          user.user_Name ||
          "Unnamed";
        setUserSearchTerm(name);
      }
    }
  }, [entryForm.visitorEntry_Userid, users]);

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!entryForm.visitorEntry_Userid || entryForm.visitorEntry_Userid === 0) {
      toast.error("Please select an employee");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...entryForm,
        visitorEntry_isApproval: false,
        visitorEntry_isCanteen: false,
        visitorEntry_isStay: false,
      };

      // Reserve and persist gatepass only when actually saving to DB
      try {
        payload.visitorEntry_Gatepass = generateGatePass(true);
      } catch (e) {
        payload.visitorEntry_Gatepass =
          payload.visitorEntry_Gatepass || generateGatePass(false);
      }

      await endpoints.visitorEntry.create(payload);
      // Show inline messages instead of toast popups
      setSubmissionMessage("Appointment created successfully!");
      try {
        const gp =
          payload.visitorEntry_Gatepass ||
          entryForm.visitorEntry_Gatepass ||
          generateGatePass(false);
        setGatepassMessage(`Contact security to collect gate pass: ${gp}`);
      } catch (e) {
        setGatepassMessage("Contact security to collect gate pass.");
      }

      // Trigger notification refresh
      if (onAppointmentAdded) {
        onAppointmentAdded();
      }

      setVisitorForm({
        visitor_Name: "",
        visitor_mobile: "",
        visitor_Address: "",
        visitor_CompanyName: "",
        visitor_Email: "",
        visitor_Idprooftype: "Aadhar",
        visitor_idproofno: "",
      });
      setEntryForm({
        visitorEntry_visitorId: 0,
        visitorEntry_Gatepass: "",
        visitorEntry_Vehicletype: "",
        visitorEntry_Vehicleno: "",
        visitorEntry_Date: "",
        visitorEntry_Userid: 0,
        visitorEntry_Purposeofvisit: "",
        visitorEntry_isApproval: false,
        visitorEntry_isCanteen: false,
        visitorEntry_isStay: false,
        meetingTimeFrom: "",
        meetingTimeTo: "",
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
    <div className="visitor-self-service-container">
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
      />
      <div className="visitor-self-service-header">
        <h2 className="visitor-self-service-title">Visitor Self Service</h2>
        <div className="step-indicator">Step {step} of 2</div>
      </div>

      {submissionMessage && (
        <div
          style={{
            background: "#e6f4ea",
            border: "1px solid #c6e8d0",
            color: "#155724",
            padding: "10px 14px",
            borderRadius: 8,
            margin: "12px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>{submissionMessage}</div>
          <button
            onClick={() => setSubmissionMessage(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "#155724",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {gatepassMessage && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            color: "#856404",
            padding: "10px 14px",
            borderRadius: 8,
            margin: "6px 0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>{gatepassMessage}</div>
          <button
            onClick={() => setGatepassMessage(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "#856404",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {step === 1 && (
        <section className="visitor-self-service-form-section">
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
                    backgroundColor: "white",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    marginTop: 4,
                    zIndex: 1000,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                      backgroundColor:
                        selectedVisitorId === 0 ? "#f0f9ff" : "white",
                    }}
                    onClick={() => {
                      setSelectedVisitorId(0);
                      setVisitorSearchTerm("");
                      setShowVisitorDropdown(false);
                      setCreatedVisitorId(null);
                      setStep(1);
                    }}
                  >
                    <strong>-- Create New Visitor --</strong>
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
                            borderBottom: "1px solid #eee",
                            backgroundColor:
                              selectedVisitorId === id ? "#f0f9ff" : "white",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              selectedVisitorId === id ? "#f0f9ff" : "white";
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
                          <div style={{ fontSize: 12, color: "#666" }}>
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
                          color: "#666",
                        }}
                      >
                        No visitors found
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
          <form
            onSubmit={handleVisitorSubmit}
            className="visitor-self-service-form"
          >
            <div className="form-row">
              <div className="form-group-visitor">
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
              <div className="form-group-visitor">
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
                  <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 6 }}>
                    {mobileError}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group-visitor">
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
              <div className="form-group-visitor">
                <label>Email *</label>
                <input
                  type="email"
                  name="visitor_Email"
                  value={visitorForm.visitor_Email}
                  onChange={handleVisitorChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group-visitor">
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
              <div className="form-group-visitor">
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
              <div className="form-group-visitor">
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

            <div className="form-group-visitor">
              <label>Visitor Photo</label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  width: "100%",
                }}
              >
                {!cameraActive && !capturedImage && (
                  <button
                    type="button"
                    onClick={startCamera}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer",
                      width: 220,
                      alignSelf: "flex-start",
                    }}
                  >
                    Open Camera
                  </button>
                )}

                {cameraActive && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "400px",
                        height: "300px",
                        backgroundColor: "#fff",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "3px solid #1976d2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        mirrored
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                          facingMode: "user",
                          width: 1280,
                          height: 720,
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        style={{
                          padding: "14px 20px",
                          backgroundColor: "#4caf50",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        style={{
                          padding: "14px 20px",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <div>
                      <img
                        src={capturedImage}
                        alt="Captured visitor"
                        style={{
                          width: "320px",
                          height: "240px",
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "3px solid #0b63d6",
                          boxShadow: "0 6px 12px rgba(11,99,214,0.12)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedImage(null);
                          setCapturedBlob(null);
                          startCamera();
                        }}
                        aria-label="Retake"
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: "#18a0f0",
                          border: "none",
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: 20,
                        }}
                      >
                        ⟳
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Saving..." : "Next: Visitor Entry"}
            </button>
          </form>
        </section>
      )}

      {step === 2 && (
        <section className="visitor-self-service-form-section">
          <h3 className="form-section-title">Visitor Entry Details</h3>
          <p className="info-text">Visitor ID: {createdVisitorId}</p>
          <form
            onSubmit={handleEntrySubmit}
            className="visitor-self-service-form"
          >
            <div className="form-row">
              <div className="form-group-visitor">
                <label>Gate Pass *</label>
                <input
                  type="text"
                  name="visitorEntry_Gatepass"
                  value={entryForm.visitorEntry_Gatepass}
                  onChange={handleEntryChange}
                  required
                  className="form-input"
                  disabled
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                />
              </div>
              <div className="form-group-visitor">
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
              <div className="form-group-visitor">
                <label>Vehicle No</label>
                <input
                  type="text"
                  name="visitorEntry_Vehicleno"
                  value={entryForm.visitorEntry_Vehicleno}
                  onChange={handleEntryChange}
                  className="form-input"
                />
              </div>
              <div className="form-group-visitor" ref={userDropdownRef}>
                <label>Employee *</label>
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setShowUserDropdownLocal(true);
                  }}
                  onFocus={() => setShowUserDropdownLocal(true)}
                  className="form-input"
                  autoComplete="off"
                />
                {showUserDropdownLocal && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: 300,
                      overflowY: "auto",
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      marginTop: 4,
                      zIndex: 1000,
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    {users.length === 0 ? (
                      <div
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          color: "#666",
                        }}
                      >
                        No users found
                      </div>
                    ) : (
                      users
                        .filter((u) => {
                          const name =
                            u.userName ||
                            u.name ||
                            u.fullName ||
                            u.username ||
                            u.user_Name ||
                            "";
                          return name
                            .toLowerCase()
                            .includes(userSearchTerm.toLowerCase());
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
                          return (
                            <div
                              key={id}
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                borderBottom: "1px solid #eee",
                                backgroundColor:
                                  entryForm.visitorEntry_Userid === id
                                    ? "#f0f9ff"
                                    : "white",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#f9fafb";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  entryForm.visitorEntry_Userid === id
                                    ? "#f0f9ff"
                                    : "white";
                              }}
                              onClick={() => {
                                setEntryForm((prev) => ({
                                  ...prev,
                                  visitorEntry_Userid: id,
                                }));
                                setUserSearchTerm(name);
                                setShowUserDropdownLocal(false);
                              }}
                            >
                              {name}
                            </div>
                          );
                        })
                    )}
                    {users.filter((u) => {
                      const name =
                        u.userName ||
                        u.name ||
                        u.fullName ||
                        u.username ||
                        u.user_Name ||
                        "";
                      return name
                        .toLowerCase()
                        .includes(userSearchTerm.toLowerCase());
                    }).length === 0 &&
                      userSearchTerm && (
                        <div
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            color: "#666",
                          }}
                        >
                          No matching employees found
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group-visitor">
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
              <div className="form-group-visitor">
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
            </div>

            <div className="form-row">
              <div className="form-group-visitor">
                <label>Meeting Time From</label>
                <input
                  type="time"
                  name="meetingTimeFrom"
                  value={entryForm.meetingTimeFrom}
                  onChange={handleEntryChange}
                  className="form-input"
                />
              </div>
              <div className="form-group-visitor">
                <label>Meeting Time To</label>
                <input
                  type="time"
                  name="meetingTimeTo"
                  value={entryForm.meetingTimeTo}
                  onChange={handleEntryChange}
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
                {loading ? "Submitting..." : "Submit Appointment"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default VisitorSelfService;
