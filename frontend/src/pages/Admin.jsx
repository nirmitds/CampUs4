import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import API from "../api.js";
const tok  = () => localStorage.getItem("adminToken");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

function fmtDate(d) {
  return new Date(d).toLocaleDateString([], { day:"numeric", month:"short", year:"numeric" });
}

const ADMIN_STYLE = "campus-admin-styles";
if (!document.getElementById(ADMIN_STYLE)) {
  const s = document.createElement("style");
  s.id = ADMIN_STYLE;
  s.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #03030d; font-family: 'Outfit', sans-serif; color: #fff; }
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

    /* ── Shell ── */
    .admin-shell { display: flex; min-height: 100vh; flex-direction: column; }
    .admin-body  { display: flex; flex: 1; }

    /* ── Topbar ── */
    .admin-topbar {
      height: 56px; background: rgba(5,5,18,0.97);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; gap: 12px;
      padding: 0 16px; position: sticky; top: 0; z-index: 300;
      flex-shrink: 0;
    }
    .admin-hbg {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; color: #fff; width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 18px; flex-shrink: 0;
    }
    .admin-topbar-title { font-size: 15px; font-weight: 700; color: #fff; }

    /* ── Sidebar ── */
    .admin-sidebar {
      width: 220px; flex-shrink: 0; background: rgba(5,5,18,0.97);
      border-right: 1px solid rgba(255,255,255,0.07);
      display: flex; flex-direction: column; padding: 16px 10px;
      position: fixed; top: 56px; bottom: 0; left: 0;
      overflow-y: auto; z-index: 200;
      transition: transform 0.3s cubic-bezier(.22,1,.36,1);
    }
    .admin-brand { font-size: 16px; font-weight: 800; color: #fff; padding: 0 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .admin-nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px; cursor: pointer;
      font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.45);
      transition: all 0.15s; margin-bottom: 2px; border: none; background: none; width: 100%; text-align: left;
    }
    .admin-nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .admin-nav-item.active { background: rgba(59,130,246,0.15); color: #60a5fa; border-left: 3px solid #3b82f6; }

    /* ── Main ── */
    .admin-main { margin-left: 220px; flex: 1; padding: 24px; min-height: calc(100vh - 56px); }

    /* ── Overlay ── */
    .admin-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(3px);
      z-index: 190;
    }

    /* ── Content styles ── */
    .admin-header { font-size: 20px; font-weight: 800; margin-bottom: 20px; }
    .stat-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .stat-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; }
    .stat-box-val { font-size: 26px; font-weight: 800; }
    .stat-box-label { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .admin-table th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .admin-table td { padding: 11px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .admin-table tr:last-child td { border-bottom: none; }
    .admin-table tr:hover td { background: rgba(255,255,255,0.02); }
    .admin-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px; margin-bottom: 14px; }
    .badge-sm { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge-green  { background: rgba(34,197,94,0.15);  color: #4ade80; }
    .badge-yellow { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .badge-red    { background: rgba(239,68,68,0.15);  color: #f87171; }
    .badge-blue   { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .badge-gray   { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
    .admin-search { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 9px 14px; color: #fff; font-family: Outfit,sans-serif; font-size: 13px; outline: none; width: 100%; max-width: 260px; }
    .admin-search::placeholder { color: rgba(255,255,255,0.28); }
    .admin-btn { padding: 6px 14px; border-radius: 8px; font-family: Outfit,sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
    .admin-btn-green { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; }
    .admin-btn-red   { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #f87171; }
    .admin-btn-blue  { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60a5fa; }
    .id-img { width: 100%; max-height: 240px; object-fit: contain; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.4); }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .admin-sidebar {
        transform: translateX(-100%);
        top: 56px; width: 260px !important;
        box-shadow: 4px 0 40px rgba(0,0,0,0.8);
      }
      .admin-sidebar.open { transform: translateX(0); }
      .admin-main { margin-left: 0 !important; padding: 14px; }
      .admin-overlay { display: block; }
      .stat-row { grid-template-columns: repeat(2, 1fr); }
    }
  `;
  document.head.appendChild(s);
}

export default function Admin() {
  const navigate = useNavigate();
  const [tab,          setTab]          = useState("overview");
  const [sideOpen,     setSideOpen]     = useState(false);
  const [stats,        setStats]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [requests,     setRequests]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pendingIds,   setPendingIds]   = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [search,       setSearch]       = useState("");
  const [idFilter,     setIdFilter]     = useState("all");
  const [usersWithId,  setUsersWithId]  = useState([]); // users including idCard field
  const [deposits,     setDeposits]     = useState([]);
  const [rejectNote,   setRejectNote]   = useState("");
  const [deleteReqs,   setDeleteReqs]   = useState([]);
  const [resetPwUser,  setResetPwUser]  = useState(null);
  const [resetPwVal,   setResetPwVal]   = useState("");
  const [assignFac,    setAssignFac]    = useState(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignFilter, setAssignFilter] = useState("all"); // unassigned | assigned | all
  const [assignSelected, setAssignSelected] = useState(new Set());
  const [sessionsUser, setSessionsUser] = useState(null); // show sessions for this userId
  const [loading,      setLoading]      = useState(false);
  const [faculty,      setFaculty]      = useState([]);
  const [facForm,      setFacForm]      = useState({ facultyId:"", password:"", name:"", department:"", university:"", subjects:"", classes:[], email:"" });
  const [facMsg,       setFacMsg]       = useState("");
  const [facSaving,    setFacSaving]    = useState(false);
  const [showFacForm,  setShowFacForm]  = useState(false);
  const [editingFac,   setEditingFac]   = useState(null);   // faculty object being edited
  const [editFacForm,  setEditFacForm]  = useState({});
  const [editFacMsg,   setEditFacMsg]   = useState("");
  const [editFacSaving,setEditFacSaving]= useState(false);
  const [showEditFac,  setShowEditFac]  = useState(false);

  useEffect(() => {
    /* check admin token */
    try {
      const token = tok();
      if (!token) { navigate("/admin"); return; }
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") { navigate("/admin"); return; }
    } catch { navigate("/admin"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, r, t, p] = await Promise.all([
        axios.get(`${API}/admin/stats`,        { headers: hdrs() }),
        axios.get(`${API}/admin/users`,        { headers: hdrs() }),
        axios.get(`${API}/admin/requests`,     { headers: hdrs() }),
        axios.get(`${API}/admin/transactions`, { headers: hdrs() }),
        axios.get(`${API}/admin/pending-ids`,  { headers: hdrs() }),
      ]);
      setStats(s.data); setUsers(u.data); setRequests(r.data);
      setTransactions(t.data); setPendingIds(p.data);
      /* load deposits */
      try { const d = await axios.get(`${API}/admin/deposits`, { headers: hdrs() }); setDeposits(d.data); } catch {}
      /* load delete requests */
      try { const dr = await axios.get(`${API}/admin/delete-requests`, { headers: hdrs() }); setDeleteReqs(dr.data); } catch {}
      /* load users with idCard for ID verify tab */
      try { const wi = await axios.get(`${API}/admin/users-with-id`, { headers: hdrs() }); setUsersWithId(wi.data); } catch {}
      /* load faculty */
      try { const f = await axios.get(`${API}/admin/faculty`, { headers: hdrs() }); setFaculty(f.data); } catch {}
    } catch (e) {
      if (e.response?.status === 403 || e.response?.status === 401) navigate("/admin");
    } finally { setLoading(false); }
  };

  const verifyId = async (userId, action) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/verify-id`,
        { action, reason: rejectReason }, { headers: hdrs() });
      setRejectReason("");
      setSelectedUser(null);
      loadAll();
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  const changeRole = async (userId, role) => {
    if (!confirm(`Change role to ${role}?`)) return;
    try {
      await axios.put(`${API}/admin/users/${userId}/role`, { role }, { headers: hdrs() });
      loadAll();
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  const filteredUsers = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIdUsers = usersWithId.filter(u => {
    const status = u.idVerified || "none";
    return idFilter === "all" || status === idFilter;
  });

  const NAV = [
    { id:"overview",        icon:"📊", label:"Overview"         },
    { id:"users",           icon:"👥", label:"Users"            },
    { id:"faculty",         icon:"👨‍🏫", label:"Faculty"          },
    { id:"verify-ids",      icon:"🪪", label:`ID Verify ${pendingIds.length > 0 ? `(${pendingIds.length})` : ""}` },
    { id:"deposits",        icon:"💳", label:"Deposits"         },
    { id:"delete-requests", icon:"🗑️", label:"Delete Requests"  },
    { id:"requests",        icon:"🔄", label:"Requests"         },
    { id:"transactions",    icon:"💰", label:"Transactions"     },
  ];

  return (
    <div className="admin-shell">
      {/* ── TOPBAR (always visible) ── */}
      <div className="admin-topbar">
        <button className="admin-hbg" onClick={() => setSideOpen(o => !o)}>☰</button>
        <img src="/logo.png" alt="CampUs" style={{ width:24, height:24 }} />
        <span className="admin-topbar-title">CampUs Admin</span>
        <div style={{ marginLeft:"auto", fontSize:12, color:"rgba(255,255,255,0.4)" }}>
          {localStorage.getItem("adminName") || "Admin"}
        </div>
      </div>

      <div className="admin-body">
        {/* mobile overlay */}
        <div className="admin-overlay"
          style={{ opacity: sideOpen ? 1 : 0, pointerEvents: sideOpen ? "auto" : "none", transition:"opacity 0.3s" }}
          onClick={() => setSideOpen(false)} />

        {/* sidebar */}
        <div className={`admin-sidebar ${sideOpen ? "open" : ""}`}>
          <div className="admin-brand">
            <img src="/logo.png" alt="CampUs" style={{ width:24, height:24, flexShrink:0 }} />
            CampUs Admin
          </div>
          {NAV.map(n => (
            <button key={n.id} className={`admin-nav-item ${tab===n.id?"active":""}`}
              onClick={() => { setTab(n.id); setSideOpen(false); }}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
          <div style={{ marginTop:"auto", paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
            <button className="admin-nav-item" onClick={() => {
              const studentToken = localStorage.getItem("token");
              if (studentToken) navigate("/student");
              else navigate("/");
            }}>
              🏠 Student App
            </button>
            <button className="admin-nav-item" style={{ color:"rgba(239,68,68,0.6)" }} onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminName");
              navigate("/admin");
            }}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* main content */}
        <div className="admin-main">
          {loading && <div style={{ color:"rgba(255,255,255,0.4)", marginBottom:16 }}>Loading…</div>}

        {/* ── OVERVIEW ── */}
        {tab === "overview" && stats && (
          <>
            <div className="admin-header">📊 Overview</div>
            <div className="stat-row">
              {[
                ["👥","Total Users",     stats.users,            "#60a5fa"],
                ["🔄","Total Requests",  stats.requests,         "#a78bfa"],
                ["📬","Open Requests",   stats.openRequests,     "#4ade80"],
                ["✅","Accepted",        stats.acceptedRequests, "#fbbf24"],
                ["💬","Messages",        stats.messages,         "#22d3ee"],
                ["💰","Transactions",    stats.transactions,     "#f472b6"],
                ["💰","Total Coins",     stats.totalCoins,       "#fbbf24"],
                ["🪪","Pending IDs",     stats.pendingId,        "#f87171"],
              ].map(([icon, label, val, color]) => (
                <div key={label} className="stat-box">
                  <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
                  <div className="stat-box-val" style={{ color }}>{val?.toLocaleString()}</div>
                  <div className="stat-box-label">{label}</div>
                </div>
              ))}
            </div>
            {pendingIds.length > 0 && (
              <div className="admin-card" style={{ borderColor:"rgba(251,191,36,0.3)", background:"rgba(251,191,36,0.05)" }}>
                <div style={{ fontWeight:700, marginBottom:8 }}>⚠️ {pendingIds.length} ID card{pendingIds.length>1?"s":""} waiting for verification</div>
                <button className="admin-btn admin-btn-blue" onClick={() => setTab("verify-ids")}>
                  Review Now →
                </button>
              </div>
            )}

            {/* Recent Registrations */}
            <div className="admin-card" style={{ marginTop:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>🆕 Recent Registrations</div>
                <button className="admin-btn admin-btn-blue" style={{ fontSize:11 }} onClick={() => setTab("users")}>View All →</button>
              </div>
              {users.length === 0 ? (
                <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13, textAlign:"center", padding:16 }}>No users yet</div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>User</th><th>University</th><th>ID Status</th><th>Registered</th></tr></thead>
                  <tbody>
                    {[...users].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,8).map(u => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>@{u.username} · {u.email}</div>
                        </td>
                        <td style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{u.university || "—"}</td>
                        <td>
                          <span className={`badge-sm ${u.idVerified==="verified"?"badge-green":u.idVerified==="pending"?"badge-yellow":u.idVerified==="rejected"?"badge-red":"badge-gray"}`}>
                            {u.idVerified || "none"}
                          </span>
                        </td>
                        <td style={{ fontSize:11, color:"rgba(255,255,255,0.4)", whiteSpace:"nowrap" }}>
                          {new Date(u.createdAt).toLocaleString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── FACULTY ── */}
        {tab === "faculty" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div className="admin-header" style={{ marginBottom:0 }}>👨‍🏫 Faculty ({faculty.length})</div>
              <button className="admin-btn admin-btn-blue" onClick={() => {
                setFacForm({ facultyId:"", password:"", name:"", department:"", university:"", subjects:"", classes:[], email:"" });
                setFacMsg(""); setShowFacForm(true);
              }}>+ Add Faculty</button>
            </div>

            {showFacForm && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
                onClick={e => e.target===e.currentTarget && setShowFacForm(false)}>
                <div style={{ background:"#0f0f23", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:28, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
                  <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>➕ Add Faculty Account</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:18 }}>Login credentials will be emailed to the faculty automatically.</div>
                  {facMsg && <div style={{ color: facMsg.startsWith("✅") ? "#4ade80" : "#f87171", marginBottom:12, fontSize:13, padding:"8px 12px", background: facMsg.startsWith("✅") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", borderRadius:8 }}>{facMsg}</div>}

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                    {[
                      ["Faculty ID *",  "facultyId",  "text",     "e.g. FAC001"],
                      ["Password *",    "password",   "password", "Min 6 chars"],
                      ["Full Name *",   "name",       "text",     "Dr. John Smith"],
                      ["Email *",       "email",      "email",    "faculty@university.edu"],
                      ["Department",    "department", "text",     "Computer Science"],
                      ["University",    "university", "text",     "KR Mangalam University"],
                      ["Subjects",      "subjects",   "text",     "Maths, Physics"],
                    ].map(([label, key, type, ph]) => (
                      <div key={key} style={{ gridColumn: key === "subjects" ? "1 / -1" : "auto" }}>
                        <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.45)", marginBottom:4 }}>{label}</div>
                        <input type={type}
                          style={{ width:"100%", padding:"9px 12px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:9, fontFamily:"Outfit,sans-serif", fontSize:13, color:"#fff", outline:"none", boxSizing:"border-box" }}
                          placeholder={ph} value={facForm[key] || ""}
                          onChange={e => setFacForm({ ...facForm, [key]: e.target.value })} />
                      </div>
                    ))}
                  </div>

                  {/* class assignments */}
                  <div style={{ marginTop:14, marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#22d3ee" }}>📚 Assigned Classes</div>
                      <button className="admin-btn admin-btn-blue" style={{ fontSize:11, padding:"4px 10px" }}
                        onClick={() => setFacForm({ ...facForm, classes: [...(facForm.classes||[]), { course:"", branch:"", year:"", semester:"", section:"" }] })}>
                        + Add Class
                      </button>
                    </div>
                    {(facForm.classes||[]).length === 0 && (
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", padding:"6px 0" }}>No classes assigned yet.</div>
                    )}
                    {(facForm.classes||[]).map((cls, idx) => (
                      <div key={idx} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:10, marginBottom:8 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6 }}>
                          {[["Course","course","B.Tech"],["Branch","branch","CSE"],["Year","year","2"],["Sem","semester","3"],["Sec","section","A"]].map(([lbl,fld,ph]) => (
                            <div key={fld}>
                              <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>{lbl}</div>
                              <input style={{ width:"100%", padding:"6px 8px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:7, fontFamily:"Outfit,sans-serif", fontSize:12, color:"#fff", outline:"none", boxSizing:"border-box" }}
                                placeholder={ph} value={cls[fld]||""}
                                onChange={e => {
                                  const updated = [...facForm.classes];
                                  updated[idx] = { ...updated[idx], [fld]: e.target.value };
                                  setFacForm({ ...facForm, classes: updated });
                                }} />
                            </div>
                          ))}
                        </div>
                        <button style={{ marginTop:6, background:"none", border:"none", color:"#f87171", fontSize:11, cursor:"pointer", fontFamily:"Outfit,sans-serif" }}
                          onClick={() => setFacForm({ ...facForm, classes: facForm.classes.filter((_,i)=>i!==idx) })}>
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:"flex", gap:10, marginTop:14 }}>
                    <button className="admin-btn" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.7)" }}
                      onClick={() => setShowFacForm(false)}>Cancel</button>
                    <button className="admin-btn admin-btn-blue" style={{ flex:1 }} disabled={facSaving}
                      onClick={async () => {
                        if (!facForm.facultyId || !facForm.password || !facForm.name) return setFacMsg("Faculty ID, password and name are required.");
                        if (!facForm.email) return setFacMsg("Faculty email is required.");
                        setFacSaving(true); setFacMsg("");
                        try {
                          await axios.post(`${API}/admin/faculty`, facForm, { headers: hdrs() });
                          setFacMsg("✅ Faculty account created. Login credentials sent to their email.");
                          setShowFacForm(false);
                          const f = await axios.get(`${API}/admin/faculty`, { headers: hdrs() }); setFaculty(f.data);
                        } catch (e) { setFacMsg(e.response?.data?.message || "Failed"); }
                        finally { setFacSaving(false); }
                      }}>
                      {facSaving ? "Creating…" : "📧 Create & Send Credentials"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {faculty.length === 0 ? (
              <div className="admin-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👨‍🏫</div>
                No faculty accounts yet. Add one above.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {faculty.map(f => (
                  <div key={f._id} className="admin-card">
                    <div style={{ display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
                      <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#06b6d4,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>👨‍🏫</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:4 }}>
                          <span style={{ fontWeight:700, fontSize:15 }}>{f.name}</span>
                          <span className="badge-sm badge-blue">{f.facultyId}</span>
                          {f.emailVerified
                            ? <span className="badge-sm badge-green">✅ Email Verified</span>
                            : <span className="badge-sm badge-yellow">⚠️ Not Verified</span>
                          }
                          {f.active === false && <span className="badge-sm badge-red">Disabled</span>}
                        </div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:6 }}>
                          {f.email && <span style={{ marginRight:8 }}>📧 {f.email}</span>}
                          {f.department && <span>{f.department} · </span>}
                          {f.university && <span>{f.university}</span>}
                        </div>
                        {f.subjects?.length > 0 && (
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:8 }}>
                            📖 {Array.isArray(f.subjects) ? f.subjects.join(", ") : f.subjects}
                          </div>
                        )}
                        {/* classes */}
                        {f.classes?.length > 0 && (
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {f.classes.map((cls, i) => (
                              <span key={i} style={{ padding:"3px 10px", borderRadius:8, fontSize:11, fontWeight:600, background:"rgba(6,182,212,0.12)", border:"1px solid rgba(6,182,212,0.2)", color:"#22d3ee" }}>
                                {[cls.course, cls.branch, cls.year && `Y${cls.year}`, cls.semester && `S${cls.semester}`, cls.section].filter(Boolean).join(" · ")}
                              </span>
                            ))}
                          </div>
                        )}
                        {(!f.classes || f.classes.length === 0) && (
                          <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>No classes assigned</span>
                        )}
                      </div>
                      <div style={{ display:"flex", gap:8, flexShrink:0, flexWrap:"wrap" }}>
                        {/* admin can manually toggle verification */}
                        <button
                          className={`admin-btn ${f.emailVerified ? "admin-btn-red" : "admin-btn-green"}`}
                          onClick={async () => {
                            if (!confirm(`${f.emailVerified ? "Remove" : "Mark"} ${f.name} as verified?`)) return;
                            try {
                              await axios.put(`${API}/admin/faculty/${f._id}`, { emailVerified: !f.emailVerified }, { headers: hdrs() });
                              const res = await axios.get(`${API}/admin/faculty`, { headers: hdrs() }); setFaculty(res.data);
                            } catch (e) { alert(e.response?.data?.message || "Failed"); }
                          }}>
                          {f.emailVerified ? "✕ Unverify" : "✅ Verify"}
                        </button>
                        <button className="admin-btn" style={{ background:"rgba(6,182,212,0.15)", border:"1px solid rgba(6,182,212,0.3)", color:"#22d3ee" }}
                          onClick={() => { 
                            setAssignFac({ ...f, _selectedClass: f.classes?.length > 0 ? 0 : undefined }); 
                            setAssignSearch(""); 
                            setAssignFilter("all");
                            setAssignSelected(new Set());
                          }}>
                          👥 Assign Students
                        </button>
                        <button className="admin-btn admin-btn-blue"
                          onClick={() => {
                            setEditingFac(f);
                            setEditFacForm({
                              name: f.name, email: f.email||"", department: f.department||"",
                              university: f.university||"", subjects: Array.isArray(f.subjects) ? f.subjects.join(", ") : (f.subjects||""),
                              classes: f.classes ? JSON.parse(JSON.stringify(f.classes)) : [],
                              password: "", active: f.active !== false,
                            });
                            setEditFacMsg(""); setShowEditFac(true);
                          }}>
                          ✏️ Edit
                        </button>
                        <button className="admin-btn admin-btn-red"
                          onClick={async () => {
                            if (!confirm(`Delete faculty ${f.name}?`)) return;
                            try {
                              await axios.delete(`${API}/admin/faculty/${f._id}`, { headers: hdrs() });
                              const res = await axios.get(`${API}/admin/faculty`, { headers: hdrs() }); setFaculty(res.data);
                            } catch (e) { alert(e.response?.data?.message || "Failed"); }
                          }}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ASSIGN STUDENTS MODAL ── */}
        {assignFac && (() => {
          const cls = assignFac._selectedClass !== undefined ? assignFac.classes[assignFac._selectedClass] : null;
          const sameUniv = users.filter(u => {
            if (u.role === "admin") return false;
            if (!assignFac.university) return true; // no university set on faculty — show all
            const facUni = assignFac.university.trim().toLowerCase();
            const stuUni = (u.university || "").trim().toLowerCase();
            if (!stuUni) return true; // student has no university set — show them
            // partial match either way
            return stuUni.includes(facUni) || facUni.includes(stuUni);
          });
          const isAssigned = u => cls && u.course === cls.course && u.branch === cls.branch && u.year === cls.year && u.semester === cls.semester;
          const searched = sameUniv.filter(u => !assignSearch ||
            u.name?.toLowerCase().includes(assignSearch.toLowerCase()) ||
            u.username?.toLowerCase().includes(assignSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(assignSearch.toLowerCase()) ||
            u.rollNo?.toLowerCase().includes(assignSearch.toLowerCase())
          );
          const filtered = searched.filter(u =>
            assignFilter === "assigned"   ? isAssigned(u) :
            assignFilter === "unassigned" ? !isAssigned(u) : true
          );
          const assignedCount = cls ? sameUniv.filter(isAssigned).length : 0;
          const unassignedCount = cls ? sameUniv.filter(u => !isAssigned(u)).length : 0;

          const doAssign = async (userId) => {
            if (!cls) return alert("Select a class first");
            setAssignSaving(true);
            try {
              const { data: updated } = await axios.put(`${API}/admin/users/${userId}/assign-class`,
                { course: cls.course, branch: cls.branch, year: cls.year, semester: cls.semester, section: cls.section },
                { headers: hdrs() });
              // Update local users state immediately so modal reflects change
              setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...updated } : u));
            } catch (e) { alert(e.response?.data?.message || "Failed"); }
            finally { setAssignSaving(false); }
          };

          const doUnassign = async (userId) => {
            setAssignSaving(true);
            try {
              const { data: updated } = await axios.put(`${API}/admin/users/${userId}/assign-class`,
                { course: "", branch: "", year: "", semester: "", section: "" },
                { headers: hdrs() });
              // Update local users state immediately
              setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...updated } : u));
            } catch (e) { alert(e.response?.data?.message || "Failed"); }
            finally { setAssignSaving(false); }
          };

          const doBulkAssign = async () => {
            if (!cls) return alert("Select a class first");
            if (assignSelected.size === 0) return alert("Select students first");
            setAssignSaving(true);
            try {
              const results = await Promise.all([...assignSelected].map(id =>
                axios.put(`${API}/admin/users/${id}/assign-class`,
                  { course: cls.course, branch: cls.branch, year: cls.year, semester: cls.semester, section: cls.section },
                  { headers: hdrs() }).then(r => r.data)
              ));
              // Update all assigned users in local state immediately
              setUsers(prev => prev.map(u => {
                const updated = results.find(r => r._id === u._id);
                return updated ? { ...u, ...updated } : u;
              }));
              setAssignSelected(new Set());
            } catch (e) { alert(e.response?.data?.message || "Failed"); }
            finally { setAssignSaving(false); }
          };

          return (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
              onClick={e => e.target===e.currentTarget && setAssignFac(null)}>
              <div style={{ background:"#0d0d20", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:24, width:"100%", maxWidth:600, maxHeight:"90vh", display:"flex", flexDirection:"column", gap:0 }}>

                {/* Header */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:17, fontWeight:800, marginBottom:2 }}>👥 Assign Students</div>
                  <div style={{ fontSize:13, color:"#22d3ee", fontWeight:600 }}>{assignFac.name}
                    {assignFac.department && <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400 }}> · {assignFac.department}</span>}
                    {assignFac.university && <span style={{ color:"rgba(255,255,255,0.25)", fontWeight:400 }}> · {assignFac.university}</span>}
                  </div>
                </div>

                {/* Class selector */}
                {assignFac.classes?.length > 0 ? (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Select Target Class</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {assignFac.classes.map((c, i) => {
                        const label = [c.course, c.branch, c.year && `Y${c.year}`, c.semester && `S${c.semester}`, c.section].filter(Boolean).join(" · ");
                        const count = users.filter(u => u.role !== "admin" && u.course === c.course && u.branch === c.branch && u.year === c.year && u.semester === c.semester).length;
                        const sel = assignFac._selectedClass === i;
                        return (
                          <button key={i}
                            style={{ padding:"6px 14px", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer",
                              border: sel ? "1px solid rgba(6,182,212,0.6)" : "1px solid rgba(6,182,212,0.2)",
                              background: sel ? "rgba(6,182,212,0.2)" : "rgba(6,182,212,0.06)", color: sel ? "#22d3ee" : "rgba(255,255,255,0.5)",
                              display:"flex", alignItems:"center", gap:6 }}
                            onClick={() => { setAssignFac({ ...assignFac, _selectedClass: i }); setAssignSelected(new Set()); }}>
                            {label}
                            <span style={{ background: sel ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.08)", borderRadius:6, padding:"1px 6px", fontSize:10 }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:"12px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, fontSize:12, color:"#f87171", marginBottom:14 }}>
                    ⚠️ This faculty has no classes assigned. Edit the faculty first to add classes.
                  </div>
                )}

                {/* Stats row */}
                {cls && (
                  <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                    {[
                      { label:"Assigned", val:assignedCount, color:"#22d3ee" },
                      { label:"Unassigned", val:unassignedCount, color:"#f59e0b" },
                      { label:"Total", val:sameUniv.length, color:"rgba(255,255,255,0.5)" },
                    ].map(s => (
                      <div key={s.label} style={{ flex:1, padding:"8px 10px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.val}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Filter tabs + search */}
                <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                  {[["unassigned","Unassigned"], ["assigned","Assigned"], ["all","All"]].map(([k,l]) => (
                    <button key={k}
                      style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none",
                        background: assignFilter===k ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.06)",
                        color: assignFilter===k ? "#60a5fa" : "rgba(255,255,255,0.45)" }}
                      onClick={() => setAssignFilter(k)}>{l}</button>
                  ))}
                  <input style={{ flex:1, minWidth:160, padding:"5px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:8, color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:12, outline:"none" }}
                    placeholder="Search name, username, roll no..."
                    value={assignSearch} onChange={e => setAssignSearch(e.target.value)} />
                </div>

                {/* Bulk assign bar */}
                {assignSelected.size > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.25)", borderRadius:10, marginBottom:8 }}>
                    <span style={{ fontSize:12, color:"#60a5fa", flex:1 }}>{assignSelected.size} student{assignSelected.size>1?"s":""} selected</span>
                    <button className="admin-btn admin-btn-blue" style={{ fontSize:11, padding:"4px 12px" }}
                      disabled={!cls || assignSaving} onClick={doBulkAssign}>
                      {assignSaving ? "…" : `Assign All (${assignSelected.size})`}
                    </button>
                    <button style={{ fontSize:11, padding:"4px 10px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, color:"rgba(255,255,255,0.5)", cursor:"pointer", fontFamily:"Outfit,sans-serif" }}
                      onClick={() => setAssignSelected(new Set())}>Clear</button>
                  </div>
                )}

                {/* Student list */}
                <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:5, maxHeight:320 }}>
                  {filtered.length === 0 && (
                    <div style={{ textAlign:"center", padding:32, color:"rgba(255,255,255,0.3)", fontSize:13 }}>
                      {assignSearch ? "No students match your search" : 
                       assignFilter === "assigned" ? "No students assigned to this class yet" : 
                       sameUniv.length === 0 ? `No students from ${assignFac.university || "this university"} found` :
                       "No students found"}
                    </div>
                  )}
                  {filtered.map(u => {
                    const assigned = isAssigned(u);
                    const sel = assignSelected.has(u._id);
                    return (
                      <div key={u._id}
                        style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 12px", background: sel ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)", borderRadius:10,
                          border:`1px solid ${sel ? "rgba(59,130,246,0.35)" : assigned ? "rgba(6,182,212,0.25)" : "rgba(255,255,255,0.06)"}`, cursor:"pointer" }}
                        onClick={() => {
                          if (assigned) return;
                          const next = new Set(assignSelected);
                          sel ? next.delete(u._id) : next.add(u._id);
                          setAssignSelected(next);
                        }}>
                        {/* checkbox */}
                        {!assigned && (
                          <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${sel ? "#3b82f6" : "rgba(255,255,255,0.2)"}`, background: sel ? "#3b82f6" : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {sel && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                          </div>
                        )}
                        {/* avatar */}
                        <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0, overflow:"hidden" }}>
                          {u.avatar ? <img src={u.avatar} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" /> : u.name?.[0]?.toUpperCase()}
                        </div>
                        {/* info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{u.name}
                            {u.rollNo && <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginLeft:6 }}>#{u.rollNo}</span>}
                          </div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>
                            @{u.username}
                            {u.course && <span style={{ marginLeft:6, color:"rgba(255,255,255,0.3)" }}>{[u.course, u.branch, u.year && `Y${u.year}`, u.semester && `S${u.semester}`].filter(Boolean).join(" · ")}</span>}
                            {!u.course && <span style={{ marginLeft:6, color:"#f59e0b" }}>No class</span>}
                          </div>
                        </div>
                        {/* action */}
                        {assigned ? (
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:11, color:"#22d3ee", fontWeight:600 }}>✓ Assigned</span>
                            <button style={{ fontSize:10, padding:"3px 8px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:6, color:"#f87171", cursor:"pointer", fontFamily:"Outfit,sans-serif" }}
                              disabled={assignSaving}
                              onClick={e => { e.stopPropagation(); doUnassign(u._id); }}>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button className="admin-btn admin-btn-blue" style={{ fontSize:11, padding:"4px 10px", flexShrink:0 }}
                            disabled={!cls || assignSaving}
                            onClick={e => { e.stopPropagation(); doAssign(u._id); }}>
                            {assignSaving ? "…" : "Assign"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>
                    Click a student to select · Bulk assign with checkbox
                  </div>
                  <button className="admin-btn" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.7)" }}
                    onClick={() => { setAssignFac(null); setAssignSelected(new Set()); }}>Close</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── FACULTY EDIT MODAL ── */}
        {showEditFac && editingFac && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={e => e.target===e.currentTarget && setShowEditFac(false)}>
            <div style={{ background:"#0f0f23", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:28, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
              <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>✏️ Edit Faculty — {editingFac.name}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:18 }}>Leave password blank to keep existing password.</div>
              {editFacMsg && <div style={{ color: editFacMsg.startsWith("✅") ? "#4ade80" : "#f87171", marginBottom:12, fontSize:13, padding:"8px 12px", background: editFacMsg.startsWith("✅") ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", borderRadius:8 }}>{editFacMsg}</div>}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                {[
                  ["Full Name *",  "name",       "text",     "Dr. John Smith"],
                  ["Email",        "email",      "email",    "faculty@university.edu"],
                  ["New Password", "password",   "password", "Leave blank to keep current"],
                  ["Department",   "department", "text",     "Computer Science"],
                  ["University",   "university", "text",     "KR Mangalam University"],
                  ["Subjects",     "subjects",   "text",     "Maths, Physics"],
                ].map(([label, key, type, ph]) => (
                  <div key={key} style={{ gridColumn: key === "subjects" ? "1 / -1" : "auto" }}>
                    <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.45)", marginBottom:4 }}>{label}</div>
                    <input type={type}
                      style={{ width:"100%", padding:"9px 12px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:9, fontFamily:"Outfit,sans-serif", fontSize:13, color:"#fff", outline:"none", boxSizing:"border-box" }}
                      placeholder={ph} value={editFacForm[key] || ""}
                      onChange={e => setEditFacForm({ ...editFacForm, [key]: e.target.value })} />
                  </div>
                ))}
              </div>

              {/* active toggle */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"10px 14px", background:"rgba(255,255,255,0.04)", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:13, flex:1 }}>Account Status</span>
                <button
                  onClick={() => setEditFacForm({ ...editFacForm, active: !editFacForm.active })}
                  style={{ padding:"5px 16px", borderRadius:8, border:"none", fontFamily:"Outfit,sans-serif", fontSize:12, fontWeight:700, cursor:"pointer",
                    background: editFacForm.active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    color: editFacForm.active ? "#4ade80" : "#f87171" }}>
                  {editFacForm.active ? "✅ Active" : "🚫 Disabled"}
                </button>
              </div>

              {/* class assignments */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#22d3ee" }}>📚 Assigned Classes</div>
                  <button className="admin-btn admin-btn-blue" style={{ fontSize:11, padding:"4px 10px" }}
                    onClick={() => setEditFacForm({ ...editFacForm, classes: [...(editFacForm.classes||[]), { course:"", branch:"", year:"", semester:"", section:"" }] })}>
                    + Add Class
                  </button>
                </div>
                {(editFacForm.classes||[]).length === 0 && (
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", padding:"6px 0" }}>No classes assigned.</div>
                )}
                {(editFacForm.classes||[]).map((cls, idx) => (
                  <div key={idx} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:10, marginBottom:8 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6 }}>
                      {[["Course","course","B.Tech"],["Branch","branch","CSE"],["Year","year","2"],["Sem","semester","3"],["Sec","section","A"]].map(([lbl,fld,ph]) => (
                        <div key={fld}>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>{lbl}</div>
                          <input style={{ width:"100%", padding:"6px 8px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:7, fontFamily:"Outfit,sans-serif", fontSize:12, color:"#fff", outline:"none", boxSizing:"border-box" }}
                            placeholder={ph} value={cls[fld]||""}
                            onChange={e => {
                              const updated = [...editFacForm.classes];
                              updated[idx] = { ...updated[idx], [fld]: e.target.value };
                              setEditFacForm({ ...editFacForm, classes: updated });
                            }} />
                        </div>
                      ))}
                    </div>
                    <button style={{ marginTop:6, background:"none", border:"none", color:"#f87171", fontSize:11, cursor:"pointer", fontFamily:"Outfit,sans-serif" }}
                      onClick={() => setEditFacForm({ ...editFacForm, classes: editFacForm.classes.filter((_,i)=>i!==idx) })}>
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button className="admin-btn" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.7)" }}
                  onClick={() => setShowEditFac(false)}>Cancel</button>
                <button className="admin-btn admin-btn-blue" style={{ flex:1 }} disabled={editFacSaving}
                  onClick={async () => {
                    if (!editFacForm.name) return setEditFacMsg("Name is required.");
                    setEditFacSaving(true); setEditFacMsg("");
                    try {
                      const payload = { ...editFacForm };
                      if (!payload.password) delete payload.password; // don't send empty password
                      await axios.put(`${API}/admin/faculty/${editingFac._id}`, payload, { headers: hdrs() });
                      setEditFacMsg("✅ Faculty updated.");
                      setShowEditFac(false);
                      const f = await axios.get(`${API}/admin/faculty`, { headers: hdrs() }); setFaculty(f.data);
                    } catch (e) { setEditFacMsg(e.response?.data?.message || "Failed"); }
                    finally { setEditFacSaving(false); }
                  }}>
                  {editFacSaving ? "Saving…" : "💾 Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div className="admin-header" style={{ marginBottom:0 }}>👥 Users ({users.length})</div>
              <input className="admin-search" placeholder="Search name, username, email…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="admin-card" style={{ padding:0, overflow:"hidden" }}>
              <table className="admin-table">
                <thead><tr>
                  <th>User</th><th>Email</th><th>University</th><th>Coins</th><th>ID Status</th><th>Role</th><th>Last Login</th><th>Device</th><th>Joined</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ fontWeight:600 }}>{u.name}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>@{u.username}</div>
                      </td>
                      <td style={{ color:"rgba(255,255,255,0.5)", fontSize:12 }}>{u.email}</td>
                      <td style={{ fontSize:12 }}>{u.university || <span style={{ color:"rgba(255,255,255,0.25)" }}>—</span>}</td>
                      <td style={{ color:"#fbbf24", fontWeight:700 }}>💰 {u.coins}</td>
                      <td>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          <span className={`badge-sm ${u.idVerified==="verified"?"badge-green":u.idVerified==="pending"?"badge-yellow":u.idVerified==="rejected"?"badge-red":"badge-gray"}`}>
                            🪪 {u.idVerified || "none"}
                          </span>
                          <span className={`badge-sm ${u.emailVerified?"badge-green":"badge-red"}`}>
                            📧 {u.emailVerified ? "verified" : "unverified"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-sm ${u.role==="admin"?"badge-blue":"badge-gray"}`}>{u.role}</span>
                      </td>
                      <td style={{ fontSize:11, color:"rgba(255,255,255,0.4)", minWidth:100 }}>
                        {u.lastLogin?.at ? (
                          <div>
                            <div>{new Date(u.lastLogin.at).toLocaleDateString([], { day:"numeric", month:"short" })}</div>
                            <div style={{ color:"rgba(255,255,255,0.25)" }}>{new Date(u.lastLogin.at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</div>
                            {(u.lastLogin.city || u.lastLogin.country) && (
                              <div style={{ marginTop:2 }}>
                                <span style={{ color:"#60a5fa", fontSize:10 }}>📍 {[u.lastLogin.city, u.lastLogin.country].filter(Boolean).join(", ")}</span>
                                {u.lastLogin.lat && u.lastLogin.lon && (
                                  <a href={`https://www.google.com/maps?q=${u.lastLogin.lat},${u.lastLogin.lon}`} target="_blank" rel="noreferrer"
                                    style={{ marginLeft:4, color:"#22d3ee", fontSize:9, textDecoration:"none", background:"rgba(6,182,212,0.15)", padding:"1px 5px", borderRadius:4 }}>
                                    Map
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ) : <span style={{ color:"rgba(255,255,255,0.2)" }}>Never</span>}
                      </td>
                      <td style={{ fontSize:11, minWidth:110 }}>
                        {u.lastLogin?.device ? (
                          <div>
                            <div style={{ color:"#fff", fontWeight:600 }}>
                              {u.lastLogin.device === "Mobile" ? "📱" : u.lastLogin.device === "Tablet" ? "📟" : "💻"} {u.lastLogin.model || u.lastLogin.device}
                            </div>
                            <div style={{ color:"rgba(255,255,255,0.4)" }}>{u.lastLogin.browser}</div>
                            <div style={{ color:"rgba(255,255,255,0.3)" }}>{u.lastLogin.os}</div>
                            {/* active sessions count */}
                            {u.activeSessions?.length > 0 && (
                              <div style={{ marginTop:4, padding:"2px 6px", borderRadius:6, background:"rgba(6,182,212,0.15)", color:"#22d3ee", fontSize:10, fontWeight:700, display:"inline-block" }}>
                                {u.activeSessions.length}/2 sessions
                              </div>
                            )}
                          </div>
                        ) : <span style={{ color:"rgba(255,255,255,0.2)" }}>—</span>}
                      </td>
                      <td style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{fmtDate(u.createdAt)}</td>
                      <td>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {u.role !== "admin"
                            ? <button className="admin-btn admin-btn-blue" onClick={() => changeRole(u._id,"admin")}>Make Admin</button>
                            : <button className="admin-btn admin-btn-red" onClick={() => changeRole(u._id,"student")}>Revoke</button>
                          }
                          {u.role !== "admin" && (
                            <>
                              {/* Email verify toggle */}
                              <button className={`admin-btn ${u.emailVerified ? "admin-btn-red" : "admin-btn-green"}`}
                                onClick={async () => {
                                  try {
                                    await axios.put(`${API}/admin/users/${u._id}/verify-email`, { emailVerified: !u.emailVerified }, { headers: hdrs() });
                                    loadAll();
                                  } catch (e) { alert(e.response?.data?.message || "Failed"); }
                                }}>
                                {u.emailVerified ? "📧 Unverify" : "📧 Verify"}
                              </button>
                              <button className="admin-btn" style={{ background:"rgba(6,182,212,0.12)", border:"1px solid rgba(6,182,212,0.25)", color:"#22d3ee" }}
                                onClick={() => setSessionsUser(sessionsUser===u._id ? null : u._id)}>
                                📱 {u.activeSessions?.length || 0}/2
                              </button>
                              <button className="admin-btn" style={{ background:"rgba(139,92,246,0.15)", border:"1px solid rgba(139,92,246,0.3)", color:"#a78bfa" }}
                                onClick={() => { setResetPwUser(resetPwUser===u._id ? null : u._id); setResetPwVal(""); }}>
                                🔑 Password
                              </button>
                              <button className="admin-btn admin-btn-red"
                                onClick={async () => {
                                  if (!confirm(`Permanently delete @${u.username}? This cannot be undone.`)) return;
                                  try {
                                    await axios.delete(`${API}/admin/users/${u._id}`, { headers: hdrs() });
                                    loadAll();
                                  } catch (e) { alert(e.response?.data?.message || "Failed"); }
                                }}>
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                        {/* Active Sessions Panel */}
                        {sessionsUser === u._id && (
                          <div style={{ marginTop:8, background:"rgba(6,182,212,0.06)", border:"1px solid rgba(6,182,212,0.2)", borderRadius:10, padding:12 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"#22d3ee", marginBottom:8 }}>Active Sessions ({u.activeSessions?.length || 0}/2)</div>
                            {(!u.activeSessions || u.activeSessions.length === 0) ? (
                              <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>No active sessions</div>
                            ) : u.activeSessions.map((s, i) => (
                              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"8px 0", borderBottom: i < u.activeSessions.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                                <span style={{ fontSize:18, flexShrink:0, marginTop:2 }}>{s.device==="Mobile"?"📱":s.device==="Tablet"?"📟":"💻"}</span>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:12, fontWeight:700 }}>{s.model || s.device}</div>
                                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{s.browser} · {s.os}</div>
                                  {/* Location with map link */}
                                  {(s.city || s.country) ? (
                                    <div style={{ fontSize:11, marginTop:3 }}>
                                      <span style={{ color:"#60a5fa" }}>📍 {[s.city, s.region, s.country].filter(Boolean).join(", ")}</span>
                                      {s.lat && s.lon && (
                                        <a href={`https://www.google.com/maps?q=${s.lat},${s.lon}`} target="_blank" rel="noreferrer"
                                          style={{ marginLeft:6, color:"#22d3ee", fontSize:10, textDecoration:"none", background:"rgba(6,182,212,0.15)", padding:"1px 6px", borderRadius:4 }}>
                                          🗺️ Map
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:3 }}>📍 Location unavailable</div>
                                  )}
                                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:2 }}>
                                    IP: {s.ip || "—"} · {s.loginAt ? new Date(s.loginAt).toLocaleString() : ""}
                                  </div>
                                </div>
                                <button className="admin-btn admin-btn-red" style={{ fontSize:10, padding:"3px 8px", flexShrink:0 }}
                                  onClick={async () => {
                                    try {
                                      await axios.delete(`${API}/admin/users/${u._id}/session/${s.sessionId}`, { headers: hdrs() });
                                      loadAll();
                                    } catch (e) { alert("Failed"); }
                                  }}>
                                  Kick
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {resetPwUser === u._id && (
                          <div style={{ display:"flex", gap:6, marginTop:8 }}>
                            <input
                              type="password"
                              style={{ flex:1, padding:"6px 10px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(139,92,246,0.3)", borderRadius:7, fontFamily:"Outfit,sans-serif", fontSize:13, color:"#fff", outline:"none" }}
                              placeholder="New password (min 6 chars)"
                              value={resetPwVal}
                              onChange={e => setResetPwVal(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && e.target.nextSibling?.click()}
                            />
                            <button className="admin-btn" style={{ background:"rgba(139,92,246,0.2)", border:"1px solid rgba(139,92,246,0.4)", color:"#a78bfa" }}
                              onClick={async () => {
                                if (!resetPwVal || resetPwVal.length < 6) return alert("Password must be at least 6 characters");
                                try {
                                  await axios.put(`${API}/admin/users/${u._id}/reset-password`, { newPassword: resetPwVal }, { headers: hdrs() });
                                  alert(`Password updated for @${u.username}`);
                                  setResetPwUser(null); setResetPwVal("");
                                } catch (e) { alert(e.response?.data?.message || "Failed"); }
                              }}>
                              Set
                            </button>
                            <button className="admin-btn" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.5)" }}
                              onClick={() => { setResetPwUser(null); setResetPwVal(""); }}>
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── ID VERIFICATION ── */}
        {tab === "verify-ids" && (
          <>
            <div className="admin-header">🪪 ID Verification</div>

            {/* filter chips */}
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              {[["all","All Users"],["pending","⏳ Pending"],["verified","✅ Verified"],["rejected","❌ Rejected"],["none","📭 Not Uploaded"]].map(([key,label]) => (
                <span key={key}
                  onClick={() => setIdFilter(key)}
                  style={{
                    padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer",
                    background: idFilter===key ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                    border: idFilter===key ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.09)",
                    color: idFilter===key ? "#60a5fa" : "rgba(255,255,255,0.5)",
                  }}>{label} ({key==="all" ? usersWithId.length : usersWithId.filter(u => (u.idVerified||"none")===key).length})</span>
              ))}
            </div>

            {filteredIdUsers.length === 0 ? (
              <div className="admin-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                No users in this category
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
                {filteredIdUsers.map(u => {
                  const status = u.idVerified || "none";
                  const statusColor = { none:"rgba(255,255,255,0.3)", pending:"#fbbf24", verified:"#4ade80", rejected:"#f87171" };
                  const statusLabel = { none:"📭 Not Uploaded", pending:"⏳ Pending", verified:"✅ Verified", rejected:"❌ Rejected" };
                  return (
                    <div key={u._id} className="admin-card">
                      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
                        <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, flexShrink:0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14 }}>{u.name}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>@{u.username}</div>
                          {u.university && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{u.university} · {u.rollNo || "No roll no"}</div>}
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:statusColor[status], flexShrink:0 }}>
                          {statusLabel[status]}
                        </span>
                      </div>

                      {u.idCard ? (
                        <img src={u.idCard} alt="ID" className="id-img" style={{ marginBottom:12 }} />
                      ) : (
                        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px dashed rgba(255,255,255,0.1)", borderRadius:10, padding:20, textAlign:"center", color:"rgba(255,255,255,0.25)", marginBottom:12, fontSize:13 }}>
                          No ID card uploaded
                        </div>
                      )}

                      {status === "rejected" && u.idRejectedReason && (
                        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"8px 12px", marginBottom:10 }}>
                          <div style={{ fontSize:12, color:"#f87171", fontWeight:600 }}>❌ Rejected — Re-upload required</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:3 }}>Reason: {u.idRejectedReason}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3 }}>Student must upload a new ID card to get verified.</div>
                        </div>
                      )}

                      {selectedUser === u._id && (
                        <input
                          style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, padding:"8px 12px", color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, outline:"none", marginBottom:10, boxSizing:"border-box" }}
                          placeholder="Rejection reason (e.g. ID not clear, wrong ID)"
                          value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                        />
                      )}

                      {u.idCard && status !== "verified" && (
                        <div style={{ display:"flex", gap:8 }}>
                          <button className="admin-btn admin-btn-green" style={{ flex:1 }} onClick={() => verifyId(u._id,"verified")}>✅ Verify</button>
                          {selectedUser === u._id
                            ? <button className="admin-btn admin-btn-red" style={{ flex:1 }} onClick={() => verifyId(u._id,"rejected")}>Confirm Reject</button>
                            : <button className="admin-btn admin-btn-red" style={{ flex:1 }} onClick={() => setSelectedUser(u._id)}>❌ Reject</button>
                          }
                        </div>
                      )}
                      {status === "verified" && (
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <div style={{ flex:1, textAlign:"center", fontSize:12, color:"#4ade80", padding:"6px 0" }}>✅ Verified</div>
                          <button className="admin-btn admin-btn-red" style={{ fontSize:11 }}
                            onClick={() => verifyId(u._id,"rejected")}>Revoke</button>
                        </div>
                      )}
                      {!u.idCard && status !== "rejected" && (
                        <div style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.25)", padding:"6px 0" }}>Waiting for user to upload</div>
                      )}
                      {!u.idCard && status === "rejected" && (
                        <div style={{ textAlign:"center", fontSize:12, color:"#fbbf24", padding:"6px 0" }}>⏳ Waiting for re-upload</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── DEPOSITS ── */}
        {tab === "deposits" && (
          <>
            <div className="admin-header">💳 Coin Deposits ({deposits.length})</div>
            {deposits.length === 0 ? (
              <div className="admin-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>💳</div>
                No deposit requests yet
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {deposits.map(d => (
                  <div key={d._id} className="admin-card">
                    <div style={{ display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                          <span className={`badge-sm ${d.status==="pending"?"badge-yellow":d.status==="approved"?"badge-green":d.status==="expired"?"badge-gray":"badge-red"}`}>
                            {d.status}
                          </span>
                          <span className="badge-sm badge-blue">₹{d.inr}</span>
                          <span className="badge-sm" style={{ background:"rgba(251,191,36,0.15)", color:"#fbbf24" }}>💰 {d.coins}</span>
                        </div>
                        <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>@{d.username}</div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>
                          Package: {d.packageId} · {fmtDate(d.createdAt)}
                        </div>
                        {d.utr && (
                          <div style={{ fontSize:12, color:"#60a5fa", marginBottom:4 }}>
                            UTR: <strong>{d.utr}</strong>
                          </div>
                        )}
                        {!d.utr && d.status === "pending" && (
                          <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>⏳ Waiting for UTR from user</div>
                        )}
                        {d.status === "pending" && (
                          <div style={{ fontSize:11, color: new Date(d.expiresAt) < new Date() ? "#f87171" : "#fbbf24" }}>
                            {new Date(d.expiresAt) < new Date() ? "⏰ Expired" : `⏱ Expires: ${new Date(d.expiresAt).toLocaleTimeString()}`}
                          </div>
                        )}
                        {d.adminNote && <div style={{ fontSize:12, color:"#f87171", marginTop:4 }}>Note: {d.adminNote}</div>}
                      </div>
                      {d.status === "pending" && d.utr && (
                        <div style={{ display:"flex", gap:8, flexDirection:"column", minWidth:160 }}>
                          <button className="admin-btn admin-btn-green"
                            onClick={async () => {
                              if (!confirm(`Credit ${d.coins} coins to @${d.username}?`)) return;
                              try {
                                const { data } = await axios.put(`${API}/admin/deposits/${d._id}/approve`, {}, { headers: hdrs() });
                                alert(data.message); loadAll();
                              } catch (e) { alert(e.response?.data?.message || "Failed"); }
                            }}>
                            ✅ Approve & Credit {d.coins} 💰
                          </button>
                          <div style={{ display:"flex", gap:6 }}>
                            <input
                              style={{ flex:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:7, padding:"6px 10px", color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:12, outline:"none" }}
                              placeholder="Rejection reason…"
                              value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                            />
                            <button className="admin-btn admin-btn-red"
                              onClick={async () => {
                                try {
                                  const { data } = await axios.put(`${API}/admin/deposits/${d._id}/reject`, { note: rejectNote }, { headers: hdrs() });
                                  alert(data.message); setRejectNote(""); loadAll();
                                } catch (e) { alert(e.response?.data?.message || "Failed"); }
                              }}>
                              ❌
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── DELETE REQUESTS ── */}
        {tab === "delete-requests" && (
          <>
            <div className="admin-header">🗑️ Account Delete Requests ({deleteReqs.length})</div>
            {deleteReqs.length === 0 ? (
              <div className="admin-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                No delete requests
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {deleteReqs.map(dr => (
                  <div key={dr._id} className="admin-card">
                    <div style={{ display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                          <span className={`badge-sm ${dr.status==="pending"?"badge-yellow":dr.status==="approved"?"badge-green":"badge-red"}`}>
                            {dr.status}
                          </span>
                          <span style={{ fontWeight:700, fontSize:15 }}>@{dr.username}</span>
                        </div>
                        {dr.reason && (
                          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:6, lineHeight:1.5 }}>
                            Reason: {dr.reason}
                          </div>
                        )}
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{fmtDate(dr.createdAt)}</div>
                        {dr.adminNote && <div style={{ fontSize:12, color:"#f87171", marginTop:4 }}>Note: {dr.adminNote}</div>}
                      </div>
                      {dr.status === "pending" && (
                        <div style={{ display:"flex", gap:8, flexDirection:"column", minWidth:200 }}>
                          <button className="admin-btn admin-btn-red"
                            onClick={async () => {
                              if (!confirm(`Permanently delete account @${dr.username}? This cannot be undone.`)) return;
                              try {
                                const { data } = await axios.put(`${API}/admin/delete-requests/${dr.username}/approve`, {}, { headers: hdrs() });
                                alert(data.message); loadAll();
                              } catch (e) { alert(e.response?.data?.message || "Failed"); }
                            }}>
                            🗑️ Approve & Delete Account
                          </button>
                          <div style={{ display:"flex", gap:6 }}>
                            <input
                              style={{ flex:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, padding:"6px 10px", color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:12, outline:"none" }}
                              placeholder="Rejection reason…"
                              value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                            />
                            <button className="admin-btn admin-btn-blue"
                              onClick={async () => {
                                try {
                                  const { data } = await axios.put(`${API}/admin/delete-requests/${dr.username}/reject`, { note: rejectNote }, { headers: hdrs() });
                                  alert(data.message); setRejectNote(""); loadAll();
                                } catch (e) { alert(e.response?.data?.message || "Failed"); }
                              }}>
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── REQUESTS ── */}
        {tab === "requests" && (
          <>
            <div className="admin-header">🔄 Exchange Requests ({requests.length})</div>
            <div className="admin-card" style={{ padding:0, overflow:"hidden" }}>
              <table className="admin-table">
                <thead><tr><th>Title</th><th>Type</th><th>Owner</th><th>University</th><th>Accepted By</th><th>Coins</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight:600, maxWidth:200 }}>{r.title}</td>
                      <td><span className="badge-sm badge-blue">{r.type}</span></td>
                      <td style={{ fontSize:12 }}>@{r.ownerUsername}</td>
                      <td style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{r.ownerUniversity || "—"}</td>
                      <td style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{r.acceptedBy ? `@${r.acceptedBy}` : "—"}</td>
                      <td style={{ color:"#fbbf24", fontWeight:700 }}>{r.coins > 0 ? `💰 ${r.coins}` : "Free"}</td>
                      <td><span className={`badge-sm ${r.status==="Open"?"badge-green":r.status==="Accepted"?"badge-yellow":"badge-gray"}`}>{r.status}</span></td>
                      <td style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── TRANSACTIONS ── */}
        {tab === "transactions" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div className="admin-header" style={{ marginBottom:0 }}>💰 Transactions ({transactions.length})</div>
              <input className="admin-search" placeholder="Search user or description…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* group by user */}
            {(() => {
              const filtered = transactions.filter(t =>
                !search ||
                t.username?.toLowerCase().includes(search.toLowerCase()) ||
                t.description?.toLowerCase().includes(search.toLowerCase())
              );

              // group
              const grouped = {};
              for (const t of filtered) {
                if (!grouped[t.username]) grouped[t.username] = [];
                grouped[t.username].push(t);
              }

              return Object.entries(grouped).map(([username, txs]) => {
                const totalCredit = txs.filter(t=>t.type==="credit").reduce((a,t)=>a+t.amount,0);
                const totalDebit  = txs.filter(t=>t.type==="debit").reduce((a,t)=>a+t.amount,0);
                const isOpen = search || txs.length <= 3;

                return (
                  <details key={username} open={isOpen} style={{ marginBottom:10 }}>
                    <summary style={{
                      listStyle:"none", cursor:"pointer",
                      background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:12, padding:"12px 16px",
                      display:"flex", alignItems:"center", gap:12,
                    }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 }}>
                        {username[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>@{username}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{txs.length} transaction{txs.length!==1?"s":""}</div>
                      </div>
                      <div style={{ display:"flex", gap:12, fontSize:13 }}>
                        <span style={{ color:"#4ade80", fontWeight:700 }}>+{totalCredit} 💰</span>
                        {totalDebit > 0 && <span style={{ color:"#f87171", fontWeight:700 }}>-{totalDebit} 💰</span>}
                      </div>
                      <span style={{ color:"rgba(255,255,255,0.3)", fontSize:18 }}>⌄</span>
                    </summary>

                    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderTop:"none", borderRadius:"0 0 12px 12px", overflow:"hidden" }}>
                      <table className="admin-table">
                        <thead><tr><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
                        <tbody>
                          {txs.map(t => (
                            <tr key={t._id}>
                              <td style={{ fontSize:13 }}>{t.description}</td>
                              <td><span className="badge-sm badge-blue">{t.category}</span></td>
                              <td><span className={`badge-sm ${t.type==="credit"?"badge-green":"badge-red"}`}>{t.type}</span></td>
                              <td style={{ fontWeight:700, color: t.type==="credit"?"#4ade80":"#f87171" }}>
                                {t.type==="credit"?"+":"-"}{t.amount} 💰
                              </td>
                              <td style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{fmtDate(t.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                );
              });
            })()}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
