import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { injectDashStyles } from "../styles/dashstyles";
import axios from "axios";
import VerifyBanner from "../components/VerifyBanner";
import { useVerification } from "../hooks/useVerification";
import API from "../api.js";

injectDashStyles();

const tok = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Dashboard() {
  const navigate = useNavigate();
  const [user,    setUser]    = useState(null);
  const [chats,   setChats]   = useState([]);
  const [avatars, setAvatars] = useState({});
  const { idVerified, isVerified } = useVerification();

  useEffect(() => {
    if (!tok()) return;
    axios.get(`${API}/auth/me`, { headers: hdrs() })
      .then(r => setUser(r.data.user)).catch(() => {});

    const loadChats = async () => {
      try {
        const r = await axios.get(`${API}/chat/summary`, { headers: hdrs() });
        const list = r.data.chats || [];
        setChats(list);
        const avMap = {};
        await Promise.all(list.slice(0, 5).map(async c => {
          try {
            const res = await axios.get(`${API}/auth/user/${c.otherUser}`, { headers: hdrs() });
            avMap[c.otherUser] = res.data.avatar || null;
          } catch { avMap[c.otherUser] = null; }
        }));
        setAvatars(avMap);
      } catch {}
    };
    loadChats();

    const socket = io(API, { auth: { token: tok() }, transports: ["websocket"] });
    socket.on("summary_update", (data) => setChats(data.chats || []));
    return () => socket.disconnect();
  }, []);

  const quickLinks = [
    { icon: "📝", title: "Notes",       sub: "View your notes",       path: "/student/notes" },
    { icon: "📋", title: "Assignments", sub: "Track assignments",      path: "/student/assignments" },
    { icon: "📅", title: "Timetable",   sub: "Your class schedule",    path: "/student/timetable" },
    { icon: "📊", title: "Results",     sub: "Check your grades",      path: "/student/results" },
    { icon: "🔄", title: "Exchange",    sub: "Buy/sell with students", path: "/student/exchange" },
    { icon: "💰", title: "Wallet",      sub: "Your campus coins",      path: "/student/wallet" },
    { icon: "💬", title: "Messages",    sub: "Your chats",             path: "/student/messages" },
    { icon: "🚨", title: "Emergency",   sub: "Quick emergency help",   path: "/student/emergency" },
  ];

  const totalUnread = chats.reduce((a, c) => a + c.unread, 0);

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">
          👋 Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="page-sub">Here's what's happening on your campus today.</p>
      </div>

      <VerifyBanner idVerified={idVerified} blockedActions={!isVerified ? ["Exchange", "Social Chat", "Post Requests"] : []} />

      {/* stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <span className="stat-val" style={{ color: "#fbbf24" }}>{user?.coins ?? "—"}</span>
          <span className="stat-label">Campus Coins</span>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/student/messages")}>
          <span className="stat-icon">💬</span>
          <span className="stat-val" style={{ color: totalUnread > 0 ? "#f87171" : "#60a5fa" }}>
            {totalUnread > 0 ? totalUnread : chats.length}
          </span>
          <span className="stat-label">{totalUnread > 0 ? "Unread Messages" : "Active Chats"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <span className="stat-val" style={{ color: "#4ade80" }}>B+</span>
          <span className="stat-label">Current CGPA</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔄</span>
          <span className="stat-val" style={{ color: "#a78bfa" }}>{chats.length}</span>
          <span className="stat-label">Active Requests</span>
        </div>
      </div>

      {/* messages widget */}
      {chats.length > 0 && (
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <div className="row-between" style={{ marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              💬 Recent Messages
              {totalUnread > 0 && (
                <span style={{
                  marginLeft: 8, padding: "2px 8px", borderRadius: 10,
                  background: "rgba(239,68,68,0.15)", color: "#f87171",
                  fontSize: 12, fontWeight: 700,
                }}>{totalUnread} new</span>
              )}
            </div>
            <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={() => navigate("/student/messages")}>View all →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {chats.slice(0, 4).map(c => {
              const av = avatars[c.otherUser];
              const hasUnread = c.unread > 0;
              return (
                <div key={c.requestId}
                  onClick={() => navigate(`/student/chat/${c.requestId}`)}
                  style={{
                    display: "flex", gap: 12, alignItems: "center",
                    padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                    background: hasUnread ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${hasUnread ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)"}`,
                    transition: "all 0.15s",
                  }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden",
                    border: "2px solid rgba(59,130,246,0.3)",
                  }}>
                    {av ? <img src={av} alt={c.otherUser} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : c.otherUser?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 500, color: "#fff" }}>@{c.otherUser}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{timeAgo(c.lastAt)}</span>
                    </div>
                    <div style={{
                      fontSize: 12, color: hasUnread ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1,
                    }}>
                      {c.lastMessage
                        ? `${c.lastMessage.sender === c.otherUser ? "" : "You: "}${c.lastMessage.text || "📷 Photo"}`
                        : c.title}
                    </div>
                  </div>
                  {hasUnread && (
                    <div style={{
                      minWidth: 20, height: 20, borderRadius: 10,
                      background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                      color: "#fff", fontSize: 11, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 5px", flexShrink: 0,
                    }}>{c.unread}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* quick access */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Quick Access</div>
          <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => navigate("/student/readme")}>
            📖 Platform Guide
          </button>
        </div>
        <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
          {quickLinks.map((l, i) => (
            <div key={i} className="action-card" onClick={() => navigate(l.path)}>
              <span className="action-card-icon">{l.icon}</span>
              <span className="action-card-title">{l.title}</span>
              <span className="action-card-sub">{l.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* profile snippet */}
      {user && (
        <div className="glass-card">
          <div className="section-title">Your Profile</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["👤 Name",     user.name],
              ["🏷️ Username", "@" + user.username],
              ["📧 Email",    user.email],
              ["📱 Phone",    user.phone],
              ["🎓 Role",     user.role],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, fontSize: 14 }}>
                <span style={{ color: "rgba(255,255,255,0.4)", width: 130 }}>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
