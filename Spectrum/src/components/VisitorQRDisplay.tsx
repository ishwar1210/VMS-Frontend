import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import "./VisitorQRDisplay.css";

const VisitorQRDisplay = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use the actual server IP/domain for mobile access
  // Change this to your actual domain or IP address
  const defaultUrl = "https://192.168.1.44:6517/visitor-appointment";
  const [visitorUrl, setVisitorUrl] = useState(defaultUrl);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    generateQR();
  }, [visitorUrl]);

  const generateQR = () => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        visitorUrl,
        {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) {
            console.error("Error generating QR code:", error);
          }
        }
      );
    }
  };

  const handleDownloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = "visitor-appointment-qr.png";
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="qr-display-container">
      <div className="qr-display-card">
        <div className="qr-header">
          <h2>Visitor Self-Service QR Code</h2>
          <p>Visitors can scan this QR code to book appointments</p>
        </div>

        <div className="qr-code-section">
          <div className="qr-canvas-wrapper">
            <canvas ref={canvasRef} />
          </div>

          <div className="qr-url-display">
            <strong>URL:</strong>
            {isEditing ? (
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input
                  type="text"
                  value={visitorUrl}
                  onChange={(e) => setVisitorUrl(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "2px solid #667eea",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
                <button
                  onClick={() => {
                    generateQR();
                    setIsEditing(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setVisitorUrl(defaultUrl);
                    setIsEditing(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  ✗
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                <a
                  href={visitorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1 }}
                >
                  {visitorUrl}
                </a>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: "6px 12px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Edit URL
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="qr-instructions">
          <h3>How to use:</h3>
          <ol>
            <li>Display this QR code at your reception or entrance</li>
            <li>Visitors can scan it with their mobile device</li>
            <li>They will be taken to the appointment booking page</li>
            <li>Visitors can fill in their details and book appointments</li>
          </ol>
        </div>

        <div className="qr-actions">
          <button className="download-qr-btn" onClick={handleDownloadQR}>
            <span>📥</span> Download QR Code
          </button>
          <button className="print-qr-btn" onClick={handlePrintQR}>
            <span>🖨️</span> Print QR Code
          </button>
        </div>

        <div className="qr-footer">
          <p className="qr-tip">
            💡 <strong>Tip:</strong> You can download or print this QR code and
            display it at your facility entrance
          </p>
        </div>
      </div>

      {/* Print-only section */}
      <div className="qr-print-only">
        <div className="print-header">
          <h1>Visitor Appointment QR Code</h1>
          <p>Scan to book an appointment</p>
        </div>
        <canvas ref={canvasRef} className="print-qr-canvas" />
        <div className="print-url">
          <p>{visitorUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default VisitorQRDisplay;
