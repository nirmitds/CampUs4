import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

import API from "../api.js";
const tok = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

const STYLE_ID = "campus-settings-styles";
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .settings-layout { display: flex; gap: 20px; align-items: flex-start; }
    .settings-sidebar { width: 200px; flex-shrink: 0; }
    .settings-content { flex: 1; min-width: 0; }
    .settings-tabs { display: none; }
    @media (max-width: 768px) {
      .settings-layout { flex-direction: column; gap: 0; }
      .settings-sidebar { display: none; }
      .settings-tabs {
        display: flex; gap: 6px; overflow-x: auto; padding-bottom: 12px;
        margin-bottom: 16px; scrollbar-width: none;
      }
      .settings-tabs::-webkit-scrollbar { display: none; }
      .settings-tab-btn {
        flex-shrink: 0; padding: 7px 14px; border-radius: 20px; border: none;
        font-family: Outfit,sans-serif; font-size: 12px; font-weight: 600;
        cursor: pointer; white-space: nowrap; transition: all 0.15s;
      }
      .settings-tab-btn.active { background: rgba(59,130,246,0.2); color: #60a5fa; border: 1px solid rgba(59,130,246,0.4); }
      .settings-tab-btn:not(.active) { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.09); }
      .settings-content { width: 100%; }
    }
  `;
  document.head.appendChild(s);
}

export default function Settings() {
  const navigate = useNavigate();
  const [user,          setUser]          = useState(null);
  const [deleteReq,     setDeleteReq]     = useState(null);
  const [showDelete,    setShowDelete]    = useState(false);
  const [reason,        setReason]        = useState("");
  const [delBusy,       setDelBusy]       = useState(false);
  const [msg,           setMsg]           = useState("");
  const [msgType,       setMsgType]       = useState("ok");
  const [activeSection, setActiveSection] = useState("account");
  const [hidePassword,  setHidePassword]  = useState("");
  const [hideBusy,      setHideBusy]      = useState(false);
  const [oldHidePass,   setOldHidePass]   = useState("");
  const [showUpdateMode, setShowUpdateMode] = useState(false);
  const [showResetMode, setShowResetMode]  = useState(false);
  const [resetOtp,      setResetOtp]      = useState("");
  const [newHidePass,   setNewHidePass]   = useState("");
  const [otpSent,       setOtpSent]       = useState(false);
  const [otpBusy,       setOtpBusy]       = useState(false);

  useEffect(() => {
    axios.get(`${API}/auth/me`, { headers: hdrs() })
      .then(r => setUser(r.data.user)).catch(() => {});
    axios.get(`${API}/auth/delete-request`, { headers: hdrs() })
      .then(r => setDeleteReq(r.data)).catch(() => {});
  }, []);

  const showMsg = (text, type = "ok") => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 4000); };

  const handleDeleteRequest = async () => {
    if (!reason.trim()) return showMsg("Please provide a reason.", "err");
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
      setDeleteReq(null); showMsg("Delete request cancelled.");
    } catch (e) { showMsg(e.response?.data?.message || "Failed.", "err"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSetHidePassword = async () => {
    if (!hidePassword || hidePassword.length < 4) {
      return showMsg("Password must be at least 4 characters", "err");
    }
    setHideBusy(true);
    try {
      await axios.put(`${API}/auth/hide-password`, { hidePassword }, { headers: hdrs() });
      showMsg("Hide password set successfully!");
      setHidePassword("");
      setUser(prev => ({ ...prev, hidePassword: "set" })); // Mark as set
    } catch (e) {
      showMsg(e.response?.data?.message || "Failed to set password", "err");
    } finally {
      setHideBusy(false);
    }
  };

  const handleUpdateHidePassword = async () => {
    if (!oldHidePass || !hidePassword) {
      return showMsg("Both old and new passwords required", "err");
    }
    if (hidePassword.length < 4) {
      return showMsg("New password must be at least 4 characters", "err");
    }
    setHideBusy(true);
    try {
      await axios.put(`${API}/auth/hide-password`, { 
        hidePassword, 
        oldPassword: oldHidePass 
      }, { headers: hdrs() });
      showMsg("Hide password updated successfully!");
      setHidePassword("");
      setOldHidePass("");
      setShowUpdateMode(false);
    } catch (e) {
      showMsg(e.response?.data?.message || "Failed to update password", "err");
    } finally {
      setHideBusy(false);
    }
  };

  const handleSendResetOtp = async () => {
    setOtpBusy(true);
    try {
      await axios.post(`${API}/auth/hide-password/send-otp`, {}, { headers: hdrs() });
      showMsg("OTP sent to your email!");
      setOtpSent(true);
    } catch (e) {
      showMsg(e.response?.data?.message || "Failed to send OTP", "err");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleResetWithOtp = async () => {
    if (!resetOtp || !newHidePass) {
      return showMsg("OTP and new password required", "err");
    }
    if (newHidePass.length < 4) {
      return showMsg("Password must be at least 4 characters", "err");
    }
    setHideBusy(true);
    try {
      await axios.post(`${API}/auth/hide-password/reset`, { 
        otp: resetOtp, 
        newPassword: newHidePass 
      }, { headers: hdrs() });
      showMsg("Hide password reset successfully!");
      setResetOtp("");
      setNewHidePass("");
      setShowResetMode(false);
      setOtpSent(false);
    } catch (e) {
      showMsg(e.response?.data?.message || "Failed to reset password", "err");
    } finally {
      setHideBusy(false);
    }
  };

  const SECTIONS = [
    { id:"account", icon:"👤", label:"Account"       },
    { id:"privacy", icon:"🔒", label:"Privacy"       },
    { id:"notif",   icon:"🔔", label:"Notifications" },
    { id:"about",   icon:"ℹ️", label:"About"         },
    { id:"danger",  icon:"⚠️", label:"Danger Zone"   },
  ];

  const sidebarBtn = (s) => (
    <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
      display:"flex", alignItems:"center", gap:9, padding:"9px 12px", borderRadius:10,
      border:"none", background: activeSection===s.id ? "rgba(59,130,246,0.15)" : "transparent",
      color: activeSection===s.id ? "#60a5fa" : "rgba(255,255,255,0.45)",
      fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:500, cursor:"pointer",
      textAlign:"left", transition:"all 0.15s", width:"100%",
      borderLeft: activeSection===s.id ? "2px solid #3b82f6" : "2px solid transparent",
    }}>
      <span>{s.icon}</span> {s.label}
    </button>
  );

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-sub">Manage your account and preferences</p>
      </div>

      {msg && (
        <div style={{ padding:"10px 16px", borderRadius:10, marginBottom:16, fontSize:13, fontWeight:500,
          background: msgType==="ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: msgType==="ok" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
          color: msgType==="ok" ? "#86efac" : "#fca5a5",
        }}>{msgType==="ok" ? "✅" : "⚠️"} {msg}</div>
      )}

      {/* mobile horizontal tabs */}
      <div className="settings-tabs">
        {SECTIONS.map(s => (
          <button key={s.id} className={`settings-tab-btn ${activeSection===s.id?"active":""}`}
            onClick={() => setActiveSection(s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="settings-layout">
        {/* desktop sidebar */}
        <div className="settings-sidebar">
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"8px 6px", display:"flex", flexDirection:"column", gap:2 }}>
            {SECTIONS.map(sidebarBtn)}
            {/* logout in sidebar */}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", marginTop:8, paddingTop:8 }}>
              <button onClick={handleLogout} style={{
                display:"flex", alignItems:"center", gap:9, padding:"9px 12px", borderRadius:10,
                border:"none", background:"transparent", color:"rgba(239,68,68,0.7)",
                fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:500, cursor:"pointer",
                textAlign:"left", width:"100%",
              }}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* content */}
        <div className="settings-content">

          {/* ACCOUNT */}
          {activeSection === "account" && (
            <div className="glass-card">
              <div className="section-title">👤 Account Info</div>
              {user && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    ["Name",       user.name],
                    ["Username",   "@" + user.username],
                    ["Email",      user.email],
                    ["Phone",      user.phone],
                    ["University", user.university || "Not set"],
                    ["Roll No",    user.rollNo || "Not set"],
                    ["Role",       user.role],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:"flex", gap:12, fontSize:14, padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", flexWrap:"wrap" }}>
                      <span style={{ color:"rgba(255,255,255,0.4)", width:100, flexShrink:0, fontSize:12 }}>{k}</span>
                      <span style={{ fontWeight:500, flex:1, minWidth:0, wordBreak:"break-all" }}>{v}</span>
                    </div>
                  ))}
                  <button className="btn btn-ghost" style={{ marginTop:4 }} onClick={() => navigate("/student/profile")}>
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
              
              {/* Hide Password Setting */}
              <div style={{ marginBottom:20, padding:"14px", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:12 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:6, color:"#a78bfa" }}>🔐 Hidden Chats Password</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:10, lineHeight:1.5 }}>
                  Set a password to hide sensitive chats. Hidden chats will be removed from your chat list and can only be accessed by entering this password in the Messages search bar.
                  <br /><br />
                  <strong style={{ color:"#a78bfa" }}>How to use:</strong>
                  <br />• Set a password here (minimum 4 characters)
                  <br />• In Messages, click "Hide" on any chat to move it to hidden
                  <br />• Enter your password in the search bar to view hidden chats
                </div>

                {/* Initial Set Password */}
                {!user?.hidePassword && !showUpdateMode && !showResetMode && (
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <input
                      type="password"
                      placeholder="Enter hide password (min 4 chars)"
                      value={hidePassword}
                      onChange={e => setHidePassword(e.target.value)}
                      style={{ flex:1, minWidth:200, padding:"9px 12px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(139,92,246,0.3)", borderRadius:9, color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, outline:"none" }}
                      onKeyDown={e => e.key === "Enter" && handleSetHidePassword()}
                    />
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize:13, padding:"9px 18px" }}
                      onClick={handleSetHidePassword}
                      disabled={hideBusy}>
                      {hideBusy ? "Setting..." : "Set Password"}
                    </button>
                  </div>
                )}

                {/* Password Already Set - Show Options */}
                {user?.hidePassword && !showUpdateMode && !showResetMode && (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <div style={{ flex:1, padding:"10px 14px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:9, fontSize:13, color:"#4ade80" }}>
                      ✅ Hide password is set
                    </div>
                    <button 
                      className="btn btn-ghost" 
                      style={{ fontSize:12, padding:"8px 14px" }}
                      onClick={() => { setShowUpdateMode(true); setShowResetMode(false); }}>
                      Update Password
                    </button>
                    <button 
                      className="btn btn-ghost" 
                      style={{ fontSize:12, padding:"8px 14px", color:"#f59e0b" }}
                      onClick={() => { setShowResetMode(true); setShowUpdateMode(false); }}>
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Update Mode - Using Old Password */}
                {showUpdateMode && (
                  <div style={{ marginTop:12, padding:"12px", background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:9 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:"#60a5fa" }}>Update Hide Password</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <input
                        type="password"
                        placeholder="Enter old password"
                        value={oldHidePass}
                        onChange={e => setOldHidePass(e.target.value)}
                        style={{ padding:"9px 12px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:9, color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, outline:"none" }}
                      />
                      <input
                        type="password"
                        placeholder="Enter new password (min 4 chars)"
                        value={hidePassword}
                        onChange={e => setHidePassword(e.target.value)}
                        style={{ padding:"9px 12px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:9, color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, outline:"none" }}
                        onKeyDown={e => e.key === "Enter" && handleUpdateHidePassword()}
                      />
                      <div style={{ display:"flex", gap:8 }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ fontSize:13, padding:"8px 16px", flex:1 }}
                          onClick={handleUpdateHidePassword}
                          disabled={hideBusy}>
                          {hideBusy ? "Updating..." : "Update"}
                        </button>
                        <button 
                          className="btn btn-ghost" 
                          style={{ fontSize:13, padding:"8px 16px" }}
                          onClick={() => { setShowUpdateMode(false); setOldHidePass(""); setHidePassword(""); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset Mode - Using OTP */}
                {showResetMode && (
                  <div style={{ marginTop:12, padding:"12px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:9 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:"#fbbf24" }}>Reset Hide Password via Email</div>
                    
                    {!otpSent ? (
                      <div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>
                          We'll send a verification code to <strong>{user?.email}</strong>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ fontSize:13, padding:"8px 16px", flex:1, background:"linear-gradient(135deg,#f59e0b,#d97706)" }}
                            onClick={handleSendResetOtp}
                            disabled={otpBusy}>
                            {otpBusy ? "Sending..." : "Send OTP"}
                          </button>
                          <button 
                            className="btn btn-ghost" 
                            style={{ fontSize:13, padding:"8px 16px" }}
                            onClick={() => { setShowResetMode(false); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>
                          Enter the 6-digit code sent to your email
                        </div>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={resetOtp}
                          onChange={e => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          style={{ padding:"9px 12px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:9, color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, outline:"none", letterSpacing:"4px", textAlign:"center" }}
                          maxLength={6}
                        />
                        <input
                          type="password"
                          placeholder="Enter new password (min 4 chars)"
                          value={newHidePass}
                          onChange={e => setNewHidePass(e.target.value)}
                          style={{ padding:"9px 12px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:9, color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, outline:"none" }}
                          onKeyDown={e => e.key === "Enter" && handleResetWithOtp()}
                        />
                        <div style={{ display:"flex", gap:8 }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ fontSize:13, padding:"8px 16px", flex:1, background:"linear-gradient(135deg,#f59e0b,#d97706)" }}
                            onClick={handleResetWithOtp}
                            disabled={hideBusy}>
                            {hideBusy ? "Resetting..." : "Reset Password"}
                          </button>
                          <button 
                            className="btn btn-ghost" 
                            style={{ fontSize:13, padding:"8px 16px" }}
                            onClick={handleSendResetOtp}
                            disabled={otpBusy}>
                            Resend OTP
                          </button>
                        </div>
                        <button 
                          style={{ fontSize:11, color:"rgba(255,255,255,0.4)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"Outfit,sans-serif" }}
                          onClick={() => { setShowResetMode(false); setOtpSent(false); setResetOtp(""); setNewHidePass(""); }}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  ["Profile Visibility", "Visible to all CampUs students"],
                  ["Exchange Requests",  "Visible to students at your university first"],
                  ["ID Card",           user?.idVerified === "verified" ? "✅ Verified" : user?.idVerified === "pending" ? "⏳ Pending" : "Not uploaded"],
                  ["Location Sharing",  "Only shared during active exchange chats"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", gap:10, flexWrap:"wrap" }}>
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
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:14 }}>All notifications are currently enabled.</div>
              {["Exchange Messages","New Requests","Coin Updates","Social Messages"].map(k => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", marginBottom:8 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{k}</div>
                  <div style={{ width:36, height:20, borderRadius:10, background:"rgba(59,130,246,0.4)", border:"1px solid rgba(59,130,246,0.6)", position:"relative", flexShrink:0 }}>
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
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[["Version","1.0.0"],["Platform","Web + Mobile"],["Backend","Node.js + MongoDB"],["Real-time","Socket.IO"],["Auth","JWT + Email OTP"]].map(([k,v]) => (
                  <div key={k} style={{ display:"flex", gap:12, fontSize:13, padding:"8px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color:"rgba(255,255,255,0.4)", width:90, flexShrink:0 }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ marginTop:4 }} onClick={() => navigate("/student/readme")}>📖 View Full Guide</button>
              </div>
            </div>
          )}

          {/* DANGER ZONE */}
          {activeSection === "danger" && (
            <div className="glass-card" style={{ borderColor:"rgba(239,68,68,0.25)", background:"rgba(239,68,68,0.04)" }}>
              <div className="section-title" style={{ color:"#f87171" }}>⚠️ Danger Zone</div>

              {deleteReq?.status === "pending" && (
                <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:12, padding:16, marginBottom:16 }}>
                  <div style={{ fontWeight:700, color:"#fbbf24", marginBottom:6 }}>⏳ Delete Request Pending</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:12 }}>Your account deletion request is under review.</div>
                  <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={handleCancelDelete}>Cancel Request</button>
                </div>
              )}
              {deleteReq?.status === "rejected" && (
                <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:16, marginBottom:16 }}>
                  <div style={{ fontWeight:700, color:"#f87171", marginBottom:6 }}>❌ Delete Request Rejected</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{deleteReq.adminNote || "Your delete request was rejected."}</div>
                </div>
              )}

              <div style={{ padding:16, background:"rgba(255,255,255,0.03)", borderRadius:12, border:"1px solid rgba(239,68,68,0.2)", marginBottom:16 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>Delete Account</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:14, lineHeight:1.6 }}>
                  Once approved by admin, your account and all data will be permanently deleted.
                </div>
                {!showDelete ? (
                  <button style={{ padding:"10px 20px", borderRadius:10, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}
                    onClick={() => setShowDelete(true)} disabled={deleteReq?.status === "pending"}>
                    🗑️ Request Account Deletion
                  </button>
                ) : (
                  <div>
                    <textarea className="dash-textarea" placeholder="Reason for deleting account…" value={reason} onChange={e => setReason(e.target.value)} style={{ marginBottom:10 }} />
                    <div style={{ display:"flex", gap:10 }}>
                      <button className="btn btn-ghost" onClick={() => { setShowDelete(false); setReason(""); }}>Cancel</button>
                      <button style={{ flex:1, padding:10, borderRadius:10, background:"linear-gradient(135deg,#ef4444,#b91c1c)", border:"none", color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, cursor: delBusy?"not-allowed":"pointer", opacity: delBusy?0.6:1 }}
                        onClick={handleDeleteRequest} disabled={delBusy}>
                        {delBusy ? "Submitting…" : "Submit Delete Request"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* LOGOUT */}
              <div style={{ padding:16, background:"rgba(255,255,255,0.03)", borderRadius:12, border:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>Sign Out</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:14 }}>Sign out of your CampUs account on this device.</div>
                <button onClick={handleLogout} style={{ padding:"10px 24px", borderRadius:10, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  🚪 Logout
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
