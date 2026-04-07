import { useState, useEffect } from "react";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

import API from "../api.js";
const tok = () => localStorage.getItem("token");

const COLORS = [
  { name:"Blue",   bg:"rgba(59,130,246,0.15)",  border:"rgba(59,130,246,0.3)",  text:"#60a5fa" },
  { name:"Purple", bg:"rgba(139,92,246,0.15)",  border:"rgba(139,92,246,0.3)",  text:"#a78bfa" },
  { name:"Cyan",   bg:"rgba(6,182,212,0.15)",   border:"rgba(6,182,212,0.3)",   text:"#22d3ee" },
  { name:"Green",  bg:"rgba(34,197,94,0.15)",   border:"rgba(34,197,94,0.3)",   text:"#4ade80" },
  { name:"Yellow", bg:"rgba(245,158,11,0.15)",  border:"rgba(245,158,11,0.3)",  text:"#fbbf24" },
  { name:"Pink",   bg:"rgba(236,72,153,0.15)",  border:"rgba(236,72,153,0.3)",  text:"#f472b6" },
];

const NOTE_STYLE_ID = "campus-notes-styles";
if (!document.getElementById(NOTE_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = NOTE_STYLE_ID;
  s.textContent = `
    .notes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
    .note-card { border-radius:16px; padding:18px; cursor:pointer; position:relative; display:flex; flex-direction:column; gap:8px; transition:transform 0.2s,box-shadow 0.2s; }
    .note-card:hover { transform:translateY(-3px); box-shadow:0 14px 36px rgba(0,0,0,0.5); }
    .note-subject { font-size:11px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; }
    .note-topic { font-size:14px; font-weight:700; line-height:1.3; }
    .note-preview { font-size:12px; color:rgba(255,255,255,0.5); line-height:1.6; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
    .note-footer { display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:8px; border-top:1px solid rgba(255,255,255,0.07); }
    .note-date { font-size:11px; color:rgba(255,255,255,0.3); }
    .note-viewer { white-space:pre-wrap; font-size:14px; line-height:1.8; color:rgba(255,255,255,0.75); font-family:Outfit,sans-serif; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px; min-height:120px; }
    .notes-tab { padding:8px 18px; border-radius:20px; font-size:13px; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.5); transition:all 0.15s; }
    .notes-tab.active { background:rgba(59,130,246,0.2); border-color:rgba(59,130,246,0.4); color:#60a5fa; }
    .color-dot { width:24px; height:24px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:transform 0.15s,border-color 0.15s; }
    .color-dot:hover { transform:scale(1.15); }
    .color-dot.selected { border-color:#fff; transform:scale(1.2); }
  `;
  document.head.appendChild(s);
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString([], { day:"numeric", month:"short" });
}

function Notes() {
  const [activeTab, setActiveTab] = useState("my");   // "my" | "faculty"
  const [myNotes, setMyNotes]     = useState([]);
  const [facMats, setFacMats]     = useState([]);
  const [loadingFac, setLoadingFac] = useState(false);
  const [viewing, setViewing]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]           = useState({ subject:"", topic:"", content:"", color:COLORS[0] });

  useEffect(() => {
    // load faculty materials
    setLoadingFac(true);
    axios.get(`${API}/student/faculty-content?type=material`, {
      headers: { Authorization: `Bearer ${tok()}` }
    }).then(r => setFacMats(r.data)).catch(() => setFacMats([])).finally(() => setLoadingFac(false));
  }, []);

  const handleCreate = () => {
    if (!form.topic.trim() || !form.content.trim()) return alert("Topic and content required.");
    setMyNotes([{ id:Date.now(), subject:form.subject||"General", topic:form.topic.trim(), content:form.content.trim(), date:"Just now", color:form.color }, ...myNotes]);
    setForm({ subject:"", topic:"", content:"", color:COLORS[0] });
    setShowCreate(false);
  };

  return (
    <div className="dash-page">
      <div className="row-between page-header">
        <div>
          <h1 className="page-title">📝 Notes</h1>
          <p className="page-sub">Your notes & faculty materials</p>
        </div>
        {activeTab === "my" && <button className="btn btn-primary" onClick={() => { setShowCreate(true); setViewing(null); }}>+ New Note</button>}
      </div>

      {/* tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <button className={`notes-tab ${activeTab==="my"?"active":""}`} onClick={() => setActiveTab("my")}>📝 My Notes ({myNotes.length})</button>
        <button className={`notes-tab ${activeTab==="faculty"?"active":""}`} onClick={() => setActiveTab("faculty")}>📚 Faculty Materials ({facMats.length})</button>
      </div>

      {/* MY NOTES */}
      {activeTab === "my" && (
        <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:0 }}>
            {myNotes.length === 0 && !showCreate ? (
              <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📝</div>
                No notes yet. Create your first one!
              </div>
            ) : (
              <div className="notes-grid">
                {myNotes.map(n => (
                  <div key={n.id} className="note-card"
                    style={{ background:n.color.bg, border:`1px solid ${n.color.border}` }}
                    onClick={() => { setViewing(n); setShowCreate(false); }}>
                    <div className="note-subject" style={{ color:n.color.text }}>{n.subject}</div>
                    <div className="note-topic">{n.topic}</div>
                    <div className="note-preview">{n.content}</div>
                    <div className="note-footer">
                      <span className="note-date">{n.date}</span>
                      <button className="btn btn-danger" style={{ padding:"3px 9px", fontSize:11 }}
                        onClick={e => { e.stopPropagation(); setMyNotes(myNotes.filter(x=>x.id!==n.id)); if(viewing?.id===n.id) setViewing(null); }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* side panel */}
          {(viewing || showCreate) && (
            <div style={{ width:"100%", maxWidth:340, flexShrink:0 }}>
              <div className="glass-card" style={{ position:"sticky", top:24, border: viewing && !showCreate ? `1px solid ${viewing.color.border}` : "1px solid rgba(255,255,255,0.1)", background: viewing && !showCreate ? viewing.color.bg : "rgba(255,255,255,0.05)" }}>
                {viewing && !showCreate && (
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                      <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:viewing.color.text }}>{viewing.subject}</span>
                      <button style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:20 }} onClick={() => setViewing(null)}>×</button>
                    </div>
                    <div style={{ fontSize:16, fontWeight:800, marginBottom:12 }}>{viewing.topic}</div>
                    <div className="note-viewer">{viewing.content}</div>
                    <button className="btn btn-danger" style={{ width:"100%", marginTop:12 }} onClick={() => { setMyNotes(myNotes.filter(x=>x.id!==viewing.id)); setViewing(null); }}>🗑 Delete</button>
                  </>
                )}
                {showCreate && (
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                      <div style={{ fontSize:15, fontWeight:700 }}>✏️ New Note</div>
                      <button style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:20 }} onClick={() => setShowCreate(false)}>×</button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input className="dash-input" placeholder="e.g. Physics" value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Topic *</label>
                      <input className="dash-input" placeholder="Note title" value={form.topic} onChange={e => setForm({...form, topic:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Content *</label>
                      <textarea className="dash-textarea" style={{ minHeight:120 }} placeholder="Write your notes…" value={form.content} onChange={e => setForm({...form, content:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Color</label>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {COLORS.map((c,i) => (
                          <div key={i} className={`color-dot ${form.color.name===c.name?"selected":""}`} style={{ background:c.text }} onClick={() => setForm({...form, color:c})} />
                        ))}
                      </div>
                    </div>
                    <button className="btn btn-primary" style={{ width:"100%" }} onClick={handleCreate}>Save Note</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FACULTY MATERIALS */}
      {activeTab === "faculty" && (
        loadingFac ? (
          <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>Loading…</div>
        ) : facMats.length === 0 ? (
          <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📚</div>
            No materials posted by faculty yet.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {facMats.map(item => (
              <div key={item._id} className="glass-card">
                <div style={{ display:"flex", gap:12, alignItems:"flex-start", flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{item.title}</div>
                    {item.subject && (
                      <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:10, fontSize:11, fontWeight:600, background:"rgba(6,182,212,0.15)", color:"#22d3ee", marginBottom:8 }}>
                        {item.subject}
                      </span>
                    )}
                    {item.description && (
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{item.description}</div>
                    )}
                    {item.fileUrl && (
                      <a href={item.fileUrl} target="_blank" rel="noreferrer"
                        style={{ display:"inline-block", marginTop:10, padding:"6px 14px", background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:8, color:"#60a5fa", fontSize:12, fontWeight:600, textDecoration:"none" }}>
                        📎 Download / View File
                      </a>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", flexShrink:0, textAlign:"right" }}>
                    <div>{item.facultyName || "Faculty"}</div>
                    <div style={{ marginTop:4 }}>{fmtDate(item.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
export default Notes;
