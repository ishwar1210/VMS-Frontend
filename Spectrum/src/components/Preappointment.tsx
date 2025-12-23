import { useState, useEffect, useRef } from "react";
import { endpoints } from "../api/endpoint";
import "./Preappointment.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Webcam from "react-webcam";

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
  const [selectedVisitorId, setSelectedVisitorId] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [visitorSearchTerm, setVisitorSearchTerm] = useState("");
  const [showVisitorDropdown, setShowVisitorDropdown] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const webcamRef = useRef<any>(null);

  const generateGatePass = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `GP${timestamp}${random}`;
  };

  const getLocalDateTimeForInput = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

    // Cleanup camera on unmount
    return () => {
      try {
        const videoEl = webcamRef.current?.video as
          | HTMLVideoElement
          | undefined;
        const stream = videoEl?.srcObject as MediaStream | undefined;
        if (stream) stream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        // ignore
      }
    };
  }, []);

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
      if (!payload.visitorEntry_Intime) payload.visitorEntry_Intime = null;
      await endpoints.visitorEntry.create(payload);
      toast.success("Preappointment created successfully!");
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
      setSelectedVisitorId(0);
      setVisitorSearchTerm("");
      setCapturedImage(null);
      setCapturedBlob(null);
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
                                visitor_Purposeofvisit:
                                  v.visitor_Purposeofvisit || v.purpose || "",
                                visitor_Idprooftype:
                                  v.visitor_Idprooftype ||
                                  v.idProofType ||
                                  "Aadhar",
                                visitor_idproofno:
                                  v.visitor_idproofno || v.idProofNo || "",
                                visitor_MeetingDate:
                                  v.visitor_MeetingDate || v.meetingDate || "",
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
                <label>Registered Date *</label>
                <input
                  type="datetime-local"
                  name="visitor_MeetingDate"
                  value={visitorForm.visitor_MeetingDate}
                  onChange={handleVisitorChange}
                  min={getLocalDateTimeForInput()}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
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
                          width: "100%",
                          maxWidth: 640,
                          height: 340,
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
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={capturePhoto}
                          style={{
                            flex: "0 0 72%",
                            maxWidth: 560,
                            padding: "12px 20px",
                            backgroundColor: "#0b63d6",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 4px 8px rgba(11,99,214,0.2)",
                            marginRight: 8,
                          }}
                        >
                        Capture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setCapturedImage(null);
                            setCapturedBlob(null);
                          }}
                          aria-label="Cancel"
                          style={{
                            width: 44,
                            height: 44,
                            backgroundColor: "#18a0f0",
                            border: "none",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          ⟳
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
                          disabled
                          style={{
                            padding: "12px 28px",
                            backgroundColor: "#0b63d6",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: "default",
                          }}
                        >
                          Captured
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedImage(null);
                            setCapturedBlob(null);
                            // reopen camera for retake
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
