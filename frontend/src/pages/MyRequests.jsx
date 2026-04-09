import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";

injectDashStyles();

import API from "../api.js";
const token   = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function MyRequests() {
  const navigate = useNavigate();
  const [owned,    setOwned]    = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [tab,      setTab]      = useState("owned"); // "owned" | "accepted"

  useEffect(() => {
    axios.get(`${API}/exchange/my-requests`, { headers: headers() })
      .then(r => { setOwned(r.data.owned); setAccepted(r.data.accepted); })
      .catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this request?")) return;
    try {
      await axios.delete(`${API}/exchange/${id}`, { headers: headers() });
      setOwned(prev => prev.filter(r => r._id !== id));
    } catch (e) { alert(e.response?.data?.message || "Error"); }
  };

  const list = tab === "owned" ? owned : accepted;

  return (
    <div className="dash-page">
      <div className="row-between page-header">
        <div>
          <h1 className="page-title">📋 My Requests</h1>
          <p className="page-sub">Manage your posted and accepted exchange requests</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate("/student/exchange")}>
          ← Back to Exchange
        </button>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {[["owned", `📤 Posted (${owned.length})`], ["accepted", `📥 Accepted (${accepted.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "9px 18px", borderRadius: 9, border: "none",
            fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: tab === key ? "linear-gradient(135deg,#3b82f6,#8b5cf6)" : "transparent",
            color: tab === key ? "#fff" : "rgba(255,255,255,0.45)",
            transition: "all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon">{tab === "owned" ? "📤" : "📥"}</div>
            <p>{tab === "owned" ? "You haven't posted any requests yet." : "You haven't accepted any requests yet."}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map(r => (
            <div key={r._id} className="glass-card">
              <div className="row-between" style={{ flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <span className="badge badge-blue">{r.type}</span>
                    <span className="badge badge-purple">{r.category}</span>
                    <span className={`badge ${r.status === "Open" ? "badge-green" : r.status === "Accepted" ? "badge-yellow" : "badge-red"}`}>
                      {r.status}
                    </span>
                    {r.coins > 0 && (
                      <span className="badge" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                        💰 {r.coins}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{r.description}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                    {tab === "owned"
                      ? r.acceptedBy ? `Accepted by @${r.acceptedBy}` : "Waiting for someone to accept"
                      : `Posted by @${r.ownerUsername}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.status === "Accepted" && (
                    <button className="btn btn-primary"
                      onClick={() => navigate(`/student/chat/${r._id}`)}>
                      💬 Open Chat
                    </button>
                  )}
                  {tab === "owned" && (
                    <button className="btn btn-danger" onClick={() => handleDelete(r._id)}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
