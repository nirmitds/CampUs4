import { useState, useEffect } from "react";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

import API from "../api.js";
const tok = () => localStorage.getItem("token");

const TYPE_META = {
  assignment: { icon:"📋", color:"#fbbf24", bg:"rgba(251,191,36,0.12)" },
  timetable:  { icon:"📅", color:"#22d3ee", bg:"rgba(6,182,212,0.12)"  },
  notice:     { icon:"📢", color:"#fbbf24", bg:"rgba(251,191,36,0.12)" },
  result:     { icon:"📊", color:"#4ade80", bg:"rgba(34,197,94,0.12)"  },
  material:   { icon:"📚", color:"#a78bfa", bg:"rgba(139,92,246,0.12)" },
};

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString([], { day:"numeric", month:"short", year:"numeric" });
}

function Groups() {
  const [feed, setFeed]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  useEffect(() => {
    axios.get(`${API}/student/faculty-content`, {
      headers: { Authorization: `Bearer ${tok()}` }
    }).then(r => setFeed(r.data)).catch(() => setFeed([])).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? feed : feed.filter(f => f.type === filter);

  // group by faculty
  const byFaculty = {};
  for (const item of filtered) {
    const key = item.facultyName || item.facultyId || "Unknown Faculty";
    if (!byFaculty[key]) byFaculty[key] = { dept: item.department, items: [] };
    byFaculty[key].items.push(item);
  }

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">👥 Faculty Feed</h1>
        <p className="page-sub">All content from your faculty</p>
      </div>

      {/* filter chips */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {[["all","All"], ["assignment","📋 Assignments"], ["timetable","📅 Timetable"], ["notice","📢 Notices"], ["result","📊 Results"], ["material","📚 Materials"]].map(([key, label]) => (
          <button key={key}
            onClick={() => setFilter(key)}
            style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:"none",
              background: filter===key ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
              outline: filter===key ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.09)",
              color: filter===key ? "#60a5fa" : "rgba(255,255,255,0.5)" }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
          No content posted yet.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {Object.entries(byFaculty).map(([name, { dept, items }]) => (
            <div key={name}>
              {/* faculty group header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#06b6d4,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👨‍🏫</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{name}</div>
                  {dept && <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{dept}</div>}
                </div>
                <span style={{ marginLeft:"auto", fontSize:11, color:"rgba(255,255,255,0.3)" }}>{items.length} post{items.length!==1?"s":""}</span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8, paddingLeft:8, borderLeft:"2px solid rgba(6,182,212,0.2)" }}>
                {items.map(item => {
                  const meta = TYPE_META[item.type] || { icon:"📄", color:"#fff", bg:"rgba(255,255,255,0.05)" };
                  return (
                    <div key={item._id} className="glass-card" style={{ padding:"14px 16px" }}>
                      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>
                          {meta.icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:4 }}>
                            <span style={{ fontWeight:700, fontSize:13 }}>{item.title}</span>
                            <span style={{ padding:"1px 7px", borderRadius:8, fontSize:10, fontWeight:700, background:meta.bg, color:meta.color }}>{item.type}</span>
                            {item.subject && <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{item.subject}</span>}
                          </div>
                          {item.description && (
                            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>{item.description}</div>
                          )}
                          {item.dueDate && (
                            <div style={{ fontSize:11, color:"#fbbf24", marginTop:4 }}>📅 Due: {fmtDate(item.dueDate)}</div>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", flexShrink:0 }}>{fmtDate(item.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Groups;
