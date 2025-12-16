import { useState, useEffect } from "react";
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
  isRead?: boolean;
}

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

function NotificationSidebar({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationSidebarProps) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const { token } = useAuth();

  // Helper functions for read status
  const getReadParcels = (): number[] => {
    const stored = localStorage.getItem("readParcels");
    return stored ? JSON.parse(stored) : [];
  };

  const markParcelAsRead = (parcelId: number) => {
    const readParcels = getReadParcels();
    if (!readParcels.includes(parcelId)) {
      readParcels.push(parcelId);
      localStorage.setItem("readParcels", JSON.stringify(readParcels));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserParcels();
    }
  }, [isOpen]);

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

  const fetchUserParcels = async () => {
    try {
      setLoading(true);
      const loggedInUserId = getLoggedInUserId();

      if (!loggedInUserId) {
        console.warn("No user ID found in token");
        setParcels([]);
        return;
      }

      const response = await endpoints.parcel.getAll();
      const data = response?.data || [];
      const parcelList = data?.$values || data?.data || data || [];

      // Normalize and filter parcels for logged-in user
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
      }));

      // Filter parcels assigned to logged-in user
      const userParcels = normalizedParcels.filter(
        (p) => p.userId === loggedInUserId
      );

      // Mark parcels as read based on localStorage
      const readParcels = getReadParcels();
      const parcelsWithReadStatus = userParcels.map((p) => ({
        ...p,
        isRead: readParcels.includes(p.parcelId),
      }));

      console.log("User parcels:", parcelsWithReadStatus);
      setParcels(parcelsWithReadStatus);

      // Calculate and notify unread count
      const unreadCount = parcelsWithReadStatus.filter((p) => !p.isRead).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadCount);
      }
    } catch (err) {
      console.error("Error fetching parcels:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleParcelClick = (parcel: Parcel) => {
    // Mark as read
    markParcelAsRead(parcel.parcelId);

    // Update local state
    setParcels((prev) =>
      prev.map((p) =>
        p.parcelId === parcel.parcelId ? { ...p, isRead: true } : p
      )
    );

    // Update unread count
    const unreadCount = parcels.filter(
      (p) => p.parcelId !== parcel.parcelId && !p.isRead
    ).length;
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }

    setSelectedParcel(parcel);
  };

  const closeDetailModal = () => {
    setSelectedParcel(null);
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
      return value; // show raw string
    }
    return String(value);
  };

  return (
    <>
      <div className={`notification-sidebar ${isOpen ? "open" : ""}`}>
        <div className="notification-header">
          <div className="notification-header-content">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <h3>Notifications</h3>
            <span className="notification-count">{parcels.length}</span>
          </div>
          <button className="close-notification-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="notification-content">
          {loading ? (
            <div className="notification-loading">Loading...</div>
          ) : parcels.length === 0 ? (
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
            <div className="notification-list">
              {(() => {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                const todayParcels = parcels.filter((p) => {
                  const date = new Date(p.createdAt || "");
                  return date.toDateString() === today.toDateString();
                });

                const yesterdayParcels = parcels.filter((p) => {
                  const date = new Date(p.createdAt || "");
                  return date.toDateString() === yesterday.toDateString();
                });

                const olderParcels = parcels.filter((p) => {
                  const date = new Date(p.createdAt || "");
                  return (
                    date < yesterday &&
                    date.toDateString() !== yesterday.toDateString()
                  );
                });

                return (
                  <>
                    {todayParcels.length > 0 && (
                      <>
                        <div className="notification-section-header">Today</div>
                        {todayParcels.map((parcel) => (
                          <div
                            key={parcel.parcelId}
                            className={`notification-item ${
                              !parcel.isRead ? "unread" : ""
                            }`}
                            onClick={() => handleParcelClick(parcel)}
                          >
                            <div className="notification-avatar">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                              </svg>
                            </div>
                            <div className="notification-details">
                              <div className="notification-header-text">
                                <span className="notification-sender">
                                  Parcel Notification
                                </span>
                                <span className="notification-time">
                                  {new Date(
                                    parcel.createdAt || ""
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                              <div className="notification-title">
                                New Parcel: {parcel.parcelBarcode}
                              </div>
                              <div className="notification-preview">
                                {parcel.parcelCompanyName} has been assigned to
                                you
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {yesterdayParcels.length > 0 && (
                      <>
                        <div className="notification-section-header">
                          Yesterday
                        </div>
                        {yesterdayParcels.map((parcel) => (
                          <div
                            key={parcel.parcelId}
                            className={`notification-item ${
                              !parcel.isRead ? "unread" : ""
                            }`}
                            onClick={() => handleParcelClick(parcel)}
                          >
                            <div className="notification-avatar">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                              </svg>
                            </div>
                            <div className="notification-details">
                              <div className="notification-header-text">
                                <span className="notification-sender">
                                  Parcel Notification
                                </span>
                                <span className="notification-time">
                                  {new Date(
                                    parcel.createdAt || ""
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                              <div className="notification-title">
                                New Parcel: {parcel.parcelBarcode}
                              </div>
                              <div className="notification-preview">
                                {parcel.parcelCompanyName} has been assigned to
                                you
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {olderParcels.length > 0 && (
                      <>
                        <div className="notification-section-header">
                          This Month
                        </div>
                        {olderParcels.map((parcel) => (
                          <div
                            key={parcel.parcelId}
                            className={`notification-item ${
                              !parcel.isRead ? "unread" : ""
                            }`}
                            onClick={() => handleParcelClick(parcel)}
                          >
                            <div className="notification-avatar">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                              </svg>
                            </div>
                            <div className="notification-details">
                              <div className="notification-header-text">
                                <span className="notification-sender">
                                  Parcel Notification
                                </span>
                                <span className="notification-time">
                                  {new Date(
                                    parcel.createdAt || ""
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="notification-title">
                                New Parcel: {parcel.parcelBarcode}
                              </div>
                              <div className="notification-preview">
                                {parcel.parcelCompanyName} has been assigned to
                                you
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedParcel && (
        <div className="notification-detail-overlay" onClick={closeDetailModal}>
          <div
            className="notification-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-detail-header">
              <h3>Parcel Details</h3>
              <button className="close-detail-btn" onClick={closeDetailModal}>
                ✕
              </button>
            </div>
            <div className="notification-detail-content">
              <div className="detail-row">
                <span className="detail-label">Barcode:</span>
                <span className="detail-value">
                  {selectedParcel.parcelBarcode}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Company:</span>
                <span className="detail-value">
                  {selectedParcel.parcelCompanyName}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Handover:</span>
                <span className="detail-value">
                  {formatHandover(selectedParcel.parcelHandover)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Parcel ID:</span>
                <span className="detail-value">#{selectedParcel.parcelId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Assigned:</span>
                <span className="detail-value">
                  {formatDate(selectedParcel.createdAt || "")}
                </span>
              </div>
            </div>
            <div className="notification-detail-footer">
              <button className="close-modal-btn" onClick={closeDetailModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && <div className="notification-backdrop" onClick={onClose} />}
    </>
  );
}

export default NotificationSidebar;
