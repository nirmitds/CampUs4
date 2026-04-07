import { useNavigate } from "react-router-dom";
import { injectDashStyles } from "../styles/dashstyles";

injectDashStyles();

function Emergency() {
  const navigate = useNavigate();
  const cards = [
    { icon: "🛡️", title: "Security",     sub: "Contact campus security",    path: "/student/security", color: "#ef4444" },
    { icon: "🏥", title: "Medical",      sub: "Medical assistance & info",  path: "/student/medical",  color: "#f59e0b" },
    { icon: "⚠️", title: "Report Issue", sub: "Report a campus problem",    path: "/student/report",   color: "#8b5cf6" },
    { icon: "🎧", title: "Support",      sub: "Get help from admin",        path: "/student/support",  color: "#3b82f6" },
  ];

  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">🚨 Emergency</h1>
        <p className="page-sub">Quick access to campus emergency services</p>
      </div>

      <div className="glass-card" style={{ marginBottom: 24, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 28 }}>🆘</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>Emergency Helpline</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              Campus emergency number: <strong style={{ color: "#f87171" }}>+91-XXXX-XXXXXX</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
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

export default Emergency;