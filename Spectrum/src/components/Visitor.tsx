import { useEffect, useState } from "react";
import { endpoints } from "../api/endpoint";
import "./Visitor.css";

type Visitor = {
  visitorId: number;
  visitor_Name: string;
  visitor_mobile: string;
  visitor_Address: string;
  visitor_CompanyName: string;
  visitor_isBlock: boolean;
  visitor_Blockreason: string | null;
  visitor_Unblockreason: string | null;
};

export default function Visitor() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadVisitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await endpoints.visitor.getAll();
      // Assume API returns array of visitors
      setVisitors(res.data as Visitor[]);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch visitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  const onToggleBlock = async (v: Visitor) => {
    const isBlocking = !v.visitor_isBlock;
    const reasonLabel = isBlocking ? "Block reason" : "Unblock reason";
    const reason = window
      .prompt(`Enter ${reasonLabel} for ${v.visitor_Name}`)
      ?.trim();

    if (!reason) return; // require reason

    const payload: any = {
      visitor_isBlock: isBlocking,
      visitor_Blockreason: isBlocking ? reason : null,
      visitor_Unblockreason: isBlocking ? null : reason,
    };

    try {
      await endpoints.visitor.update(v.visitorId, payload);
      // update local state optimistically
      setVisitors((prev) =>
        prev.map((it) =>
          it.visitorId === v.visitorId
            ? {
                ...it,
                visitor_isBlock: isBlocking,
                visitor_Blockreason: payload.visitor_Blockreason,
                visitor_Unblockreason: payload.visitor_Unblockreason,
              }
            : it
        )
      );
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Update failed");
    }
  };

  if (loading)
    return <div className="visitor-loading">Loading visitors...</div>;
  if (error)
    return (
      <div className="visitor-error" style={{ color: "red" }}>
        {error}
      </div>
    );

  return (
    <div className="visitor-container">
      <div className="visitor-header">
        <h2 className="visitor-title">Visitors</h2>
      </div>

      <section className="visitor-table-section">
        <div className="visitor-table-wrapper">
          <table className="visitor-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>Company</th>
                <th>Status</th>
                <th>Block Reason</th>
                <th>Unblock Reason</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr>
                  <td className="visitor-empty" colSpan={8}>
                    No visitors found.
                  </td>
                </tr>
              ) : (
                visitors.map((v, idx) => (
                  <tr key={v.visitorId}>
                    <td>{idx + 1}</td>
                    <td>{v.visitor_Name}</td>
                    <td>{v.visitor_mobile}</td>
                    <td>{v.visitor_Address}</td>
                    <td>{v.visitor_CompanyName}</td>
                    <td>
                      <button
                        className={`visitor-action-btn ${
                          v.visitor_isBlock ? "btn-unblock" : "btn-block"
                        }`}
                        onClick={() => onToggleBlock(v)}
                      >
                        {v.visitor_isBlock ? "Unblock" : "Block"}
                      </button>
                    </td>
                    <td>{v.visitor_Blockreason || "-"}</td>
                    <td>{v.visitor_Unblockreason || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
