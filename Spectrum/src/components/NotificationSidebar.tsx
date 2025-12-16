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
}

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NotificationSidebar({ isOpen, onClose }: NotificationSidebarProps) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const { token } = useAuth();

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
        createdAt: item.createdAt || item.CreatedAt || new Date().toISOString(),
      }));

      // Filter parcels assigned to logged-in user
      const userParcels = normalizedParcels.filter(
        (p) => p.userId === loggedInUserId
      );

      console.log("User parcels:", userParcels);
      setParcels(userParcels);
    } catch (err) {
      console.error("Error fetching parcels:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleParcelClick = (parcel: Parcel) => {
    setSelectedParcel(parcel);
  };

  const closeDetailModal = () => {
    setSelectedParcel(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <>
      <div className={`notification-sidebar ${isOpen ? "open" : ""}`}>
        <div className="notification-header">
          <h3>Notifications</h3>
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
              {parcels.map((parcel) => (
                <div
                  key={parcel.parcelId}
                  className="notification-item"
                  onClick={() => handleParcelClick(parcel)}
                >
                  <div className="notification-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <div className="notification-details">
                    <div className="notification-title">
                      New Parcel Assigned
                    </div>
                    <div className="notification-subtitle">
                      {parcel.parcelCompanyName} - {parcel.parcelBarcode}
                    </div>
                    <div className="notification-time">
                      {formatDate(parcel.createdAt || "")}
                    </div>
                  </div>
                  <div className="notification-arrow">›</div>
                </div>
              ))}
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
                <span className="detail-label">Status:</span>
                <span
                  className={`status-badge ${
                    selectedParcel.isActive ? "active" : "inactive"
                  }`}
                >
                  {selectedParcel.isActive ? "Active" : "Inactive"}
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
