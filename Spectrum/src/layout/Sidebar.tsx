import "./Sidebar.css";
import logo from "../assets/vms logo.png";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

interface SidebarProps {
  onNavigate?: (component: string) => void;
  onNotificationClick?: () => void;
  unreadCount?: number;
}

function Sidebar({
  onNavigate,
  onNotificationClick,
  unreadCount,
}: SidebarProps) {
  const { userRole } = useAuth();
  const [mastersOpen, setMastersOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("dashboard");

  const handleMastersClick = () => {
    setMastersOpen(!mastersOpen);
  };

  const handleApplicationClick = () => {
    setApplicationOpen(!applicationOpen);
  };

  const handleReportClick = () => {
    setReportOpen(!reportOpen);
  };

  const handleNavigate = (component: string) => {
    setSelectedItem(component);
    if (onNavigate) onNavigate(component);
  };

  return (
    <aside className="vms-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-top">
          <img src={logo} alt="VMS Logo" className="sidebar-logo" />
        </div>
        {/* theme toggle removed from sidebar; use Topbar to change theme */}
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard - always visible */}
        <div
          className={`nav-item ${selectedItem === "dashboard" ? "active" : ""}`}
          onClick={() => handleNavigate("dashboard")}
        >
          <svg
            className="nav-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Dashboard</span>
        </div>

        {/* Notification - visible to all roles */}
        <div
          className={`nav-item ${
            selectedItem === "notification" ? "active" : ""
          }`}
          onClick={() => {
            setSelectedItem("notification");
            if (onNotificationClick) onNotificationClick();
          }}
        >
          <svg
            className="nav-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span>Notification</span>
          {unreadCount && unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>

        {userRole === "admin" && (
          <>
            {/* Masters dropdown */}
            <div>
              <div
                className="nav-item nav-item-dropdown"
                onClick={handleMastersClick}
              >
                <svg
                  className="nav-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Masters</span>
                <svg
                  className="dropdown-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    marginLeft: "auto",
                    transform: mastersOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {mastersOpen && (
                <div className="dropdown-menu">
                  <div
                    className={`dropdown-item ${
                      selectedItem === "rolemaster" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("rolemaster")}
                  >
                    {/* Roles icon */}
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Roles
                  </div>
                  <div
                    className={`dropdown-item ${
                      selectedItem === "departmentmaster" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("departmentmaster")}
                  >
                    {/* Departments icon */}
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 21h18"></path>
                      <path d="M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14"></path>
                      <path d="M12 3v4"></path>
                    </svg>
                    Departments
                  </div>
                  <div
                    className={`dropdown-item ${
                      selectedItem === "usermaster" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("usermaster")}
                  >
                    {/* Employees icon */}
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M4 21v-2a4 4 0 0 1 3-3.87"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Employees
                  </div>
                  <div
                    className={`dropdown-item ${
                      selectedItem === "vendormaster" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("vendormaster")}
                  >
                    {/* Vendors icon */}
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 7h18"></path>
                      <path d="M5 7l1.5 9.5A2 2 0 0 0 8.5 19h7a2 2 0 0 0 2-2l1.5-9.5"></path>
                      <path d="M16 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
                    </svg>
                    Vendors
                  </div>
                  <div
                    className={`dropdown-item ${
                      selectedItem === "locationmaster" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("locationmaster")}
                  >
                    {/* Locations icon */}
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Locations
                  </div>
                </div>
              )}
            </div>

            {/* Application */}
            <div>
              <div
                className="nav-item nav-item-dropdown"
                onClick={handleApplicationClick}
              >
                <svg
                  className="nav-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Application</span>
                <svg
                  className="dropdown-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    marginLeft: "auto",
                    transform: applicationOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {applicationOpen && (
                <div className="dropdown-menu">
                  <div
                    className={`dropdown-item ${
                      selectedItem === "visitorentryapproval" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("visitorentryapproval")}
                  >
                    {/* Approval List icon */}
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: 8 }}
                    >
                      <path d="M9 11l2 2 4-4"></path>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    Approval List
                  </div>
                  <div
                    className={`dropdown-item ${
                      selectedItem === "visitor" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("visitor")}
                  >
                    {/* Visitor list icon */}
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: 8 }}
                    >
                      <circle cx="12" cy="7" r="4"></circle>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    </svg>
                    Visitors
                  </div>
                  <div
                    className={`dropdown-item ${
                      selectedItem === "preappointment" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("preappointment")}
                  >
                    {/* Preappointment icon */}
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: 8 }}
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                    </svg>
                    Pre-appointment
                  </div>
                </div>
              )}
            </div>

            {/* Report */}
            <div>
              <div
                className="nav-item nav-item-dropdown"
                onClick={handleReportClick}
              >
                <svg
                  className="nav-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>Report</span>
                <svg
                  className="dropdown-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    marginLeft: "auto",
                    transform: reportOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {reportOpen && (
                <div className="dropdown-menu">
                  <div
                    className={`dropdown-item ${
                      selectedItem === "inoutreport" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("inoutreport")}
                  >
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: 8 }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    In/Out Report
                  </div>
                  <div
                    className={`dropdown-item ${
                      selectedItem === "parcelreport" ? "active" : ""
                    }`}
                    onClick={() => handleNavigate("parcelreport")}
                  >
                    <svg
                      className="item-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: 8 }}
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    Parcel Report
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {(userRole === "security" || userRole === "security guard") && (
          <>
            {/* Security role - Application dropdown with Appointment */}
            <div
              className="nav-item nav-item-dropdown"
              onClick={handleApplicationClick}
            >
              <svg
                className="nav-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Application</span>
              <svg
                className="dropdown-arrow"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  marginLeft: "auto",
                  transform: applicationOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {applicationOpen && (
              <div className="dropdown-menu">
                <div
                  className={`dropdown-item ${
                    selectedItem === "securityappointment" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("securityappointment")}
                >
                  {/* Appointment icon */}
                  <svg
                    className="item-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: 8 }}
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Appointment
                </div>
                <div
                  className={`dropdown-item ${
                    selectedItem === "securityapprovalview" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("securityapprovalview")}
                >
                  {/* Approval List icon */}
                  <svg
                    className="item-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: 8 }}
                  >
                    <path d="M9 11l2 2 4-4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Approval List
                </div>
                <div
                  className={`dropdown-item ${
                    selectedItem === "vendorgetpass" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("vendorgetpass")}
                >
                  {/* Vendor Gatepass icon */}
                  <svg
                    className="item-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: 8 }}
                  >
                    <path d="M3 7h18"></path>
                    <path d="M5 7l1.5 9.5A2 2 0 0 0 8.5 19h7a2 2 0 0 0 2-2L19 7"></path>
                    <path d="M8 21h8"></path>
                  </svg>
                  Vendor Gatepass
                </div>
                <div
                  className={`dropdown-item ${
                    selectedItem === "securityparcelentry" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("securityparcelentry")}
                >
                  {/* Parcel Entry icon */}
                  <svg
                    className="item-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: 8 }}
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  Parcel
                </div>
                <div
                  className={`dropdown-item ${
                    selectedItem === "barcodescanner" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("barcodescanner")}
                >
                  {/* Barcode Scanner icon */}
                  <svg
                    className="item-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: 8 }}
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
                    <line x1="5" y1="8" x2="5" y2="16"></line>
                    <line x1="8" y1="8" x2="8" y2="16"></line>
                    <line x1="11" y1="8" x2="11" y2="16"></line>
                    <line x1="14" y1="8" x2="14" y2="16"></line>
                    <line x1="17" y1="8" x2="17" y2="16"></line>
                    <line x1="19" y1="8" x2="19" y2="16"></line>
                  </svg>
                  Barcode Scanner
                </div>
              </div>
            )}
          </>
        )}

        {userRole === "employee" && (
          <>
            {/* Employee role - Application dropdown */}
            <div
              className="nav-item nav-item-dropdown"
              onClick={handleApplicationClick}
            >
              <svg
                className="nav-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Application</span>
              <svg
                className="dropdown-arrow"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  marginLeft: "auto",
                  transform: applicationOpen
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {applicationOpen && (
              <div className="dropdown-menu">
                <div
                  className={`dropdown-item ${
                    selectedItem === "visitorentryapprovalemp" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("visitorentryapprovalemp")}
                >
                  {/* Approval List icon */}
                  <svg
                    className="item-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: 8 }}
                  >
                    <path d="M9 11l2 2 4-4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Visitor Approval
                </div>
                <div
                  className={`dropdown-item ${
                    selectedItem === "preappointment" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("preappointment")}
                >
                  {/* Preappointment icon */}
                  <svg
                    className="item-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ marginRight: 8 }}
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                  </svg>
                  Pre-appointment
                </div>
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
