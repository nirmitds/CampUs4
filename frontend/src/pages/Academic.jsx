import { useNavigate } from "react-router-dom";
import { injectDashStyles } from "../styles/dashstyles";

injectDashStyles();

function Academic() {
  const navigate = useNavigate();
  const cards = [
    { icon: "📝", title: "Notes",       sub: "Access and share class notes",     path: "/student/notes",       color: "#3b82f6" },
    { icon: "📋", title: "Assignments", sub: "Track your pending assignments",    path: "/student/assignments", color: "#8b5cf6" },
    { icon: "📅", title: "Timetable",   sub: "View your weekly schedule",        path: "/student/timetable",   color: "#06b6d4" },
    { icon: "📊", title: "Results",     sub: "Check marks and CGPA",             path: "/student/results",     color: "#22c55e" },
    { icon: "💬", title: "Doubts",      sub: "Ask and answer academic doubts",   path: "/student/doubts",      color: "#f59e0b" },
    { icon: "👥", title: "Groups",      sub: "Join study groups",                path: "/student/groups",      color: "#ec4899" },
  ];

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">📚 Academic</h1>
        <p className="page-sub">Everything you need for your studies in one place</p>
      </div>
      <div className="grid-3">
        {cards.map((c, i) => (
          <div key={i} className="glass-card" style={{ cursor: "pointer", transition: "all 0.22s" }}
            onClick={() => navigate(c.path)}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: c.color + "22", border: `1px solid ${c.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, marginBottom: 14,
            }}>{c.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Academic;