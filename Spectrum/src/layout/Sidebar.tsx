import "./Sidebar.css";
import logo from "../assets/vms logo.png";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface SidebarProps {
  onNavigate?: (component: string) => void;
}

function Sidebar({ onNavigate }: SidebarProps) {
  const { userRole } = useAuth();
  const { theme } = useTheme();
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
    <aside className={`vms-sidebar ${theme === "light" ? "light" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-top">
          <img src={logo} alt="VMS Logo" className="sidebar-logo" />
        </div>
        {/* theme toggle removed from sidebar; use Topbar to change theme */}
      </div>

      <nav className="sidebar-nav">
        {/* Menu based on role */}
        <div className="nav-item" onClick={() => handleNavigate("dashboard")}>
          Dashboard
        </div>
        {userRole === "admin" && (
          <>
            <div>
              <div
                className="nav-item nav-item-dropdown"
                onClick={handleMastersClick}
              >
                Masters
                <svg
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
                    Roles
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleNavigate("departmentmaster")}
                  >
                    Departments
                  </div>
                </div>
              )}
            </div>
            <div
              className="nav-item"
              onClick={() => handleNavigate("application")}
            >
              Application
            </div>
            <div className="nav-item" onClick={() => handleNavigate("report")}>
              Report
            </div>
          </>
        )}
        {(userRole === "security" || userRole === "security guard") && (
          <>
            <div
              className="nav-item"
              onClick={() => handleNavigate("application")}
            >
              Application
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
