import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

import API from "../api.js";
const tok = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

export default function UserPublicProfile() {
  const { username } = useParams();
  const navigate     = useNavigate();
  const [user,       setUser]       = useState(null);
  const [status,     setStatus]     = useState({ status:"none", direction:"" });
  const [loading,    setLoading]    = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [msg,        setMsg]        = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [u, s] = await Promise.all([
          axios.get(`${API}/social/user/${username}`, { headers: hdrs() }),
          axios.get(`${API}/social/friend-status/${username}`, { headers: hdrs() }),
        ]);
        setUser(u.data); setStatus(s.data);
      } catch { setUser(null); }
      finally { setLoading(false); }
    };
    load();
  }, [username]);

  const sendFriendReq = async () => {
    setActionBusy(true);
    try {
      await axios.post(`${API}/social/friend-request/${username}`, {}, { headers: hdrs() });
      setStatus({ status:"pending", direction:"sent" });
      setMsg("Friend request sent!");
    } catch (e) { setMsg(e.response?.data?.message || "Failed"); }
    finally { setActionBusy(false); }
  };

  if (loading) return (
    <div className="dash-page" style={{ textAlign:"center", paddingTop:60 }}>
      <div style={{ color:"rgba(255,255,255,0.4)" }}>Loading profile…</div>
    </div>
  );

  if (!user) return (
    <div className="dash-page" style={{ textAlign:"center", paddingTop:60 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>👤</div>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>User not found</div>
      <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );

  const idColors = { none:"rgba(255,255,255,0.3)", pending:"#fbbf24", verified:"#4ade80", rejected:"#f87171" };
  const idLabels = { none:"Not Verified", pending:"Pending", verified:"✅ Verified", rejected:"Rejected" };

  return (
    <div className="dash-page">
      <div style={{ maxWidth:600, margin:"0 auto" }}>
        <button className="btn btn-ghost" style={{ marginBottom:16 }} onClick={() => navigate(-1)}>← Back</button>

        {/* profile card */}
        <div className="glass-card" style={{ marginBottom:16 }}>
          {/* cover gradient */}
          <div style={{ height:80, borderRadius:"12px 12px 0 0", margin:"-24px -24px 0", background:"linear-gradient(135deg,rgba(59,130,246,0.2),rgba(139,92,246,0.15))", marginBottom:0 }} />

          {/* avatar */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:-40, marginBottom:16 }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:800, overflow:"hidden", border:"4px solid #03030d", boxShadow:"0 0 20px rgba(59,130,246,0.3)" }}>
              {user.avatar ? <img src={user.avatar} alt={user.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                           : user.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {status.status === "none" && (
                <button className="btn btn-primary" style={{ fontSize:13 }} onClick={sendFriendReq} disabled={actionBusy}>
                  {actionBusy ? "…" : "👥 Add Friend"}
                </button>
              )}
              {status.status === "pending" && status.direction === "sent" && (
                <button className="btn btn-ghost" style={{ fontSize:13 }} disabled>⏳ Request Sent</button>
              )}
              {status.status === "accepted" && (
                <button className="btn btn-ghost" style={{ fontSize:13, color:"#4ade80" }} disabled>✅ Friends</button>
              )}
              <button className="btn btn-primary" style={{ fontSize:13 }}
                onClick={() => navigate(`/student/social/${username}`)}>
                💬 Message
              </button>
            </div>
          </div>

          {msg && <div style={{ fontSize:13, color:"#4ade80", marginBottom:12 }}>✅ {msg}</div>}

          <div style={{ fontSize:22, fontWeight:800, marginBottom:2 }}>{user.name}</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.4)", marginBottom:8 }}>@{user.username}</div>

          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
            <span className="badge badge-blue">{user.role}</span>
            {user.university && <span className="badge badge-purple">{user.university}</span>}
            {user.course && <span className="badge badge-green">{user.course}</span>}
            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600, background:`${idColors[user.idVerified||"none"]}22`, color:idColors[user.idVerified||"none"], border:`1px solid ${idColors[user.idVerified||"none"]}44` }}>
              🪪 {idLabels[user.idVerified||"none"]}
            </span>
          </div>

          {user.bio && (
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, padding:"12px 0", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
              {user.bio}
            </div>
          )}
        </div>

        {/* academic details */}
        <div className="glass-card" style={{ marginBottom:16 }}>
          <div className="section-title">🎓 Academic Info</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              ["🏫","University",  user.university],
              ["🪪","Roll Number", user.rollNo],
              ["📚","Course",      user.course],
              ["🔬","Branch",      user.branch],
              ["📅","Year",        user.year],
              ["📆","Semester",    user.semester],
            ].filter(([,, v]) => v).map(([icon, label, val]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 14px", background:"rgba(255,255,255,0.04)", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:16 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:1 }}>{label}</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{val}</div>
                </div>
              </div>
            ))}
            {!user.university && !user.course && (
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", textAlign:"center", padding:"16px 0" }}>
                No academic info shared yet
              </div>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="glass-card">
          <div className="section-title">📊 Stats</div>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ flex:1, textAlign:"center", padding:"12px 0" }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#fbbf24" }}>💰 {user.coins}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>Campus Coins</div>
            </div>
            <div style={{ flex:1, textAlign:"center", padding:"12px 0", borderLeft:"1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#60a5fa" }}>
                {new Date(user.createdAt).toLocaleDateString([], { month:"short", year:"numeric" })}
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>Joined</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
