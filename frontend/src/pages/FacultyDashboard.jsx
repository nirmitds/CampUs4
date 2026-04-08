import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import API from "../api.js";
const ftok = () => localStorage.getItem("facultyToken");
const fhdrs = () => ({ Authorization: `Bearer ${ftok()}` });

const STYLE_ID = "campus-faculty-styles";
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #03030d; font-family: 'Outfit', sans-serif; color: #fff; }
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
    .fac-shell { display: flex; min-height: 100vh; flex-direction: column; }
    .fac-body  { display: flex; flex: 1; }
    .fac-topbar {
      height: 56px; background: rgba(5,5,18,0.97);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; gap: 12px;
      padding: 0 16px; position: sticky; top: 0; z-index: 300; flex-shrink: 0;
    }
    .fac-hamburger {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; color: #fff; width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 18px; flex-shrink: 0;
    }
    .fac-sidebar { width: 220px; flex-shrink: 0; background: rgba(5,5,18,0.97); border-right: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; padding: 16px 10px; position: fixed; top: 56px; bottom: 0; left: 0; overflow-y: auto; z-index: 200; transition: transform 0.3s cubic-bezier(.22,1,.36,1); }
    .fac-brand { font-size: 15px; font-weight: 800; color: #fff; padding: 0 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
    .fac-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.45); transition: all 0.15s; margin-bottom: 2px; border: none; background: none; width: 100%; text-align: left; }
    .fac-nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .fac-nav-item.active { background: rgba(6,182,212,0.15); color: #22d3ee; border-left: 3px solid #06b6d4; }
    .fac-main { margin-left: 220px; flex: 1; padding: 24px; min-height: calc(100vh - 56px); }
    .fac-header { font-size: 20px; font-weight: 800; margin-bottom: 20px; }
    .fac-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px; margin-bottom: 14px; }
    .fac-input { width: 100%; padding: 11px 14px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; font-family: Outfit,sans-serif; font-size: 14px; color: #fff; outline: none; transition: border-color 0.2s; }
    .fac-input:focus { border-color: rgba(6,182,212,0.5); }
    .fac-input::placeholder { color: rgba(255,255,255,0.28); }
    .fac-textarea { width: 100%; padding: 11px 14px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; font-family: Outfit,sans-serif; font-size: 14px; color: #fff; outline: none; resize: vertical; min-height: 80px; }
    .fac-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 6px; display: block; }
    .fac-group { margin-bottom: 14px; }
    .fac-btn { padding: 10px 20px; border-radius: 10px; font-family: Outfit,sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; }
    .fac-btn-primary { background: linear-gradient(135deg,#06b6d4,#8b5cf6); color: #fff; box-shadow: 0 4px 16px rgba(6,182,212,0.3); }
    .fac-btn-danger { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #f87171; }
    .fac-btn-ghost { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09); color: rgba(255,255,255,0.7); }
    .fac-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .fac-table th { text-align: left; padding: 9px 12px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .fac-table td { padding: 11px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .fac-table tr:last-child td { border-bottom: none; }
    .fac-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .fac-badge-cyan { background: rgba(6,182,212,0.15); color: #22d3ee; }
    .fac-badge-purple { background: rgba(139,92,246,0.15); color: #a78bfa; }
    .fac-badge-yellow { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .fac-badge-green { background: rgba(34,197,94,0.15); color: #4ade80; }
    .fac-stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px; }
    .fac-stat-val { font-size: 26px; font-weight: 800; }
    .fac-stat-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px; }
    .fac-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(3px); z-index: 190; }
    @media (max-width: 768px) {
      .fac-sidebar { transform: translateX(-100%); top: 56px; width: 260px !important; box-shadow: 4px 0 40px rgba(0,0,0,0.8); }
      .fac-sidebar.open { transform: translateX(0); }
      .fac-main { margin-left: 0 !important; padding: 14px; }
      .fac-overlay { display: block; }
    }
  `;
  document.head.appendChild(s);
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString([], { day:"numeric", month:"short", year:"numeric" });
}

const CONTENT_TYPES = [
  { id:"assignment", label:"📋 Assignments", icon:"📋" },
  { id:"timetable",  label:"📅 Timetable",   icon:"📅" },
  { id:"notice",     label:"📢 Notices",      icon:"📢" },
  { id:"result",     label:"📊 Results",      icon:"📊" },
  { id:"material",   label:"📚 Materials",    icon:"📚" },
];

export default function FacultyDashboard() {
  const navigate  = useNavigate();
  const [faculty,  setFaculty]  = useState(null);
  const [tab,      setTab]      = useState("overview");
  const [content,  setContent]  = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState({ type:"assignment", subject:"", title:"", description:"", dueDate:"", course:"", branch:"", year:"", semester:"", section:"" });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");
  const [sideOpen, setSideOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [verifyOtp,    setVerifyOtp]    = useState("");
  const [verifyStep,   setVerifyStep]   = useState("idle"); // idle | sending | otp | verifying | done
  const [verifyMsg,    setVerifyMsg]    = useState("");

  useEffect(() => {
    const t = ftok();
    if (!t) { navigate("/faculty"); return; }
    try {
      const p = JSON.parse(atob(t.split(".")[1]));
      if (p.role !== "faculty") { navigate("/faculty"); return; }
    } catch { navigate("/faculty"); return; }

    axios.get(`${API}/faculty/me`, { headers: fhdrs() }).then(r => {
      setFaculty(r.data);
      // load students matching faculty's university + classes
      axios.get(`${API}/faculty/students`, { headers: fhdrs() }).then(s => setStudents(s.data)).catch(() => {});
    }).catch(() => navigate("/faculty"));
    loadContent();
  }, []);

  const loadContent = async (type) => {
    try {
      const url = type ? `${API}/faculty/content?type=${type}` : `${API}/faculty/content`;
      const { data } = await axios.get(url, { headers: fhdrs() });
      setContent(data);
    } catch {}
  };

  useEffect(() => {
    if (tab !== "overview") loadContent(tab);
    else loadContent();
  }, [tab]);

  const handleSave = async () => {
    if (!form.title) return setMsg("Title is required.");
    setSaving(true); setMsg("");
    try {
      if (editing) {
        await axios.put(`${API}/faculty/content/${editing._id}`, form, { headers: fhdrs() });
      } else {
        await axios.post(`${API}/faculty/content`, form, { headers: fhdrs() });
      }
      setShowForm(false); setEditing(null);
      setForm({ type: tab !== "overview" ? tab : "assignment", subject:"", title:"", description:"", dueDate:"" });
      loadContent(tab !== "overview" ? tab : undefined);
    } catch (e) { setMsg(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    try { await axios.delete(`${API}/faculty/content/${id}`, { headers: fhdrs() }); loadContent(tab !== "overview" ? tab : undefined); }
    catch {}
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({ type: item.type, subject: item.subject||"", title: item.title, description: item.description||"",
      dueDate: item.dueDate ? item.dueDate.slice(0,10) : "",
      course: item.course||"", branch: item.branch||"", year: item.year||"", semester: item.semester||"", section: item.section||"" });
    setShowForm(true);
  };

  const openAdd = () => {
    setEditing(null);
    // pre-fill class from first assigned class if available
    const firstClass = faculty?.classes?.[0] || {};
    setForm({ type: tab !== "overview" ? tab : "assignment", subject:"", title:"", description:"", dueDate:"",
      course: firstClass.course||"", branch: firstClass.branch||"", year: firstClass.year||"", semester: firstClass.semester||"", section: firstClass.section||"" });
    setShowForm(true);
  };

  const tabContent = tab === "overview" ? content : content.filter(c => c.type === tab);
  const counts = {};
  CONTENT_TYPES.forEach(t => { counts[t.id] = content.filter(c => c.type === t.id).length; });

  return (
    <div className="fac-shell">
      {/* ── TOPBAR (always visible) ── */}
      <div className="fac-topbar">
        <button className="fac-hamburger" onClick={() => setSideOpen(o => !o)}>☰</button>
        <span style={{ fontWeight:700, fontSize:15 }}>👨‍🏫 Faculty Portal</span>
        <div style={{ marginLeft:"auto", fontSize:12, color:"rgba(255,255,255,0.4)" }}>
          {faculty?.name || "Faculty"}
        </div>
      </div>

      <div className="fac-body">
        {/* overlay */}
        <div className="fac-overlay"
          style={{ opacity: sideOpen ? 1 : 0, pointerEvents: sideOpen ? "auto" : "none", transition:"opacity 0.3s" }}
          onClick={() => setSideOpen(false)} />

        {/* sidebar */}
        <div className={`fac-sidebar ${sideOpen?"open":""}`}>
          <div className="fac-brand">
            <span style={{ fontSize:20 }}>👨‍🏫</span>
            <div>
              <div>Faculty Portal</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:400 }}>CampUs</div>
            </div>
          </div>

          <button className={`fac-nav-item ${tab==="overview"?"active":""}`} onClick={() => { setTab("overview"); setSideOpen(false); }}>📊 Overview</button>
          {CONTENT_TYPES.map(t => (
            <button key={t.id} className={`fac-nav-item ${tab===t.id?"active":""}`} onClick={() => { setTab(t.id); setSideOpen(false); }}>
              {t.icon} {t.label.split(" ").slice(1).join(" ")}
              {counts[t.id] > 0 && <span style={{ marginLeft:"auto", background:"rgba(6,182,212,0.2)", color:"#22d3ee", borderRadius:8, padding:"1px 6px", fontSize:10, fontWeight:800 }}>{counts[t.id]}</span>}
            </button>
          ))}
          <button className={`fac-nav-item ${tab==="students"?"active":""}`} onClick={() => { setTab("students"); setSideOpen(false); }}>
            👥 Students
            {students.length > 0 && <span style={{ marginLeft:"auto", background:"rgba(139,92,246,0.2)", color:"#a78bfa", borderRadius:8, padding:"1px 6px", fontSize:10, fontWeight:800 }}>{students.length}</span>}
          </button>

          <div style={{ marginTop:"auto", paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ padding:"8px 12px", fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:6 }}>
              {faculty?.department && <div>{faculty.department}</div>}
              {faculty?.university && <div style={{ fontSize:10 }}>{faculty.university}</div>}
            </div>
            <button className="fac-nav-item" style={{ color:"rgba(239,68,68,0.6)" }} onClick={() => { localStorage.removeItem("facultyToken"); localStorage.removeItem("facultyName"); navigate("/faculty"); }}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* main */}
        <div className="fac-main">

        {/* ── EMAIL VERIFY BANNER ── */}
        {faculty && !faculty.emailVerified && (
          <div style={{ background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.25)", borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ fontSize:22, flexShrink:0 }}>📧</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#fbbf24", marginBottom:4 }}>Verify your email to activate your account</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:10 }}>
                An OTP will be sent to <strong style={{ color:"#fff" }}>{faculty.email}</strong>
              </div>
              {verifyMsg && (
                <div style={{ fontSize:12, color: verifyMsg.startsWith("✅") ? "#4ade80" : "#f87171", marginBottom:8 }}>{verifyMsg}</div>
              )}
              {verifyStep === "idle" && (
                <button className="fac-btn fac-btn-primary" style={{ fontSize:12, padding:"7px 16px" }}
                  onClick={async () => {
                    setVerifyStep("sending"); setVerifyMsg("");
                    try {
                      const { data } = await axios.post(`${API}/faculty/send-verify-otp`, {}, { headers: fhdrs() });
                      setVerifyMsg(`✅ ${data.message}`); setVerifyStep("otp");
                    } catch (e) { setVerifyMsg(e.response?.data?.message || "Failed"); setVerifyStep("idle"); }
                  }}>
                  Send OTP to my Email
                </button>
              )}
              {verifyStep === "sending" && <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>Sending OTP…</div>}
              {verifyStep === "otp" && (
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <input
                    style={{ padding:"8px 14px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(251,191,36,0.3)", borderRadius:9, fontFamily:"Outfit,sans-serif", fontSize:16, color:"#fff", outline:"none", letterSpacing:6, textAlign:"center", width:160 }}
                    placeholder="• • • • • •" maxLength={6} value={verifyOtp}
                    onChange={e => setVerifyOtp(e.target.value.replace(/\D/g,""))} />
                  <button className="fac-btn fac-btn-primary" style={{ fontSize:12, padding:"8px 16px" }}
                    disabled={verifyStep === "verifying"}
                    onClick={async () => {
                      if (!verifyOtp) return setVerifyMsg("Enter the OTP.");
                      setVerifyStep("verifying"); setVerifyMsg("");
                      try {
                        await axios.post(`${API}/faculty/verify-email`, { otp: verifyOtp }, { headers: fhdrs() });
                        setVerifyMsg("✅ Email verified! Your account is now active.");
                        setVerifyStep("done");
                        // refresh faculty data
                        const { data } = await axios.get(`${API}/faculty/me`, { headers: fhdrs() });
                        setFaculty(data);
                      } catch (e) { setVerifyMsg(e.response?.data?.message || "Failed"); setVerifyStep("otp"); }
                    }}>
                    Verify
                  </button>
                  <button className="fac-btn fac-btn-ghost" style={{ fontSize:11, padding:"7px 12px" }}
                    onClick={async () => {
                      setVerifyStep("sending"); setVerifyMsg("");
                      try {
                        const { data } = await axios.post(`${API}/faculty/send-verify-otp`, {}, { headers: fhdrs() });
                        setVerifyMsg(`✅ ${data.message}`); setVerifyStep("otp");
                      } catch (e) { setVerifyMsg(e.response?.data?.message || "Failed"); setVerifyStep("idle"); }
                    }}>
                    Resend
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {faculty?.emailVerified && (
          <div style={{ background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:12, padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10, fontSize:13 }}>
            <span style={{ fontSize:18 }}>✅</span>
            <span style={{ color:"#4ade80", fontWeight:600 }}>Email Verified</span>
            <span style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>— {faculty.email}</span>
          </div>
        )}

        {/* add form modal */}
        {showForm && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={e => e.target===e.currentTarget && setShowForm(false)}>
            <div style={{ background:"#0f0f23", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:28, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
              <div style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>{editing ? "✏️ Edit" : "➕ Add"} Content</div>
              {msg && <div style={{ color:"#f87171", marginBottom:12, fontSize:13 }}>⚠️ {msg}</div>}
              <div className="fac-group">
                <label className="fac-label">Type</label>
                <select className="fac-input" value={form.type} onChange={e => setForm({...form, type:e.target.value})} style={{ background:"rgba(15,15,35,0.98)", cursor:"pointer" }}>
                  {CONTENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="fac-group">
                <label className="fac-label">Subject</label>
                <input className="fac-input" placeholder="e.g. Mathematics, Physics" value={form.subject} onChange={e => setForm({...form, subject:e.target.value})} />
              </div>
              <div className="fac-group">
                <label className="fac-label">Title *</label>
                <input className="fac-input" placeholder="Title" value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
              </div>
              <div className="fac-group">
                <label className="fac-label">Description</label>
                <textarea className="fac-textarea" placeholder="Details, instructions…" value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
              </div>
              {(form.type === "assignment" || form.type === "result") && (
                <div className="fac-group">
                  <label className="fac-label">{form.type === "assignment" ? "Due Date" : "Date"}</label>
                  <input className="fac-input" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})} />
                </div>
              )}
              {/* class targeting */}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:14, marginTop:4 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#22d3ee", marginBottom:10 }}>🎯 Target Class</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:10 }}>Leave blank to broadcast to all students in your university.</div>
                {/* class quick-select from assigned classes */}
                {faculty?.classes?.length > 0 && (
                  <div style={{ marginBottom:10 }}>
                    <label className="fac-label">Quick Select</label>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <button type="button" className="fac-btn fac-btn-ghost" style={{ fontSize:11, padding:"4px 10px" }}
                        onClick={() => setForm({...form, course:"", branch:"", year:"", semester:"", section:""})}>
                        🌐 All
                      </button>
                      {faculty.classes.map((cls, i) => (
                        <button key={i} type="button"
                          style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", border:"1px solid rgba(6,182,212,0.3)",
                            background: form.course===cls.course && form.branch===cls.branch && form.year===cls.year && form.semester===cls.semester
                              ? "rgba(6,182,212,0.25)" : "rgba(6,182,212,0.08)", color:"#22d3ee" }}
                          onClick={() => setForm({...form, course:cls.course||"", branch:cls.branch||"", year:cls.year||"", semester:cls.semester||"", section:cls.section||""})}>
                          {[cls.course, cls.branch, cls.year && `Y${cls.year}`, cls.semester && `S${cls.semester}`, cls.section].filter(Boolean).join(" · ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[["Course","course","B.Tech"],["Branch","branch","CSE"],["Year","year","2"],["Semester","semester","3"],["Section","section","A"]].map(([lbl,fld,ph]) => (
                    <div key={fld} className="fac-group" style={{ marginBottom:0 }}>
                      <label className="fac-label">{lbl}</label>
                      <input className="fac-input" placeholder={ph} value={form[fld]||""} onChange={e => setForm({...form, [fld]:e.target.value})} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:8 }}>
                <button className="fac-btn fac-btn-ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
                <button className="fac-btn fac-btn-primary" style={{ flex:1 }} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : editing ? "Update" : "Post"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* overview */}
        {tab === "overview" && (
          <>
            <div className="fac-header">📊 Overview</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:14, marginBottom:28 }}>
              {CONTENT_TYPES.map(t => (
                <div key={t.id} className="fac-stat" style={{ cursor:"pointer" }} onClick={() => setTab(t.id)}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{t.icon}</div>
                  <div className="fac-stat-val" style={{ color:"#22d3ee" }}>{counts[t.id]}</div>
                  <div className="fac-stat-label">{t.label.split(" ").slice(1).join(" ")}</div>
                </div>
              ))}
            </div>
            <div className="fac-card">
              <div style={{ fontWeight:700, marginBottom:14 }}>Recent Posts</div>
              {content.slice(0,8).map(item => (
                <div key={item._id} style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize:18 }}>{CONTENT_TYPES.find(t=>t.id===item.type)?.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{item.title}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{item.subject} · {fmtDate(item.createdAt)}</div>
                  </div>
                  <span className={`fac-badge fac-badge-${item.type==="assignment"?"yellow":item.type==="notice"?"cyan":item.type==="result"?"green":"purple"}`}>{item.type}</span>
                </div>
              ))}
              {content.length === 0 && <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:24 }}>No content posted yet. Use the tabs to add content.</div>}
            </div>
          </>
        )}

        {/* content tabs */}
        {tab !== "overview" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div className="fac-header" style={{ marginBottom:0 }}>
                {CONTENT_TYPES.find(t=>t.id===tab)?.label} ({tabContent.length})
              </div>
              <button className="fac-btn fac-btn-primary" onClick={openAdd}>+ Add</button>
            </div>

            {tabContent.length === 0 ? (
              <div className="fac-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>{CONTENT_TYPES.find(t=>t.id===tab)?.icon}</div>
                No {tab} posted yet.
                <br /><button className="fac-btn fac-btn-primary" style={{ marginTop:16 }} onClick={openAdd}>+ Add First</button>
              </div>
            ) : (
              <div className="fac-card" style={{ padding:0, overflow:"hidden" }}>
                <table className="fac-table">
                  <thead><tr>
                    <th>Title</th><th>Subject</th>
                    {(tab==="assignment"||tab==="result") && <th>Due Date</th>}
                    <th>Posted</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {tabContent.map(item => (
                      <tr key={item._id}>
                        <td>
                          <div style={{ fontWeight:600 }}>{item.title}</div>
                          {item.description && <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{item.description.slice(0,60)}{item.description.length>60?"…":""}</div>}
                          {(item.course||item.branch||item.year||item.semester) && (
                            <div style={{ marginTop:4 }}>
                              <span style={{ padding:"1px 7px", borderRadius:6, fontSize:10, fontWeight:700, background:"rgba(6,182,212,0.12)", color:"#22d3ee" }}>
                                {[item.course, item.branch, item.year && `Y${item.year}`, item.semester && `S${item.semester}`, item.section].filter(Boolean).join(" · ")}
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{item.subject || "—"}</td>
                        {(tab==="assignment"||tab==="result") && <td style={{ fontSize:12, color: item.dueDate && new Date(item.dueDate)<new Date() ? "#f87171" : "rgba(255,255,255,0.5)" }}>{fmtDate(item.dueDate)}</td>}
                        <td style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{fmtDate(item.createdAt)}</td>
                        <td>
                          <div style={{ display:"flex", gap:6 }}>
                            <button className="fac-btn fac-btn-ghost" style={{ padding:"5px 10px", fontSize:12 }} onClick={() => startEdit(item)}>✏️</button>
                            <button className="fac-btn fac-btn-danger" style={{ padding:"5px 10px", fontSize:12 }} onClick={() => handleDelete(item._id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {/* students tab */}
        {tab === "students" && (
          <>
            <div className="fac-header">👥 My Students ({students.length})</div>
            {students.length === 0 ? (
              <div className="fac-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
                No students found matching your assigned classes.
              </div>
            ) : (
              <>
                {/* group by class */}
                {(faculty?.classes?.length > 0 ? faculty.classes : [{}]).map((cls, ci) => {
                  const clsStudents = students.filter(s =>
                    (!cls.course   || s.course   === cls.course)   &&
                    (!cls.branch   || s.branch   === cls.branch)   &&
                    (!cls.year     || s.year     === cls.year)     &&
                    (!cls.semester || s.semester === cls.semester)
                  );
                  if (clsStudents.length === 0) return null;
                  const clsLabel = [cls.course, cls.branch, cls.year && `Year ${cls.year}`, cls.semester && `Sem ${cls.semester}`, cls.section].filter(Boolean).join(" · ") || "All Students";
                  return (
                    <div key={ci} style={{ marginBottom:20 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#22d3ee", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ padding:"3px 10px", borderRadius:8, background:"rgba(6,182,212,0.12)", border:"1px solid rgba(6,182,212,0.2)" }}>{clsLabel}</span>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{clsStudents.length} students</span>
                      </div>
                      <div className="fac-card" style={{ padding:0, overflow:"hidden" }}>
                        <table className="fac-table">
                          <thead><tr><th>Name</th><th>Roll No</th><th>Email</th><th>Course / Branch</th><th>ID Status</th></tr></thead>
                          <tbody>
                            {clsStudents.map(s => (
                              <tr key={s._id}>
                                <td>
                                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                    {s.avatar
                                      ? <img src={s.avatar} style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }} alt="" />
                                      : <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800 }}>{s.name?.[0]?.toUpperCase()}</div>
                                    }
                                    <div>
                                      <div style={{ fontWeight:600, fontSize:13 }}>{s.name}</div>
                                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>@{s.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{s.rollNo || "—"}</td>
                                <td style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{s.email}</td>
                                <td style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{[s.course, s.branch].filter(Boolean).join(" / ") || "—"}</td>
                                <td>
                                  <span style={{ padding:"2px 8px", borderRadius:8, fontSize:11, fontWeight:600,
                                    background: s.idVerified==="verified" ? "rgba(34,197,94,0.15)" : s.idVerified==="pending" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.07)",
                                    color: s.idVerified==="verified" ? "#4ade80" : s.idVerified==="pending" ? "#fbbf24" : "rgba(255,255,255,0.35)" }}>
                                    {s.idVerified === "verified" ? "✅ Verified" : s.idVerified === "pending" ? "⏳ Pending" : "—"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
