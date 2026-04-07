import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

import API from "../api.js";
const tok = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

export default function Settings() {
  const navigate = useNavigate();
  const [user,        setUser]        = useState(null);
  const [deleteReq,   setDeleteReq]   = useState(null);
  const [showDelete,  setShowDelete]  = useState(false);
  const [reason,      setReason]      = useState("");
  const [delBusy,     setDelBusy]     = useState(false);
  const [msg,         setMsg]         = useState("");
  const [msgType,     setMsgType]     = useState("ok");
  const [activeSection, setActiveSection] = useState("account");

  useEffect(() => {
    axios.get(`${API}/auth/me`, { headers: hdrs() })
      .then(r => setUser(r.data.user)).catch(() => {});
    axios.get(`${API}/auth/delete-request`, { headers: hdrs() })
      .then(r => setDeleteReq(r.data)).catch(() => {});
  }, []);

  const showMsg = (text, type = "ok") => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 4000); };

  const handleDeleteRequest = async () => {
    if (!reason.trim()) return showMsg("Please provide a reason for deleting your account.", "err");
    setDelBusy(true);
    try {
      const { data } = await axios.post(`${API}/auth/delete-request`, { reason }, { headers: hdrs() });
      showMsg(data.message);
      setDeleteReq({ status: "pending", reason });
      setShowDelete(false);
    } catch (e) { showMsg(e.response?.data?.message || "Failed.", "err"); }
    finally { setDelBusy(false); }
  };

  const handleCancelDelete = async () => {
    try {
      await axios.delete(`${API}/auth/delete-request`, { headers: hdrs() });
      setDeleteReq(null);
      showMsg("Delete request cancelled.");
    } catch (e) { showMsg(e.response?.data?.message || "Failed.", "err"); }
  };

  const SECTIONS = [
    { id:"account",   icon:"👤", label:"Account"   },
    { id:"privacy",   icon:"🔒", label:"Privacy"   },
    { id:"notif",     icon:"🔔", label:"Notifications" },
    { id:"about",     icon:"ℹ️", label:"About"     },
    { id:"danger",    icon:"⚠️", label:"Danger Zone" },
  ];

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-sub">Manage your account and preferences</p>
      </div>

      {msg && (
        <div style={{
          padding:"10px 16px", borderRadius:10, marginBottom:16, fontSize:13, fontWeight:500,
          background: msgType==="ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: msgType==="ok" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
          color: msgType==="ok" ? "#86efac" : "#fca5a5",
        }}>{msgType==="ok" ? "✅" : "⚠️"} {msg}</div>
      )}

      <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
        {/* sidebar */}
        <div style={{ width:200, flexShrink:0 }}>
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"8px 6px", display:"flex", flexDirection:"column", gap:2 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                display:"flex", alignItems:"center", gap:9, padding:"9px 12px", borderRadius:10,
                border:"none", background: activeSection===s.id ? "rgba(59,130,246,0.15)" : "transparent",
                color: activeSection===s.id ? "#60a5fa" : "rgba(255,255,255,0.45)",
                fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:500, cursor:"pointer",
                textAlign:"left", transition:"all 0.15s",
                borderLeft: activeSection===s.id ? "2px solid #3b82f6" : "2px solid transparent",
              }}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* content */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* ACCOUNT */}
          {activeSection === "account" && (
            <div className="glass-card">
              <div className="section-title">👤 Account Info</div>
              {user && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[
                    ["Name",     user.name],
                    ["Username", "@" + user.username],
                    ["Email",    user.email],
                    ["Phone",    user.phone],
                    ["University", user.university || "Not set"],
                    ["Roll No",  user.rollNo || "Not set"],
                    ["Role",     user.role],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:"flex", gap:12, fontSize:14, padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ color:"rgba(255,255,255,0.4)", width:110, flexShrink:0 }}>{k}</span>
                      <span style={{ fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                  <button className="btn btn-ghost" style={{ marginTop:8 }} onClick={() => navigate("/student/profile")}>
                    ✏️ Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PRIVACY */}
          {activeSection === "privacy" && (
            <div className="glass-card">
              <div className="section-title">🔒 Privacy</div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  ["Profile Visibility", "Your profile is visible to all CampUs students"],
                  ["Exchange Requests",  "Your requests are visible to students at your university first"],
                  ["ID Card",           user?.idVerified === "verified" ? "✅ Verified" : user?.idVerified === "pending" ? "⏳ Pending verification" : "Not uploaded"],
                  ["Location Sharing",  "Location is only shared during active exchange chats"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>{k}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{v}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === "notif" && (
            <div className="glass-card">
              <div className="section-title">🔔 Notifications</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:16 }}>
                Notification preferences coming soon. Currently all notifications are enabled.
              </div>
              {[
                ["Exchange Messages",  "Get notified when someone messages you in a chat"],
                ["New Requests",       "Get notified when someone accepts your request"],
                ["Coin Updates",       "Get notified when coins are added to your wallet"],
                ["Social Messages",    "Get notified for new direct messages"],
              ].map(([k, v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{k}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{v}</div>
                  </div>
                  <div style={{ width:36, height:20, borderRadius:10, background:"rgba(59,130,246,0.4)", border:"1px solid rgba(59,130,246,0.6)", position:"relative" }}>
                    <div style={{ position:"absolute", right:2, top:2, width:16, height:16, borderRadius:"50%", background:"#3b82f6" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ABOUT */}
          {activeSection === "about" && (
            <div className="glass-card">
              <div className="section-title">ℹ️ About CampUs</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  ["Version",    "1.0.0"],
                  ["Platform",   "Web + Mobile"],
                  ["Backend",    "Node.js + Express + MongoDB"],
                  ["Real-time",  "Socket.IO"],
                  ["Auth",       "JWT + Email OTP"],
                  ["Payments",   "UPI / QR Code"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:"flex", gap:12, fontSize:13, padding:"8px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color:"rgba(255,255,255,0.4)", width:100, flexShrink:0 }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ marginTop:8 }} onClick={() => navigate("/student/readme")}>
                  📖 View Full Guide
                </button>
              </div>
            </div>
          )}

          {/* DANGER ZONE */}
          {activeSection === "danger" && (
            <div className="glass-card" style={{ borderColor:"rgba(239,68,68,0.25)", background:"rgba(239,68,68,0.04)" }}>
              <div className="section-title" style={{ color:"#f87171" }}>⚠️ Danger Zone</div>

              {deleteReq?.status === "pending" ? (
                <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:12, padding:"16px", marginBottom:16 }}>
                  <div style={{ fontWeight:700, color:"#fbbf24", marginBottom:6 }}>⏳ Delete Request Pending</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:12 }}>
                    Your account deletion request is under review. Admin will process it within 24 hours.
                  </div>
                  {deleteReq.reason && <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:12 }}>Reason: {deleteReq.reason}</div>}
                  <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={handleCancelDelete}>
                    Cancel Delete Request
                  </button>
                </div>
              ) : deleteReq?.status === "rejected" ? (
                <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"16px", marginBottom:16 }}>
                  <div style={{ fontWeight:700, color:"#f87171", marginBottom:6 }}>❌ Delete Request Rejected</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>
                    {deleteReq.adminNote || "Your delete request was rejected by admin."}
                  </div>
                </div>
              ) : null}

              <div style={{ padding:"16px", background:"rgba(255,255,255,0.03)", borderRadius:12, border:"1px solid rgba(239,68,68,0.2)" }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>Delete Account</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:16, lineHeight:1.6 }}>
                  Requesting account deletion will notify the admin. Once approved, your account, messages, exchange requests, and all data will be permanently deleted. This cannot be undone.
                </div>

                {!showDelete ? (
                  <button
                    style={{ padding:"10px 20px", borderRadius:10, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}
                    onClick={() => setShowDelete(true)}
                    disabled={deleteReq?.status === "pending"}
                  >
                    🗑️ Request Account Deletion
                  </button>
                ) : (
                  <div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
                      Tell us why you want to delete your account:
                    </div>
                    <textarea
                      className="dash-textarea"
                      placeholder="Reason for deleting account (required)…"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      style={{ marginBottom:10 }}
                    />
                    <div style={{ display:"flex", gap:10 }}>
                      <button className="btn btn-ghost" onClick={() => { setShowDelete(false); setReason(""); }}>Cancel</button>
                      <button
                        style={{ flex:1, padding:"10px", borderRadius:10, background:"linear-gradient(135deg,#ef4444,#b91c1c)", border:"none", color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, cursor: delBusy ? "not-allowed" : "pointer", opacity: delBusy ? 0.6 : 1 }}
                        onClick={handleDeleteRequest} disabled={delBusy}>
                        {delBusy ? "Submitting…" : "Submit Delete Request"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
