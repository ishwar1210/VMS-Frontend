import { useState, useEffect } from "react";
import { endpoints } from "../api/endpoint";
import * as XLSX from "xlsx";
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


function Vendorgetpass() {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [] =
    useState<string>("No file chosen");
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
        // Log all keys in the item to see what properties exist
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

      // Additional warning if any vendor has ID 0
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
        IdProofType: "",
        IdProofNo: "",
        Mobile: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VendorEmployees");

    ws["!cols"] = [{ width: 20 }, { width: 15 }, { width: 20 }, { width: 15 }];

    XLSX.writeFile(wb, "VendorEmployeeTemplate.xlsx");
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

      // Apply date formatting consistently
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

      await endpoints.vendorAppointment.create(appointmentData);
      setMessage({
        type: "success",
        text: "Vendor gatepass created successfully!",
      });

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
    </div>
  );
}

export default Vendorgetpass;
