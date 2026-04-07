import { useState, useEffect } from "react";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

import API from "../api.js";
const tok = () => localStorage.getItem("token");

function Timetable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/student/faculty-content?type=timetable`, {
      headers: { Authorization: `Bearer ${tok()}` }
    }).then(r => setItems(r.data)).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">📅 Timetable</h1>
        <p className="page-sub">Posted by your faculty</p>
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>Loading…</div>
      ) : items.length === 0 ? (
        <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
          No timetable posted yet.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {items.map(item => (
            <div key={item._id} className="glass-card">
              <div style={{ display:"flex", gap:10, alignItems:"flex-start", flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{item.title}</div>
                  {item.subject && (
                    <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:10, fontSize:11, fontWeight:600, background:"rgba(139,92,246,0.15)", color:"#a78bfa", marginBottom:8 }}>
                      {item.subject}
                    </span>
                  )}
                  {item.description && (
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{item.description}</div>
                  )}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", flexShrink:0 }}>
                  {item.facultyName || "Faculty"}<br />
                  {new Date(item.createdAt).toLocaleDateString([], { day:"numeric", month:"short" })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Timetable;
