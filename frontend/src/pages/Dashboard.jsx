import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { injectDashStyles } from "../styles/dashstyles";
import axios from "axios";

injectDashStyles();

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get("http://localhost:5000/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setUser(r.data.user)).catch(() => {});
  }, []);

  const quickLinks = [
    { icon: "📝", title: "Notes",       sub: "View your notes",       path: "/student/notes" },
    { icon: "📋", title: "Assignments", sub: "Track assignments",      path: "/student/assignments" },
    { icon: "📅", title: "Timetable",   sub: "Your class schedule",    path: "/student/timetable" },
    { icon: "📊", title: "Results",     sub: "Check your grades",      path: "/student/results" },
    { icon: "🔄", title: "Exchange",    sub: "Buy/sell with students", path: "/student/exchange" },
    { icon: "💰", title: "Wallet",      sub: "Your campus coins",      path: "/student/wallet" },
    { icon: "💬", title: "Doubts",      sub: "Ask questions",          path: "/student/doubts" },
    { icon: "🚨", title: "Emergency",   sub: "Quick emergency help",   path: "/student/emergency" },
  ];

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">
          👋 Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="page-sub">Here's what's happening on your campus today.</p>
      </div>

      {/* stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <span className="stat-val" style={{ color: "#fbbf24" }}>
            {user?.coins ?? "—"}
          </span>
          <span className="stat-label">Campus Coins</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <span className="stat-val" style={{ color: "#60a5fa" }}>3</span>
          <span className="stat-label">Pending Assignments</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <span className="stat-val" style={{ color: "#4ade80" }}>B+</span>
          <span className="stat-label">Current CGPA</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔄</span>
          <span className="stat-val" style={{ color: "#a78bfa" }}>5</span>
          <span className="stat-label">Active Requests</span>
        </div>
      </div>

      {/* quick access */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <div className="section-title">Quick Access</div>
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