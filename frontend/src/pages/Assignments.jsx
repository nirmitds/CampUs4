import { useState, useEffect } from "react";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

import API from "../api.js";
const tok = () => localStorage.getItem("token");

function fmtDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  const now = new Date();
  const diff = Math.ceil((date - now) / 86400000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return `In ${diff} days`;
  return date.toLocaleDateString([], { day:"numeric", month:"short" });
}

function Assignments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/student/faculty-content?type=assignment`, {
      headers: { Authorization: `Bearer ${tok()}` }
    }).then(r => setItems(r.data)).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const sc = { "Pending":"badge-yellow", "In Progress":"badge-blue", "Done":"badge-green", "Not Started":"badge-red" };

  return (
    <div className="dash-page">
      <div className="row-between page-header">
        <div><h1 className="page-title">📋 Assignments</h1><p className="page-sub">Posted by your faculty</p></div>
      </div>
      {loading ? (
        <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>Loading…</div>
      ) : items.length === 0 ? (
        <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          No assignments posted yet.
        </div>
      ) : (
        <div className="glass-card">
          <table className="dash-table">
            <thead><tr><th>Subject</th><th>Assignment</th><th>Due</th><th>Faculty</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id}>
                  <td><span className="badge badge-purple">{a.subject || "General"}</span></td>
                  <td>
                    <div style={{ fontWeight:600 }}>{a.title}</div>
                    {a.description && <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{a.description}</div>}
                  </td>
                  <td style={{ fontSize:13, color: a.dueDate && new Date(a.dueDate) < new Date() ? "#f87171" : "rgba(255,255,255,0.5)" }}>
                    {fmtDate(a.dueDate)}
                  </td>
                  <td style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{a.facultyName || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default Assignments;
