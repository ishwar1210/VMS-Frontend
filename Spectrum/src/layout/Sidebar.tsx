import "./Sidebar.css";
import logo from "../assets/vms logo.png";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

interface SidebarProps {
  onNavigate?: (component: string) => void;
}

function Sidebar({ onNavigate }: SidebarProps) {
  const { userRole } = useAuth();
  const [mastersOpen, setMastersOpen] = useState(false);

  const handleMastersClick = () => {
    setMastersOpen(!mastersOpen);
  };

  const handleNavigate = (component: string) => {
    if (onNavigate) {
      onNavigate(component);
    }
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
        <div className="nav-item" onClick={() => handleNavigate("dashboard")}>
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
                    className="dropdown-item"
                    onClick={() => handleNavigate("rolemaster")}
                  >
                    <span className="dropdown-bullet"></span>
                    Roles
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleNavigate("departmentmaster")}
                  >
                    <span className="dropdown-bullet"></span>
                    Departments
                  </div>
                </div>
              )}
            </div>

            {/* Application */}
            <div
              className="nav-item"
              onClick={() => handleNavigate("application")}
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
            </div>

            {/* Report */}
            <div className="nav-item" onClick={() => handleNavigate("report")}>
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
            </div>
          </>
        )}

        {(userRole === "security" || userRole === "security guard") && (
          <>
            {/* Security role - only Application */}
            <div
              className="nav-item"
              onClick={() => handleNavigate("application")}
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
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
