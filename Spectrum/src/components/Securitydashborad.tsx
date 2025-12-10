import { useEffect, useState } from "react";
import "./Rolemaster.css";
import "./Admindashbord.css";
import { endpoints } from "../api/endpoint";

interface AdmindashbordProps {
  setCurrentView?: (view: string) => void;
}

export default function Admindashbord({ setCurrentView }: AdmindashbordProps) {
  const [, setVisitors] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<"monthly" | "weekly" | "daily">(
    "monthly"
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [vRes, eRes] = await Promise.all([
        endpoints.visitor.getAll(),
        endpoints.visitorEntry.getAll(),
      ]);

      const vData = vRes?.data || [];
      const visitorsList = vData?.$values || vData?.data || vData;
      const normalizedVisitors = (
        Array.isArray(visitorsList) ? visitorsList : []
      ).map((v: any) => ({
        visitor_Id: v.visitor_Id ?? v.visitorId ?? v.id ?? 0,
        visitor_Name:
          v.visitor_Name ??
          v.name ??
          v.fullName ??
          (`${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || "Unknown"),
      }));

      const eData = eRes?.data || [];
      const entriesList = eData?.$values || eData?.data || eData;
      const normalizedEntries = (
        Array.isArray(entriesList) ? entriesList : []
      ).map((it: any) => {
        const id = it.visitorEntry_Id ?? it.visitorEntryId ?? it.id ?? 0;
        const visitorId =
          it.visitorEntry_visitorId ?? it.visitorId ?? it.visitor_Id ?? 0;
        return {
          visitorEntry_Id: Number(id),
          visitorEntry_visitorId: Number(visitorId),
          visitorEntry_Gatepass: it.visitorEntry_Gatepass ?? it.gatepass ?? "",
          visitorEntry_Intime: it.visitorEntry_Intime ?? it.intime ?? "",
          visitorEntry_Outtime: it.visitorEntry_Outtime ?? it.outtime ?? null,
          visitorEntry_isApproval: !!(
            it.visitorEntry_isApproval ??
            it.isApproval ??
            it.requiresApproval
          ),
          visitorEntry_visitorName:
            (normalizedVisitors.find((v: any) => v.visitor_Id === visitorId)
              ?.visitor_Name ||
              it.visitorEntry_visitorName) ??
            it.visitorName ??
            `#${visitorId}`,
        };
      });

      // sort recent
      normalizedEntries.sort(
        (a: any, b: any) => (b.visitorEntry_Id || 0) - (a.visitorEntry_Id || 0)
      );

      setVisitors(normalizedVisitors);
      setEntries(normalizedEntries);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data");
      setVisitors([]);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if date is today
  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const date = new Date(dateStr);
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // Helper to check if date is in current month
  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    try {
      const date = new Date(dateStr);
      const today = new Date();
      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // Today's visitor entries (filtered by intime)
  const todayEntries = entries.filter((e) => isToday(e.visitorEntry_Intime));

  // Today's active visitors (checked in today and not checked out)
  const todayActiveEntries = entries.filter(
    (e) => isToday(e.visitorEntry_Intime) && !e.visitorEntry_Outtime
  );

  // Today's checked out visitors (checked out today)
  const todayOutEntries = entries.filter((e) =>
    isToday(e.visitorEntry_Outtime)
  );

  // Monthly visitor entries (filtered by intime in current month)
  const monthlyEntries = entries.filter((e) =>
    isThisMonth(e.visitorEntry_Intime)
  );

  // --- Statistics: helper functions
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(count >= 10000 ? 2 : 1)}k`;
    }
    return count.toString();
  };

  // Monthly view
  const getLastNMonths = (n: number) => {
    const months: { key: string; label: string; fullLabel: string }[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const label = dt.toLocaleString("en-IN", { month: "short" });
      const fullLabel = dt.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
      });
      months.push({ key, label, fullLabel });
    }
    return months;
  };

  // Weekly view (last N weeks)
  const getLastNWeeks = (n: number) => {
    const weeks: {
      key: string;
      label: string;
      fullLabel: string;
      startDate: Date;
      endDate: Date;
    }[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const key = `${weekStart.getFullYear()}-W${Math.ceil(
        weekStart.getDate() / 7
      )}-${weekStart.getMonth()}`;
      const label = `W${n - i}`;
      const fullLabel = `${weekStart.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
      })}`;

      weeks.push({
        key,
        label,
        fullLabel,
        startDate: weekStart,
        endDate: weekEnd,
      });
    }
    return weeks;
  };

  // Daily view (last N days)
  const getLastNDays = (n: number) => {
    const days: {
      key: string;
      label: string;
      fullLabel: string;
      date: Date;
    }[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const dt = new Date(now);
      dt.setDate(now.getDate() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(dt.getDate()).padStart(2, "0")}`;
      const label = dt.toLocaleString("en-IN", { day: "numeric" });
      const fullLabel = dt.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
      });
      days.push({ key, label, fullLabel, date: dt });
    }
    return days;
  };

  // Get chart data based on selected view
  const getChartData = () => {
    if (chartView === "monthly") {
      const months = getLastNMonths(5);
      const counts = months.map((m) => {
        const cnt = entries.reduce((acc, it) => {
          const intime = it.visitorEntry_Intime || "";
          if (!intime) return acc;
          try {
            const d = new Date(intime);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              "0"
            )}`;
            return key === m.key ? acc + 1 : acc;
          } catch {
            return acc;
          }
        }, 0);
        return cnt;
      });
      return { periods: months, counts };
    } else if (chartView === "weekly") {
      const weeks = getLastNWeeks(5);
      const counts = weeks.map((w) => {
        const cnt = entries.reduce((acc, it) => {
          const intime = it.visitorEntry_Intime || "";
          if (!intime) return acc;
          try {
            const d = new Date(intime);
            const isInWeek = d >= w.startDate && d <= w.endDate;
            return isInWeek ? acc + 1 : acc;
          } catch {
            return acc;
          }
        }, 0);
        return cnt;
      });
      return { periods: weeks, counts };
    } else {
      // daily
      const days = getLastNDays(5);
      const counts = days.map((day) => {
        const cnt = entries.reduce((acc, it) => {
          const intime = it.visitorEntry_Intime || "";
          if (!intime) return acc;
          try {
            const d = new Date(intime);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(d.getDate()).padStart(2, "0")}`;
            return key === day.key ? acc + 1 : acc;
          } catch {
            return acc;
          }
        }, 0);
        return cnt;
      });
      return { periods: days, counts };
    }
  };

  const { periods, counts } = getChartData();
  const maxCount = Math.max(...counts, 1);

  // Filter entries based on search
  const filteredEntries = entries.filter((en) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      en.visitorEntry_visitorName?.toLowerCase().includes(query) ||
      en.visitorEntry_Gatepass?.toLowerCase().includes(query) ||
      en.visitorEntry_Id?.toString().includes(query)
    );
  });

  const handleAddVisitor = () => {
    if (setCurrentView) {
      setCurrentView("securityappointment");
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="dashboard-title">Visitor Management System</h2>
        </div>
        <div className="dashboard-actions">
          <button
            className="refresh-btn"
            onClick={fetchData}
            disabled={loading}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="cards-row">
        <div className="card card-visitors">
          <div className="card-icon">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
            </svg>
          </div>
          <div className="card-content">
            <div className="card-title">Today Visitor Entry IN</div>
            <div className="card-value">{todayEntries.length}</div>
            <div className="card-badge">Checked In Today</div>
          </div>
        </div>
        <div className="card card-entries">
          <div className="card-icon">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="card-content">
            <div className="card-title">Today Active Visitors</div>
            <div className="card-value">{todayActiveEntries.length}</div>
            <div className="card-badge">Currently On-Site</div>
          </div>
        </div>
        <div className="card card-active">
          <div className="card-icon">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <div className="card-content">
            <div className="card-title">Today Visitor Entry OUT</div>
            <div className="card-value">{todayOutEntries.length}</div>
            <div className="card-badge badge-success">Checked Out Today</div>
          </div>
        </div>
        <div className="card card-pending">
          <div className="card-icon">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="card-content">
            <div className="card-title">Monthly Visitor Entry</div>
            <div className="card-value">{monthlyEntries.length}</div>
            <div className="card-badge badge-info">This Month</div>
          </div>
        </div>
      </div>

      {/* Monthly statistics panel */}
      <div className="stats-panel">
        <div className="stats-header">
          <h3>Statistics (Total Visitor)</h3>
          <select
            className="stats-dropdown"
            value={chartView}
            onChange={(e) =>
              setChartView(e.target.value as "monthly" | "weekly" | "daily")
            }
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        <div className="stats-area-chart">
          <svg
            viewBox="0 0 820 180"
            className="chart-svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {/* Area path */}
            <path
              d={(() => {
                const w = 820;
                const h = 140;
                const segW = w / (periods.length - 1 || 1);
                let path = "M 0 140";
                periods.forEach((p, i) => {
                  console.log(p); // Use 'p' to avoid the unused variable error
                  const x = i * segW;
                  const pct = counts[i] / maxCount;
                  const y = h - pct * h;
                  if (i === 0) path = `M ${x} ${y}`;
                  else path += ` L ${x} ${y}`;
                });
                path += ` L ${w} 140 L 0 140 Z`;
                return path;
              })()}
              fill="url(#areaGrad)"
            />
            {/* Line path */}
            <path
              d={(() => {
                const w = 820;
                const h = 140;
                const segW = w / (periods.length - 1 || 1);
                let path = "";
                periods.forEach((_p, i) => {
                  const x = i * segW;
                  const pct = counts[i] / maxCount;
                  const y = h - pct * h;
                  if (i === 0) path = `M ${x} ${y}`;
                  else path += ` L ${x} ${y}`;
                });
                return path;
              })()}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2.5"
            />
          </svg>
          <div className="chart-labels">
            {periods.map((p, i) => {
              const count = counts[i] || 0;
              const isHighlighted = i === 0;
              return (
                <div
                  key={p.key}
                  className={`chart-label-item ${
                    isHighlighted ? "highlighted" : ""
                  }`}
                >
                  <div className="label-date">{p.fullLabel}</div>
                  <div className="label-count">{formatCount(count)}</div>
                  {isHighlighted && (
                    <div className="label-details">Details →</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="recent-section">
        <div className="section-header">
          <h3 className="section-title">Recent Visitor Entries</h3>
          <div className="section-actions">
            <div className="search-box">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="add-visitor-btn" onClick={handleAddVisitor}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Visitor
            </button>
          </div>
        </div>
        {error && <div className="error-text">{error}</div>}
        <div className="table-container">
          <table className="visitor-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Visitor Name</th>
                <th>Gatepass</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="loading-cell">
                    <div className="loading-spinner"></div>
                    <span>Loading data...</span>
                  </td>
                </tr>
              )}
              {!loading && filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <p>No visitor entries found</p>
                  </td>
                </tr>
              )}
              {!loading &&
                filteredEntries.slice(0, 10).map((en: any, idx: number) => {
                  const isActive = !en.visitorEntry_Outtime;
                  const formatTime = (ts: string) => {
                    if (!ts) return "-";
                    try {
                      const d = new Date(ts);
                      return d.toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return ts;
                    }
                  };

                  // Prefer normalized visitorEntry id fields; fall back to other id shapes or index
                  const rawId =
                    en?.visitorEntry_Id || en?.visitorEntryId || en?.id || 0;
                  const displayId =
                    rawId && Number(rawId) !== 0 ? `#${rawId}` : `${idx + 1}`;

                  return (
                    <tr
                      key={
                        en.visitorEntry_Id || en.visitorEntryId || en.id || idx
                      }
                      className={isActive ? "row-active" : ""}
                    >
                      <td className="cell-id">{displayId}</td>
                      <td className="cell-name">
                        <div className="name-wrapper">
                          <span>{en.visitorEntry_visitorName}</span>
                        </div>
                      </td>
                      <td className="cell-gatepass">
                        {en.visitorEntry_Gatepass || "-"}
                      </td>
                      <td className="cell-time">
                        {formatTime(en.visitorEntry_Intime)}
                      </td>
                      <td className="cell-time">
                        {formatTime(en.visitorEntry_Outtime)}
                      </td>
                      <td className="cell-status">
                        <span
                          className={`status-badge ${
                            isActive ? "status-active" : "status-completed"
                          }`}
                        >
                          {isActive ? "On-Site" : "Checked Out"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
