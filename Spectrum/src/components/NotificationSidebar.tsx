import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { endpoints } from "../api/endpoint";
import { useAuth } from "../context/AuthContext";
import "./NotificationSidebar.css";

interface Parcel {
  parcelId: number;
  parcelBarcode: string;
  parcelCompanyName: string;
  userId: number;
  isActive: boolean;
  createdAt?: string;
  parcelHandover?: boolean | string | null;
  parcel_type?: string;
  isRead?: boolean;
}

interface Appointment {
  visitorEntryId: number;
  visitorEntryVisitorId: number;
  visitorEntryGatepass: string;
  visitorEntryVehicletype?: string;
  visitorEntryVehicleno?: string;
  visitorEntryDate: string;
  visitorEntryUserid: number;
  visitorName?: string;
  visitorMobile?: string;
  visitorCompanyName?: string;
  visitorPurposeofvisit?: string;
  isRead?: boolean;
}

interface Notification {
  id: number;
  type: "parcel" | "appointment";
  title: string;
  preview: string;
  createdAt: string;
  isRead: boolean;
  data: Parcel | Appointment;
}

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  onNavigate?: (view: string) => void;
}

const NotificationSidebar = forwardRef(
  (
    { isOpen, onUnreadCountChange, onNavigate }: NotificationSidebarProps,
    ref
  ) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedNotification, setSelectedNotification] =
      useState<Notification | null>(null);
    const [clearedOnOpen, setClearedOnOpen] = useState(false);
    const { token, userRole } = useAuth();
    const isAdmin = String(userRole || "")
      .toLowerCase()
      .includes("admin");

    // Helper functions for read status
    const getReadNotifications = (): { type: string; id: number }[] => {
      const stored = localStorage.getItem("readNotifications");
      return stored ? JSON.parse(stored) : [];
    };

    const markNotificationAsRead = (
      type: "parcel" | "appointment",
      id: number
    ) => {
      const readNotifications = getReadNotifications();
      const exists = readNotifications.some(
        (n) => n.type === type && n.id === id
      );
      if (!exists) {
        readNotifications.push({ type, id });
        localStorage.setItem(
          "readNotifications",
          JSON.stringify(readNotifications)
        );
      }
    };

    useEffect(() => {
      fetchUserNotifications();
    }, []);

    // Reset clearedOnOpen when navigating away (isOpen becomes false)
    useEffect(() => {
      if (!isOpen) {
        setClearedOnOpen(false);
      }
    }, [isOpen]);

    // When opening the notifications page, clear unread badge like WhatsApp/email
    useEffect(() => {
      const hasItems = notifications && notifications.length > 0;
      const hasUnread = notifications.some((n) => !n.isRead);
      if (isOpen && hasItems && hasUnread && !clearedOnOpen) {
        // Mark all as read on first open
        const readNotifications = getReadNotifications();
        const updatedRead = [...readNotifications];
        const toAdd: { type: string; id: number }[] = [];
        notifications.forEach((n) => {
          const exists = updatedRead.some(
            (r) => r.type === n.type && r.id === n.id
          );
          if (!exists) {
            updatedRead.push({ type: n.type, id: n.id });
            toAdd.push({ type: n.type, id: n.id });
          }
        });
        if (toAdd.length > 0) {
          localStorage.setItem(
            "readNotifications",
            JSON.stringify(updatedRead)
          );
        }
        // Update local state
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        if (onUnreadCountChange) onUnreadCountChange(0);
        setClearedOnOpen(true);
      }
    }, [notifications, isOpen, clearedOnOpen]);

    // Expose refresh function to parent via ref
    useImperativeHandle(ref, () => ({
      refreshParcels: fetchUserNotifications,
    }));

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
      } catch (e) {
        console.error("Error decoding token:", e);
        return null;
      }
    };

    const fetchUserNotifications = async () => {
      try {
        setLoading(true);
        const loggedInUserId = getLoggedInUserId();

        if (!loggedInUserId) {
          console.warn("No user ID found in token");
          setNotifications([]);
          return;
        }

        // Fetch parcels
        const parcelResponse = await endpoints.parcel.getAll();
        const parcelData = parcelResponse?.data || [];
        const parcelList =
          parcelData?.$values || parcelData?.data || parcelData || [];

        const normalizedParcels = (
          Array.isArray(parcelList) ? parcelList : []
        ).map((item: any) => ({
          parcelId: item.parcelId || item.ParcelId || item.id || 0,
          parcelBarcode:
            item.parcelBarcode || item.ParcelBarcode || item.barcode || "",
          parcelCompanyName:
            item.parcelCompanyName ||
            item.ParcelCompanyName ||
            item.companyName ||
            "",
          userId: item.userId || item.UserId || item.user_Id || 0,
          isActive:
            item.isActive !== undefined
              ? item.isActive
              : item.IsActive !== undefined
              ? item.IsActive
              : true,
          createdAt:
            item.createdDate ||
            item.CreatedDate ||
            item.createdAt ||
            item.CreatedAt ||
            new Date().toISOString(),
          parcelHandover:
            item.parcelHandover ||
            item.ParcelHandover ||
            item.parcelHandoverFlag ||
            null,
          parcel_type:
            item.parcel_type ||
            item.Parcel_type ||
            item.parcelType ||
            "company",
        }));

        const userParcels = normalizedParcels.filter(
          (p) => p.userId === loggedInUserId
        );

        // Fetch appointments
        const appointmentResponse = await endpoints.visitorEntry.getAll();
        const appointmentData = appointmentResponse?.data || [];
        const appointmentList =
          appointmentData?.$values ||
          appointmentData?.data ||
          appointmentData ||
          [];

        // Debug: Log first appointment to see actual field names
        if (appointmentList.length > 0) {
          console.log(
            "🔍 Raw Appointment API Response (first item):",
            appointmentList[0]
          );
          console.log("🔍 All field names:", Object.keys(appointmentList[0]));
        }

        const normalizedAppointmentsBase = (
          Array.isArray(appointmentList) ? appointmentList : []
        ).map((item: any, index: number) => {
          // Try all possible field name variations (API returns visitorEntryID)
          const id =
            item.visitorEntryID ||
            item.VisitorEntryID ||
            item.visitorEntry_Id ||
            item.VisitorEntry_Id ||
            item.visitorEntryId ||
            item.VisitorEntryId ||
            item.VisitorEntry_id ||
            item.visitorentry_id ||
            item.id ||
            item.Id ||
            item.ID ||
            0;

          console.log(
            "🔍 Mapping appointment #" + index + " - Raw ID fields:",
            {
              visitorEntry_Id: item.visitorEntry_Id,
              VisitorEntry_Id: item.VisitorEntry_Id,
              visitorEntryId: item.visitorEntryId,
              VisitorEntryId: item.VisitorEntryId,
              id: item.id,
              resolved: id,
              allKeys: Object.keys(item)
                .filter((k) => k.toLowerCase().includes("id"))
                .join(", "),
            }
          );

          return {
            visitorEntryId: id,
            visitorEntryVisitorId:
              item.visitorEntry_visitorId ||
              item.visitorEntryVisitorId ||
              item.visitorId ||
              0,
            visitorEntryGatepass:
              item.visitorEntry_Gatepass ||
              item.visitorEntryGatepass ||
              item.gatepass ||
              "",
            visitorEntryVehicletype:
              item.visitorEntry_Vehicletype ||
              item.visitorEntryVehicletype ||
              item.vehicleType ||
              "",
            visitorEntryVehicleno:
              item.visitorEntry_Vehicleno ||
              item.visitorEntryVehicleno ||
              item.vehicleNo ||
              "",
            visitorEntryDate:
              item.visitorEntry_Date ||
              item.visitorEntryDate ||
              item.date ||
              new Date().toISOString(),
            visitorEntryUserid:
              item.visitorEntry_Userid ||
              item.visitorEntryUserid ||
              item.userId ||
              0,
          };
        });

        // Enrich appointment data with visitor details when available
        const normalizedAppointments = await Promise.all(
          normalizedAppointmentsBase.map(async (a) => {
            try {
              if (a.visitorEntryVisitorId) {
                const vRes = await endpoints.visitor.getById(
                  Number(a.visitorEntryVisitorId)
                );
                const vData = vRes?.data || {};
                const v = vData?.data || vData || {};
                return {
                  ...a,
                  visitorName:
                    v.visitor_Name || v.visitorName || v.name || undefined,
                  visitorMobile:
                    v.visitor_mobile ||
                    v.visitorMobile ||
                    v.mobile ||
                    undefined,
                  visitorCompanyName:
                    v.visitor_CompanyName ||
                    v.visitorCompanyName ||
                    v.companyName ||
                    undefined,
                  visitorPurposeofvisit:
                    v.visitor_Purposeofvisit ||
                    v.visitorPurposeofvisit ||
                    v.purpose ||
                    undefined,
                } as Appointment;
              }
              return {
                ...a,
              } as Appointment;
            } catch {
              return { ...a } as Appointment;
            }
          })
        );

        const userAppointments = normalizedAppointments.filter((a) =>
          isAdmin ? true : a.visitorEntryUserid === loggedInUserId
        );

        // Combine into notifications
        const readNotifications = getReadNotifications();

        const parcelNotifications: Notification[] = userParcels.map((p) => ({
          id: p.parcelId,
          type: "parcel" as const,
          title: `New Parcel: ${p.parcelBarcode}`,
          preview: `${p.parcelCompanyName} has been assigned to you`,
          createdAt: p.createdAt || new Date().toISOString(),
          isRead: readNotifications.some(
            (n) => n.type === "parcel" && n.id === p.parcelId
          ),
          data: p,
        }));

        const appointmentNotifications: Notification[] = userAppointments.map(
          (a, idx) => ({
            id: a.visitorEntryId || -(idx + 1), // Use negative index as fallback for unique IDs
            type: "appointment" as const,
            title: `New Appointment: ${a.visitorName || "Visitor"}`,
            preview: `${a.visitorCompanyName || "Company"} - ${
              a.visitorPurposeofvisit || "Visit"
            }`,
            createdAt: a.visitorEntryDate,
            isRead: readNotifications.some(
              (n) =>
                n.type === "appointment" &&
                n.id === (a.visitorEntryId || -(idx + 1))
            ),
            data: a,
          })
        );

        const allNotifications = [
          ...parcelNotifications,
          ...appointmentNotifications,
        ].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        console.log("User notifications:", allNotifications);
        setNotifications(allNotifications);

        // Calculate and notify unread count
        const unreadCount = allNotifications.filter((n) => !n.isRead).length;
        if (onUnreadCountChange) {
          onUnreadCountChange(unreadCount);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleNotificationClick = (notification: Notification) => {
      // Mark as read
      markNotificationAsRead(notification.type, notification.id);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id && n.type === notification.type
            ? { ...n, isRead: true }
            : n
        )
      );

      // Update unread count
      const unreadCount = notifications.filter(
        (n) =>
          !(n.id === notification.id && n.type === notification.type) &&
          !n.isRead
      ).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadCount);
      }

      setSelectedNotification(notification);
    };

    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } catch {
        return "Recent";
      }
    };

    const formatHandover = (value: any) => {
      if (value === null || value === undefined) return "-";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (typeof value === "string") {
        const v = value.trim().toLowerCase();
        if (v === "true" || v === "yes") return "Yes";
        if (v === "false" || v === "no") return "No";
        return value;
      }
      return String(value);
    };

    return (
      <div className="notification-page-container">
        {/* Left panel - Notification list */}
        <div className="notification-list-panel">
          <div className="notification-list-header">
            <h2>Notifications</h2>
          </div>

          <div className="notification-list-content">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <p>No notifications</p>
              </div>
            ) : (
              <>
                {(() => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);

                  const todayNotifications = notifications.filter((n) => {
                    const date = new Date(n.createdAt || "");
                    return date.toDateString() === today.toDateString();
                  });

                  const yesterdayNotifications = notifications.filter((n) => {
                    const date = new Date(n.createdAt || "");
                    return date.toDateString() === yesterday.toDateString();
                  });

                  const olderNotifications = notifications.filter((n) => {
                    const date = new Date(n.createdAt || "");
                    return (
                      date < yesterday &&
                      date.toDateString() !== yesterday.toDateString()
                    );
                  });

                  return (
                    <>
                      {todayNotifications.length > 0 && (
                        <>
                          <div className="notification-section-header">
                            Today
                          </div>
                          {todayNotifications.map((notification) => (
                            <div
                              key={`${notification.type}-${notification.id}`}
                              className={`notification-list-item ${
                                !notification.isRead ? "unread" : ""
                              } ${
                                selectedNotification?.id === notification.id &&
                                selectedNotification?.type === notification.type
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                            >
                              <div className="notification-item-content">
                                <div className="notification-item-header">
                                  <span className="notification-sender">
                                    {notification.type === "parcel"
                                      ? "Parcel"
                                      : "Appointment"}{" "}
                                    Notification
                                  </span>
                                  <span className="notification-time">
                                    {new Date(
                                      notification.createdAt || ""
                                    ).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </span>
                                </div>
                                <div className="notification-subject">
                                  {notification.title}
                                </div>
                                <div className="notification-preview">
                                  {notification.preview}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {yesterdayNotifications.length > 0 && (
                        <>
                          <div className="notification-section-header">
                            Yesterday
                          </div>
                          {yesterdayNotifications.map((notification) => (
                            <div
                              key={`${notification.type}-${notification.id}`}
                              className={`notification-list-item ${
                                !notification.isRead ? "unread" : ""
                              } ${
                                selectedNotification?.id === notification.id &&
                                selectedNotification?.type === notification.type
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                            >
                              <div className="notification-item-content">
                                <div className="notification-item-header">
                                  <span className="notification-sender">
                                    {notification.type === "parcel"
                                      ? "Parcel"
                                      : "Appointment"}{" "}
                                    Notification
                                  </span>
                                  <span className="notification-time">
                                    {new Date(
                                      notification.createdAt || ""
                                    ).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </span>
                                </div>
                                <div className="notification-subject">
                                  {notification.title}
                                </div>
                                <div className="notification-preview">
                                  {notification.preview}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {olderNotifications.length > 0 && (
                        <>
                          <div className="notification-section-header">
                            This Month
                          </div>
                          {olderNotifications.map((notification) => (
                            <div
                              key={`${notification.type}-${notification.id}`}
                              className={`notification-list-item ${
                                !notification.isRead ? "unread" : ""
                              } ${
                                selectedNotification?.id === notification.id &&
                                selectedNotification?.type === notification.type
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                            >
                              <div className="notification-item-content">
                                <div className="notification-item-header">
                                  <span className="notification-sender">
                                    {notification.type === "parcel"
                                      ? "Parcel"
                                      : "Appointment"}{" "}
                                    Notification
                                  </span>
                                  <span className="notification-time">
                                    {new Date(
                                      notification.createdAt || ""
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="notification-subject">
                                  {notification.title}
                                </div>
                                <div className="notification-preview">
                                  {notification.preview}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* Right panel - Detail view */}
        <div className="notification-detail-panel">
          {selectedNotification ? (
            <>
              <div className="notification-detail-header">
                <div className="detail-header-info">
                  <h3>
                    {selectedNotification.type === "parcel"
                      ? "Parcel"
                      : "Appointment"}{" "}
                    Details
                  </h3>
                  <span className="detail-time">
                    {formatDate(selectedNotification.createdAt || "")}
                  </span>
                </div>
              </div>
              <div className="notification-detail-content">
                {selectedNotification.type === "parcel" ? (
                  <>
                    {/* Parcel Details - Email Style */}
                    <div className="email-style-content">
                      <div className="email-greeting">Dear User,</div>

                      <div className="email-message">
                        Your{" "}
                        {
                          (selectedNotification.data as Parcel)
                            .parcelCompanyName
                        }{" "}
                        package has been delivered. Pick it up from the security
                        guard cabin.
                      </div>

                      <div className="email-info-box">
                        <div className="email-info-title">Parcel Details:</div>

                        <div className="email-info-item">
                          <span className="email-info-label">Barcode:</span>
                          <span className="email-info-value">
                            {
                              (selectedNotification.data as Parcel)
                                .parcelBarcode
                            }
                          </span>
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">Company:</span>
                          <span className="email-info-value">
                            {
                              (selectedNotification.data as Parcel)
                                .parcelCompanyName
                            }
                          </span>
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">Parcel Type:</span>
                          <span className="email-info-value">
                            {(selectedNotification.data as Parcel)
                              .parcel_type === "company"
                              ? "Company"
                              : "Personal"}
                          </span>
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">Parcel ID:</span>
                          <span className="email-info-value">
                            #{(selectedNotification.data as Parcel).parcelId}
                          </span>
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">
                            Handover Status:
                          </span>
                          <span className="email-info-value">
                            {formatHandover(
                              (selectedNotification.data as Parcel)
                                .parcelHandover
                            )}
                          </span>
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">Status:</span>
                          <span className="email-info-value">
                            {(selectedNotification.data as Parcel).isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Appointment Details - Email Style */}
                    <div className="email-style-content">
                      <div className="email-greeting">Dear User,</div>

                      <div className="email-message">
                        You have a new visitor appointment scheduled. The
                        appointment has been successfully registered
                      </div>

                      <div className="email-info-box">
                        <div className="email-info-title">
                          Appointment Details:
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">
                            Visitor Name:
                          </span>
                          <span className="email-info-value">
                            {(selectedNotification.data as Appointment)
                              .visitorName || "N/A"}
                          </span>
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">Company:</span>
                          <span className="email-info-value">
                            {(selectedNotification.data as Appointment)
                              .visitorCompanyName || "N/A"}
                          </span>
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">
                            Purpose of Visit:
                          </span>
                          <span className="email-info-value">
                            {(selectedNotification.data as Appointment)
                              .visitorPurposeofvisit || "N/A"}
                          </span>
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">
                            Contact Number:
                          </span>
                          <span className="email-info-value">
                            {(selectedNotification.data as Appointment)
                              .visitorMobile || "N/A"}
                          </span>
                        </div>

                        <div className="email-info-item">
                          <span className="email-info-label">
                            Gatepass Number:
                          </span>
                          <span className="email-info-value">
                            {(selectedNotification.data as Appointment)
                              .visitorEntryGatepass || "N/A"}
                          </span>
                        </div>

                        {(selectedNotification.data as Appointment)
                          .visitorEntryVehicletype && (
                          <div className="email-info-item">
                            <span className="email-info-label">
                              Vehicle Type:
                            </span>
                            <span className="email-info-value">
                              {
                                (selectedNotification.data as Appointment)
                                  .visitorEntryVehicletype
                              }
                            </span>
                          </div>
                        )}

                        {(selectedNotification.data as Appointment)
                          .visitorEntryVehicleno && (
                          <div className="email-info-item">
                            <span className="email-info-label">
                              Vehicle Number:
                            </span>
                            <span className="email-info-value">
                              {
                                (selectedNotification.data as Appointment)
                                  .visitorEntryVehicleno
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="email-action-section">
                        <button
                          className="email-action-button"
                          onClick={() => onNavigate?.("visitorentryapproval")}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                          </svg>
                          View in Appointments
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="notification-detail-empty">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              <p>Select a notification to view details</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default NotificationSidebar;
