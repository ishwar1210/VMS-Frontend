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
import { endpoints } from "./api/endpoint";
import { useAuth } from "./context/AuthContext";
import { useState, useEffect, useRef } from "react";

function App() {
  const { isAuthenticated, token, userRole } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationSidebarRef = useRef<any>(null);

  const handleNavigate = (component: string) => {
    setCurrentView(component);
    // Re-fetch unread count when navigating away from notifications
    if (component !== "notification") {
      fetchUnreadCount();
    }
  };

  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };

  const getLoggedInUserId = (): number | null => {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      const userId =
        payload?.userId ||
        payload?.UserId ||
        payload?.user_id ||
        payload?.sub ||
        payload?.nameid ||
        payload?.nameidentifier ||
        payload?.[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];
      return userId ? Number(userId) : null;
    } catch {
      return null;
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const loggedInUserId = getLoggedInUserId();
      if (!loggedInUserId) {
        setUnreadCount(0);
        return;
      }

      // parcels
      const parcelRes = await endpoints.parcel.getAll();
      const parcelData = parcelRes?.data || [];
      const parcelList =
        parcelData?.$values || parcelData?.data || parcelData || [];
      const normalizedParcels = (
        Array.isArray(parcelList) ? parcelList : []
      ).map((item: any) => ({
        parcelId: item.parcelId || item.ParcelId || item.id || 0,
        userId: item.userId || item.UserId || item.user_Id || 0,
        createdAt:
          item.createdDate ||
          item.CreatedDate ||
          item.createdAt ||
          item.CreatedAt ||
          new Date().toISOString(),
      }));
      const userParcels = normalizedParcels.filter(
        (p: any) => p.userId === loggedInUserId
      );

      // appointments
      const appRes = await endpoints.visitorEntry.getAll();
      const appData = appRes?.data || [];
      const appList = appData?.$values || appData?.data || appData || [];
      const baseAppointments = (Array.isArray(appList) ? appList : []).map(
        (item: any) => ({
          visitorEntryId:
            item.visitorEntryID ||
            item.visitorEntry_Id ||
            item.VisitorEntry_Id ||
            item.visitorEntryId ||
            item.VisitorEntryId ||
            item.id ||
            0,
          visitorEntryUserid:
            item.visitorEntry_Userid ||
            item.visitorEntryUserid ||
            item.visitorEntry_userid ||
            item.userId ||
            0,
          visitorEntryDate:
            item.visitorEntry_Date ||
            item.visitorEntryDate ||
            item.date ||
            new Date().toISOString(),
        })
      );
      const isAdmin = String(userRole || "")
        .toLowerCase()
        .includes("admin");
      const userAppointments = baseAppointments.filter((a: any) =>
        isAdmin ? true : a.visitorEntryUserid === loggedInUserId
      );

      console.log("🔍 Raw appointment data sample:", appList[0]);
      console.log("🔍 Normalized appointment sample:", baseAppointments[0]);
      console.log(
        "🔍 User appointments:",
        userAppointments.map((a: any) => ({
          id: a.visitorEntryId,
          userid: a.visitorEntryUserid,
        }))
      );

      // compute unread via localStorage
      const read = (() => {
        const stored = localStorage.getItem("readNotifications");
        return stored ? JSON.parse(stored) : [];
      })();

      const parcelUnread = userParcels.filter(
        (p: any) =>
          !read.some((r: any) => r.type === "parcel" && r.id === p.parcelId)
      ).length;
      const appUnread = userAppointments.filter(
        (a: any) =>
          !read.some(
            (r: any) => r.type === "appointment" && r.id === a.visitorEntryId
          )
      ).length;

      console.log("📊 Unread Count Debug:");
      console.log(
        "  Total Parcels:",
        userParcels.length,
        "Unread:",
        parcelUnread
      );
      console.log(
        "  Total Appointments:",
        userAppointments.length,
        "Unread:",
        appUnread
      );
      console.log("  Read Notifications:", read);
      console.log("  Final Unread Count:", parcelUnread + appUnread);

      setUnreadCount(parcelUnread + appUnread);
    } catch {
      // ignore
    }
  };

  const refreshNotifications = () => {
    fetchUnreadCount();
    if (notificationSidebarRef.current?.refreshParcels) {
      notificationSidebarRef.current.refreshParcels();
    }
  };

  // Fetch initial notification count on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

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
        return (
          <Securityappointment onAppointmentAdded={refreshNotifications} />
        );
      case "securityapprovalview":
        return <Securityapprovalview />;
      case "vendorgetpass":
        return <Vendorgetpass />;
      case "securityparcelentry":
        return <Securityparcelentry onParcelAdded={refreshNotifications} />;
      case "notification":
        return (
          <NotificationSidebar
            ref={notificationSidebarRef}
            isOpen={true}
            onClose={() => handleNavigate("dashboard")}
            onUnreadCountChange={handleUnreadCountChange}
            onNavigate={handleNavigate}
          />
        );
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
            onNotificationClick={() => handleNavigate("notification")}
            unreadCount={unreadCount}
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
        </div>
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;
