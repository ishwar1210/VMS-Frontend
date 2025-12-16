import "./App.css";
import Login from "./layout/Login";
import Sidebar from "./layout/Sidebar";
import Rolemaster from "./components/Rolemaster";
import Deparmentmaster from "./components/Deparmentmaster";
import Usermaster from "./components/Usermaster";
import Vendormaster from "./components/Vendormaster";
import Vendorgetpass from "./components/Vendorgetpass";
import Locationmaster from "./components/Locationmaster";
import Visitorentryapproval from "./components/Visitorentryapproval";
import Visitorentryapprovalemp from "./components/Visitorentryapprovalemp";
import Visitor from "./components/Visitor";
import Preappointment from "./components/Preappointment";
import Securityappointment from "./components/Securityappointment";
import Securityapprovalview from "./components/Securityapprovalview";
import Admindashbord from "./components/Admindashbord";
import Securitydashborad from "./components/Securitydashborad";
import Securityparcelentry from "./components/Securityparcelentry";
import NotificationSidebar from "./components/NotificationSidebar";
import Topbar from "./layout/Topbar";
import { useAuth } from "./context/AuthContext";
import { useState } from "react";

function App() {
  const { isAuthenticated } = useAuth();
  const { userRole } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNavigate = (component: string) => {
    setCurrentView(component);
  };

  const renderContent = () => {
    switch (currentView) {
      case "rolemaster":
        return <Rolemaster />;
      case "departmentmaster":
        return <Deparmentmaster />;
      case "usermaster":
        return <Usermaster />;
      case "vendormaster":
        return <Vendormaster />;
      case "locationmaster":
        return <Locationmaster />;
      case "visitorentryapproval":
        return <Visitorentryapproval />;
      case "visitorentryapprovalemp":
        return <Visitorentryapprovalemp />;
      case "visitor":
        return <Visitor />;
      case "preappointment":
        return <Preappointment />;
      case "securityappointment":
        return <Securityappointment />;
      case "securityapprovalview":
        return <Securityapprovalview />;
      case "vendorgetpass":
        return <Vendorgetpass />;
      case "securityparcelentry":
        return <Securityparcelentry />;
      case "dashboard":
        // show admin dashboard for admin role, otherwise a simple welcome
        if (userRole === "admin")
          return <Admindashbord setCurrentView={setCurrentView} />;
        if (userRole === "security")
          return <Securitydashborad setCurrentView={setCurrentView} />;
        if (userRole === "employee")
          return <Admindashbord setCurrentView={setCurrentView} />;
        return (
          <div style={{ padding: 24, color: "var(--text-primary)" }}>
            <h2>Welcome to Visitor Management System</h2>
            <p>Use the sidebar to navigate.</p>
          </div>
        );
      case "application":
        return (
          <div style={{ padding: 24, color: "var(--text-primary)" }}>
            <h2>Application</h2>
            <p>Application content coming soon...</p>
          </div>
        );
      case "report":
        return (
          <div style={{ padding: 24, color: "var(--text-primary)" }}>
            <h2>Report</h2>
            <p>Report content coming soon...</p>
          </div>
        );
      default:
        return (
          <div style={{ padding: 24, color: "var(--text-primary)" }}>
            <h2>Welcome to Visitor Management System</h2>
            <p>Use the sidebar to navigate.</p>
          </div>
        );
    }
  };

  return (
    <>
      {isAuthenticated ? (
        <div
          style={{
            display: "flex",
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
          }}
        >
          <Sidebar
            onNavigate={handleNavigate}
            onNotificationClick={() => setShowNotifications(true)}
          />
          <main
            style={{
              flex: 1,
              overflow: "auto",
              background: "var(--bg-primary)",
              height: "100vh",
            }}
          >
            <Topbar />
            {renderContent()}
          </main>
          <NotificationSidebar
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;
