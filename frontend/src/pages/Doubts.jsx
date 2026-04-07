import { useState, useEffect } from "react";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

import API from "../api.js";
const tok = () => localStorage.getItem("token");

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString([], { day:"numeric", month:"short" });
}

function Doubts() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    axios.get(`${API}/student/faculty-content?type=notice`, {
      headers: { Authorization: `Bearer ${tok()}` }
    }).then(r => setNotices(r.data)).catch(() => setNotices([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">📢 Notices & Doubts</h1>
        <p className="page-sub">Announcements from your faculty</p>
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>Loading…</div>
      ) : notices.length === 0 ? (
        <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📢</div>
          No notices posted yet.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {notices.map(item => (
            <div key={item._id} className="glass-card" style={{ cursor:"pointer" }}
              onClick={() => setExpanded(expanded===item._id ? null : item._id)}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:38, height:38, borderRadius:12, background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  📢
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{item.title}</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    {item.subject && <span style={{ padding:"2px 8px", borderRadius:8, fontSize:11, fontWeight:600, background:"rgba(251,191,36,0.15)", color:"#fbbf24" }}>{item.subject}</span>}
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{item.facultyName || "Faculty"}</span>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>{fmtDate(item.createdAt)}</span>
                  </div>
                  {expanded === item._id && item.description && (
                    <div style={{ marginTop:12, fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7, whiteSpace:"pre-wrap", borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:12 }}>
                      {item.description}
                    </div>
                  )}
                </div>
                <span style={{ color:"rgba(255,255,255,0.25)", fontSize:16, flexShrink:0 }}>
                  {expanded===item._id ? "▲" : "▼"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Doubts;
