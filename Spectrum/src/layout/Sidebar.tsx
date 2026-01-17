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
  const { userRole, userComponents } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("dashboard");

  // Check if user has access to a component
  const hasAccess = (componentKey: string): boolean => {
    // Admin has access to everything
    if (userRole === "admin") return true;
    // Check if user has this component assigned
    return userComponents.includes(componentKey);
  };

  // Check if user has any component access
  const hasAnyAccess = (): boolean => {
    if (userRole === "admin") return true;
    return userComponents && userComponents.length > 0;
  };

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
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
        {/* Dashboard */}
        {hasAnyAccess() &&
          (hasAccess("ADMIN_DASHBOARD") || hasAccess("SECURITY_DASHBOARD")) && (
            <div
              className={`nav-item ${
                selectedItem === "dashboard" ? "active" : ""
              }`}
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
          )}

        {/* Notification - visible to all roles with access */}
        {hasAnyAccess() && (
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
        )}

        {userRole === "admin" && (
          <>
            {/* Masters dropdown */}
            <div>
              <div
                className="nav-item nav-item-dropdown"
                onClick={() => toggleSection("masters")}
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
                    transform:
                      openSection === "masters"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {openSection === "masters" && (
                <div className="dropdown-menu">
                  {hasAccess("ROLE_MASTER") && (
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
                  )}
                  {hasAccess("DEPT_MASTER") && (
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
                  )}
                  {hasAccess("USER_MASTER") && (
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
                  )}
                  {hasAccess("VENDOR_MASTER") && (
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
                  )}
                  {hasAccess("LOCATION_MASTER") && (
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
                  )}
                  {hasAccess("COMPONENT_ACCESS") && (
                    <div
                      className={`dropdown-item ${
                        selectedItem === "componentaccess" ? "active" : ""
                      }`}
                      onClick={() => handleNavigate("componentaccess")}
                    >
                      {/* Component Access icon */}
                      <svg
                        className="item-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Component Access
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Application */}
            <div>
              <div
                className="nav-item nav-item-dropdown"
                onClick={() => toggleSection("application")}
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
                    transform:
                      openSection === "application"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {openSection === "application" && (
                <div className="dropdown-menu">
                  {hasAccess("SECURITY_APPROVAL") && (
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
                  )}
                  {hasAccess("VISITOR_ENTRY") && (
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
                  )}
                  {hasAccess("VISITOR_QR") && (
                    <div
                      className={`dropdown-item ${
                        selectedItem === "visitorqr" ? "active" : ""
                      }`}
                      onClick={() => handleNavigate("visitorqr")}
                    >
                      {/* QR Code icon */}
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
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      Visitor QR Code
                    </div>
                  )}
                  {hasAccess("PREAPPOINTMENT") && (
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
                  )}
                </div>
              )}
            </div>

            {/* Report */}
            <div>
              <div
                className="nav-item nav-item-dropdown"
                onClick={() => toggleSection("report")}
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
                    transform:
                      openSection === "report"
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {openSection === "report" && (
                <div className="dropdown-menu">
                  {hasAccess("INOUT_REPORT") && (
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
                  )}
                  {hasAccess("PARCEL_REPORT") && (
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
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {userRole !== "admin" && (
          <>
            {/* Non-admin users - show all menus but filter by access */}

            {/* Masters dropdown */}
            {(hasAccess("ROLE_MASTER") ||
              hasAccess("DEPT_MASTER") ||
              hasAccess("USER_MASTER") ||
              hasAccess("VENDOR_MASTER") ||
              hasAccess("LOCATION_MASTER") ||
              hasAccess("COMPONENT_ACCESS")) && (
              <div>
                <div
                  className="nav-item nav-item-dropdown"
                  onClick={() => toggleSection("masters")}
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
                      transform:
                        openSection === "masters"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {openSection === "masters" && (
                  <div className="dropdown-menu">
                    {hasAccess("ROLE_MASTER") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "rolemaster" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("rolemaster")}
                      >
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
                    )}
                    {hasAccess("DEPT_MASTER") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "departmentmaster" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("departmentmaster")}
                      >
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
                    )}
                    {hasAccess("USER_MASTER") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "usermaster" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("usermaster")}
                      >
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
                    )}
                    {hasAccess("VENDOR_MASTER") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "vendormaster" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("vendormaster")}
                      >
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
                    )}
                    {hasAccess("LOCATION_MASTER") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "locationmaster" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("locationmaster")}
                      >
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
                    )}
                    {hasAccess("COMPONENT_ACCESS") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "componentaccess" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("componentaccess")}
                      >
                        <svg
                          className="item-icon"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Component Access
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Application dropdown */}
            {(hasAccess("SECURITY_APPROVAL") ||
              hasAccess("VISITOR_ENTRY") ||
              hasAccess("VISITOR_QR") ||
              hasAccess("PREAPPOINTMENT") ||
              hasAccess("SECURITY_APPOINTMENT") ||
              hasAccess("VISITOR_APPROVAL_ADMIN") ||
              hasAccess("VENDOR_GETPASS") ||
              hasAccess("SECURITY_PARCEL") ||
              hasAccess("BARCODE_SCANNER") ||
              hasAccess("VISITOR_APPROVAL_EMP")) && (
              <div>
                <div
                  className="nav-item nav-item-dropdown"
                  onClick={() => toggleSection("application")}
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
                      transform:
                        openSection === "application"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {openSection === "application" && (
                  <div className="dropdown-menu">
                    {hasAccess("SECURITY_APPOINTMENT") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "securityappointment" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("securityappointment")}
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
                    )}
                    {hasAccess("VISITOR_APPROVAL_ADMIN") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "visitorentryapproval"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleNavigate("visitorentryapproval")}
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
                          <path d="M9 11l2 2 4-4"></path>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11"></path>
                        </svg>
                        Approval List
                      </div>
                    )}
                    {hasAccess("SECURITY_APPROVAL") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "securityapprovalview"
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleNavigate("securityapprovalview")}
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
                          <path d="M9 11l2 2 4-4"></path>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11"></path>
                        </svg>
                        Security Approval View
                      </div>
                    )}
                    {hasAccess("VISITOR_APPROVAL_EMP") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "visitorentryapprovalemp"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleNavigate("visitorentryapprovalemp")
                        }
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
                          <path d="M9 11l2 2 4-4"></path>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11"></path>
                        </svg>
                        Visitor Approval
                      </div>
                    )}
                    {hasAccess("VISITOR_ENTRY") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "visitor" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("visitor")}
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
                          <circle cx="12" cy="7" r="4"></circle>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        </svg>
                        Visitors
                      </div>
                    )}
                    {hasAccess("VISITOR_QR") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "visitorqr" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("visitorqr")}
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
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        Visitor QR Code
                      </div>
                    )}
                    {hasAccess("PREAPPOINTMENT") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "preappointment" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("preappointment")}
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
                    )}
                    {hasAccess("VENDOR_GETPASS") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "vendorgetpass" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("vendorgetpass")}
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
                          <path d="M3 7h18"></path>
                          <path d="M5 7l1.5 9.5A2 2 0 0 0 8.5 19h7a2 2 0 0 0 2-2L19 7"></path>
                          <path d="M8 21h8"></path>
                        </svg>
                        Vendor Gatepass
                      </div>
                    )}
                    {hasAccess("SECURITY_PARCEL") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "securityparcelentry" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("securityparcelentry")}
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
                        Parcel
                      </div>
                    )}
                    {hasAccess("BARCODE_SCANNER") && (
                      <div
                        className={`dropdown-item ${
                          selectedItem === "barcodescanner" ? "active" : ""
                        }`}
                        onClick={() => handleNavigate("barcodescanner")}
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
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="16"
                            rx="2"
                            ry="2"
                          ></rect>
                          <line x1="5" y1="8" x2="5" y2="16"></line>
                          <line x1="8" y1="8" x2="8" y2="16"></line>
                          <line x1="11" y1="8" x2="11" y2="16"></line>
                          <line x1="14" y1="8" x2="14" y2="16"></line>
                          <line x1="17" y1="8" x2="17" y2="16"></line>
                          <line x1="19" y1="8" x2="19" y2="16"></line>
                        </svg>
                        Barcode Scanner
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Report dropdown */}
            {(hasAccess("INOUT_REPORT") || hasAccess("PARCEL_REPORT")) && (
              <div>
                <div
                  className="nav-item nav-item-dropdown"
                  onClick={() => toggleSection("report")}
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
                      transform:
                        openSection === "report"
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {openSection === "report" && (
                  <div className="dropdown-menu">
                    {hasAccess("INOUT_REPORT") && (
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
                    )}
                    {hasAccess("PARCEL_REPORT") && (
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
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
