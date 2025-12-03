import "./App.css";
import Login from "./layout/Login";
import Sidebar from "./layout/Sidebar";
import Rolemaster from "./components/Rolemaster";
import Deparmentmaster from "./components/Deparmentmaster";
import Usermaster from "./components/Usermaster";
import Vendormaster from "./components/Vendormaster";
import Topbar from "./layout/Topbar";
import { useAuth } from "./context/AuthContext";
import { useState } from "react";

function App() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

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
      case "dashboard":
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
          <Sidebar onNavigate={handleNavigate} />
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
        </div>
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;
