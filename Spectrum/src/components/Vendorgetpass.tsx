import { useState, useEffect } from "react";
import { endpoints } from "../api/endpoint";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Vendorgetpass.css";

interface VendorData {
  vendorId: number;
  vendorName: string;
}

interface UserData {
  userId: number;
  userName: string;
  fullName?: string;
}

interface VendorAppointment {
  vendorA_VendorID: number;
  vendorA_Getpass: string;
  vendorA_FromDate: string;
  vendorA_ToDate: string;
  vendorA_VehicleNO: string;
  vendorA_IdProofType: string;
  vendorA_IdProofNo: string;
  vendorA_UserId: number;
}

interface VendorAppointmentData {
  vendorAID: number;
  vendorA_VendorID: number;
  vendorA_Getpass: string;
  vendorA_FromDate: string;
  vendorA_ToDate: string;
}

interface VendorEmployee {
  vendorEmp_VendorID: number;
  vendorEmp_Name: string;
  vendorEmp_IDProofType: string;
  vendorEmp_IDProofNo: string;
  vendorEmp_mobile: string;
  vendorEmp_VenderAID: number;
}

interface ExcelRow {
  Name: string;
  DocumentType: string;
  IdProofNo: string;
  MobileNo: string;
}

interface UploadedEmployee {
  vendorEmp_Name: string;
  vendorEmp_IDProofType: string;
  vendorEmp_IDProofNo: string;
  vendorEmp_mobile: string;
}

function Vendorgetpass() {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [vendorAppointments, setVendorAppointments] = useState<
    VendorAppointmentData[]
  >([]);
  const [selectedVendorAID, setSelectedVendorAID] = useState<string>("");
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [excelFileName, setExcelFileName] = useState<string>("No file chosen");
  const [savedVendorId, setSavedVendorId] = useState<number>(0);
  const [uploadedEmployees, setUploadedEmployees] = useState<
    UploadedEmployee[]
  >([]);
  const [currentGatepass, setCurrentGatepass] = useState<string>("");
  const [currentVendorName, setCurrentVendorName] = useState<string>("");
  const [currentFromDate, setCurrentFromDate] = useState<string>("");
  const [currentToDate, setCurrentToDate] = useState<string>("");
  const [currentDocType, setCurrentDocType] = useState<string>("");
  const [currentIdProof, setCurrentIdProof] = useState<string>("");
  const [currentVehicleNo, setCurrentVehicleNo] = useState<string>("");
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: "",
    userId: "",
    documentType: "",
    idProofNumber: "",
    fromDate: "",
    toDate: "",
    vehicleNo: "",
    gatepass: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const documentTypes = [
    "Aadhar Card",
    "PAN Card",
    "Driving License",
    "Voter ID",
    "Passport",
  ];

  useEffect(() => {
    fetchVendors();
    fetchUsers();
    fetchVendorAppointments();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await endpoints.vendor.getAll();
      console.log("Full API Response:", response);

      const data = response?.data || [];
      console.log("Response data:", data);

      let vendorsList =
        data?.$values || data?.data || data?.vendors || data || [];

      console.log("Raw vendor API response:", data);
      console.log("Vendors list:", vendorsList);

      const normalizedVendors = (
        Array.isArray(vendorsList) ? vendorsList : []
      ).map((item: any) => {
        console.log("All keys in vendor item:", Object.keys(item));
        console.log("Full vendor item:", JSON.stringify(item, null, 2));

        const vendorId =
          item.vendorId ||
          item.VendorId ||
          item.id ||
          item.Id ||
          item.ID ||
          item.vendor_Id ||
          item.vendor_id ||
          item.VendorID ||
          item.vendorID ||
          item.Vendor_Id ||
          item.Vendor_ID ||
          0;

        console.log("Original vendor item:", item);
        console.log("Extracted vendorId:", vendorId);

        return {
          vendorId: vendorId,
          vendorName:
            item.vendorName ||
            item.VendorName ||
            item.vendor_Name ||
            item.vendor_name ||
            item.Vendor_Name ||
            "",
          company:
            item.company ||
            item.Company ||
            item.vendor_Company ||
            item.vendor_company ||
            "",
        };
      });

      console.log("Normalized vendors:", normalizedVendors);

      const hasZeroId = normalizedVendors.some((v) => v.vendorId === 0);
      if (hasZeroId) {
        console.warn("⚠️ WARNING: Some vendors have vendorId = 0!");
        console.warn("Please check the API response structure above.");
      }

      setVendors(normalizedVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setMessage({ type: "error", text: "Failed to load vendors" });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await endpoints.user.getAll();
      const data = response?.data || [];
      let usersList = data?.$values || data?.data || data?.users || data || [];

      const normalizedUsers = (Array.isArray(usersList) ? usersList : []).map(
        (item: any) => ({
          userId: item.userId || item.UserId || item.id || item.Id || 0,
          userName: item.userName || item.UserName || item.username || "",
          fullName:
            item.fullName || item.FullName || item.name || item.Name || "",
        })
      );

      setUsers(normalizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({ type: "error", text: "Failed to load users" });
    }
  };

  const fetchVendorAppointments = async () => {
    try {
      const response = await endpoints.vendorAppointment.getAll();
      const data = response?.data || [];
      let appointmentsList = data?.$values || data?.data || data || [];

      // Log raw response for debugging if unexpected shape
      if (!Array.isArray(appointmentsList)) {
        console.debug("Vendor appointments raw response:", data);
      }

      const normalizedAppointments = (
        Array.isArray(appointmentsList) ? appointmentsList : []
      ).map((item: any) => ({
        // Try many possible property names for the appointment ID
        vendorAID:
          item.vendorAID ||
          item.VendorAID ||
          item.VendorAId ||
          item.vendorAId ||
          item.vendorA_ID ||
          item.VendorA_ID ||
          item.VendorA_Id ||
          item.vendorA_Id ||
          item.id ||
          0,
        vendorA_VendorID:
          item.vendorA_VendorID ||
          item.VendorA_VendorID ||
          item.Vendor_Id ||
          item.Vendor_Id ||
          item.vendorId ||
          0,
        vendorA_Getpass:
          item.vendorA_Getpass ||
          item.VendorA_Getpass ||
          item.Getpass ||
          item.getpass ||
          "",
        vendorA_FromDate:
          item.vendorA_FromDate ||
          item.VendorA_FromDate ||
          item.FromDate ||
          item.fromDate ||
          "",
        vendorA_ToDate:
          item.vendorA_ToDate ||
          item.VendorA_ToDate ||
          item.ToDate ||
          item.toDate ||
          "",
      }));

      // Sort by vendorAID descending (latest first)
      normalizedAppointments.sort((a, b) => b.vendorAID - a.vendorAID);

      setVendorAppointments(normalizedAppointments);
      return normalizedAppointments;
    } catch (error) {
      console.error("Error fetching vendor appointments:", error);
      return [];
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateGatepass = () => {
    return `GP${Date.now()}`;
  };

  const formatDateTimeLocal = (dt: string) => {
    if (!dt) return dt;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dt)) return dt;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) return `${dt}:00`;
    return dt;
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        Name: "",
        DocumentType: "",
        IdProofNo: "",
        MobileNo: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VendorEmployees");

    ws["!cols"] = [{ width: 20 }, { width: 15 }, { width: 20 }, { width: 15 }];

    XLSX.writeFile(wb, "VendorEmployeeTemplate.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);

    if (!selectedVendorAID) {
      setMessage({
        type: "error",
        text: "Please select Vendor Appointment ID first",
      });
      return;
    }

    const parsedVendorAID = parseInt(selectedVendorAID);
    if (!parsedVendorAID || parsedVendorAID <= 0) {
      setMessage({
        type: "error",
        text: "Selected Vendor Appointment ID is invalid.",
      });
      console.error(
        "Invalid selectedVendorAID when uploading:",
        selectedVendorAID,
        parsedVendorAID
      );
      setLoading(false);
      return;
    }

    if (!savedVendorId) {
      setMessage({ type: "error", text: "Please save the gatepass first" });
      return;
    }

    try {
      setLoading(true);
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

          let successCount = 0;
          let failCount = 0;
          const uploadedEmps: UploadedEmployee[] = [];

          for (const row of jsonData) {
            try {
              // Normalize and coerce types to what backend expects
              const name = row.Name != null ? String(row.Name).trim() : "";
              const idProofType =
                row.DocumentType != null ? String(row.DocumentType).trim() : "";
              const idProofNo =
                row.IdProofNo != null ? String(row.IdProofNo).trim() : "";
              const mobile =
                row.MobileNo != null ? String(row.MobileNo).trim() : "";

              const vendorEmpPayload: VendorEmployee = {
                vendorEmp_VendorID: Number(savedVendorId) || 0,
                vendorEmp_Name: name,
                vendorEmp_IDProofType: idProofType,
                vendorEmp_IDProofNo: idProofNo,
                vendorEmp_mobile: mobile,
                vendorEmp_VenderAID: Number(parsedVendorAID) || 0,
              };

              console.log("Posting vendor employee payload:", vendorEmpPayload);

              try {
                const resp = await endpoints.vendorEmployee.create(
                  vendorEmpPayload
                );
                console.log(
                  "Vendor employee create response:",
                  resp?.status,
                  resp?.data
                );

                // Store successfully uploaded employee
                uploadedEmps.push({
                  vendorEmp_Name: name,
                  vendorEmp_IDProofType: idProofType,
                  vendorEmp_IDProofNo: idProofNo,
                  vendorEmp_mobile: mobile,
                });

                successCount++;
              } catch (postError: any) {
                // Log detailed error coming from server
                console.error(
                  "Create API error for row:",
                  row,
                  postError?.response?.status,
                  postError?.response?.data || postError.message || postError
                );
                failCount++;
              }
            } catch (error) {
              console.error("Error processing row before post:", row, error);
              failCount++;
            }
          }

          // Save uploaded employees for PDF generation
          setUploadedEmployees(uploadedEmps);
          setShowDownloadButton(true);

          setMessage({
            type: "success",
            text: `Upload complete! Success: ${successCount}, Failed: ${failCount}. You can now download PDF.`,
          });
          setExcelFileName("No file chosen");
          if (e.target) e.target.value = "";
        } catch (error) {
          console.error("Error processing Excel:", error);
          setMessage({ type: "error", text: "Error processing Excel file" });
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setMessage({ type: "error", text: "Error reading file" });
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Vendor Appointment", 14, 20);

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);

    // Vendor Details Section
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`GatePassId: `, 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text(currentGatepass, 45, 35);

    // Row 1: Vendor Name, From Date, To Date
    doc.setFont("helvetica", "bold");
    doc.text("Vendor Name:", 14, 45);
    doc.setFont("helvetica", "normal");
    doc.text(currentVendorName, 45, 45);

    doc.setFont("helvetica", "bold");
    doc.text("From Date:", 100, 45);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(currentFromDate).toLocaleString(), 130, 45);

    doc.setFont("helvetica", "bold");
    doc.text("To Date:", 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(currentToDate).toLocaleString(), 45, 55);

    // Row 2: Document Type, Id Proof No, Vehicle Number
    doc.setFont("helvetica", "bold");
    doc.text("Document Type:", 14, 65);
    doc.setFont("helvetica", "normal");
    doc.text(currentDocType, 50, 65);

    doc.setFont("helvetica", "bold");
    doc.text("Id Proof No:", 100, 65);
    doc.setFont("helvetica", "normal");
    doc.text(currentIdProof, 130, 65);

    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Number:", 14, 75);
    doc.setFont("helvetica", "normal");
    doc.text(currentVehicleNo || "", 50, 75);

    // Vendor Team Member Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Vendor Team Member", 14, 90);

    // Table
    const tableData = uploadedEmployees.map((emp) => [
      emp.vendorEmp_Name,
      emp.vendorEmp_IDProofType,
      emp.vendorEmp_IDProofNo,
      emp.vendorEmp_mobile,
    ]);

    autoTable(doc, {
      startY: 95,
      head: [["Name", "Document Type", "Proof No", "Mobile No"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "left",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 45 },
        2: { cellWidth: 55 },
        3: { cellWidth: 40 },
      },
    });

    // Save the PDF
    doc.save(`Vendor_Appointment_${currentGatepass}.pdf`);

    setMessage({
      type: "success",
      text: "PDF downloaded successfully!",
    });
  };

  const handleDownloadPDF = async () => {
    if (
      !formData.vendorId ||
      !formData.userId ||
      !formData.fromDate ||
      !formData.toDate
    ) {
      setMessage({
        type: "error",
        text: "Please fill all required fields first",
      });
      return;
    }

    const selectedVendor = vendors.find(
      (v) => v.vendorId.toString() === formData.vendorId
    );
    if (!selectedVendor) {
      setMessage({
        type: "error",
        text: "Selected vendor is invalid. Please select a different vendor.",
      });
      return;
    }

    console.log("PDF Download - Selected vendor:", selectedVendor);

    try {
      setLoading(true);

      const gatepassNumber = generateGatepass();
      const selectedVendorId = parseInt(formData.vendorId);

      if (!selectedVendorId || selectedVendorId === 0) {
        throw new Error(`Invalid vendor ID: ${formData.vendorId}`);
      }

      const fromDate = formatDateTimeLocal(formData.fromDate);
      const toDate = formatDateTimeLocal(formData.toDate);

      const appointmentData: VendorAppointment = {
        vendorA_VendorID: selectedVendorId,
        vendorA_Getpass: gatepassNumber,
        vendorA_FromDate: fromDate,
        vendorA_ToDate: toDate,
        vendorA_VehicleNO: formData.vehicleNo,
        vendorA_IdProofType: formData.documentType,
        vendorA_IdProofNo: formData.idProofNumber,
        vendorA_UserId: parseInt(formData.userId),
      };

      console.log(
        "PDF - Creating appointment with vendor ID:",
        selectedVendorId
      );

      const response = await endpoints.vendorAppointment.create(
        appointmentData
      );

      console.log("Appointment created response:", response);

      // Save vendor ID for later use in Excel upload
      setSavedVendorId(selectedVendorId);

      // Get the newly created appointment ID from response
      // Try a broader set of possible property names on the returned data
      const responseData: any = response?.data || response;
      const newAppointmentId =
        responseData?.vendorAID ||
        responseData?.VendorAID ||
        responseData?.vendorAId ||
        responseData?.VendorAId ||
        responseData?.vendorA_Id ||
        responseData?.VendorA_Id ||
        responseData?.vendorA_ID ||
        responseData?.VendorA_ID ||
        responseData?.vendorA_Id ||
        responseData?.vendorA_Identifier ||
        responseData?.id ||
        responseData?.ID ||
        null;

      if (newAppointmentId) {
        console.log("Setting newly created appointment ID:", newAppointmentId);
        setSelectedVendorAID(newAppointmentId.toString());
      }

      // Save gatepass details for PDF generation
      setCurrentGatepass(gatepassNumber);
      setCurrentVendorName(selectedVendor.vendorName);
      setCurrentFromDate(fromDate);
      setCurrentToDate(toDate);
      setCurrentDocType(formData.documentType);
      setCurrentIdProof(formData.idProofNumber);
      setCurrentVehicleNo(formData.vehicleNo);

      // Refresh appointments list to get latest IDs
      const updatedAppointments = await fetchVendorAppointments();

      // If we couldn't get the ID from response, try to find it from the refreshed list
      if (!newAppointmentId && updatedAppointments.length > 0) {
        // Find the latest appointment for this vendor and gatepass
        const latestAppointment = updatedAppointments.find(
          (apt) =>
            apt.vendorA_VendorID === selectedVendorId &&
            apt.vendorA_Getpass === gatepassNumber
        );

        if (latestAppointment) {
          console.log("Found appointment from list:", latestAppointment);
          setSelectedVendorAID(latestAppointment.vendorAID.toString());
        } else {
          // If still not found, use the very latest appointment for this vendor
          const vendorLatestAppointment = updatedAppointments.find(
            (apt) => apt.vendorA_VendorID === selectedVendorId
          );
          if (vendorLatestAppointment) {
            console.log(
              "Using vendor's latest appointment:",
              vendorLatestAppointment
            );
            setSelectedVendorAID(vendorLatestAppointment.vendorAID.toString());
          }
        }
      }

      setMessage({
        type: "success",
        text: "Vendor gatepass created successfully! Now you can upload employee Excel file.",
      });

      // Show upload section after successful save
      setShowUploadSection(true);

      // Reset form after successful creation
      setFormData({
        vendorId: "",
        userId: "",
        documentType: "",
        idProofNumber: "",
        fromDate: "",
        toDate: "",
        vehicleNo: "",
        gatepass: "",
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      setMessage({ type: "error", text: "Error creating vendor gatepass" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-gatepass-container">
      <div className="vendor-gatepass-header">
        <h1 className="vendor-gatepass-title">Create Vendor Gatepass</h1>
        <button className="download-template-btn" onClick={downloadTemplate}>
          Download Template
        </button>
      </div>

      {message && (
        <div className={`message-box ${message.type}`}>{message.text}</div>
      )}

      <div className="vendor-gatepass-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Select Vendor</label>
            <select
              name="vendorId"
              value={formData.vendorId}
              onChange={handleInputChange}
              className="form-select"
              required
            >
              <option value="">Choose Vendor *</option>
              {vendors.map((vendor) => (
                <option key={vendor.vendorId} value={vendor.vendorId}>
                  {vendor.vendorName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select User</label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleInputChange}
              className="form-select"
              required
            >
              <option value="">Choose User *</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.fullName || user.userName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Document Type</label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              className="form-select"
              required
            >
              <option value="">Select Document Type *</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">IdProof Number</label>
            <input
              type="text"
              name="idProofNumber"
              value={formData.idProofNumber}
              onChange={handleInputChange}
              placeholder="Enter Document Number *"
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">From Date</label>
            <input
              type="datetime-local"
              name="fromDate"
              value={formData.fromDate}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">To Date</label>
            <input
              type="datetime-local"
              name="toDate"
              value={formData.toDate}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle No</label>
            <input
              type="text"
              name="vehicleNo"
              value={formData.vehicleNo}
              onChange={handleInputChange}
              placeholder="Vehicle No (e.g., MH99JK7865)"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            className="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={loading}
          >
            {loading ? "Processing..." : "Save"}
          </button>
        </div>
      </div>

      {showUploadSection && (
        <div className="upload-section">
          <h2 className="upload-section-title">Upload Vendor Employees</h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Select Vendor Appointment ID</label>
              <select
                value={selectedVendorAID}
                onChange={(e) => setSelectedVendorAID(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Choose Vendor Appointment ID *</option>
                {vendorAppointments
                  .filter((app) => app.vendorA_VendorID === savedVendorId)
                  .map((app) => (
                    <option key={app.vendorAID} value={app.vendorAID}>
                      ID: {app.vendorAID} | Gatepass: {app.vendorA_Getpass} |
                      From:{" "}
                      {new Date(app.vendorA_FromDate).toLocaleDateString()} To:{" "}
                      {new Date(app.vendorA_ToDate).toLocaleDateString()}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="upload-file-section">
            <label className="upload-label">
              Upload Excel File
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="file-input"
                disabled={!selectedVendorAID || loading}
              />
            </label>
            <span className="file-name">{excelFileName}</span>
          </div>

          {loading && (
            <div className="upload-progress">Uploading vendor employees...</div>
          )}

          {showDownloadButton && (
            <div className="download-pdf-section">
              <button className="download-pdf-final-btn" onClick={generatePDF}>
                Download PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Vendorgetpass;
