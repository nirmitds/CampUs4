import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function About() {
  return (
    <div className="dash-page">
      <div className="page-header">
        <h1 className="page-title">ℹ️ About CampUs</h1>
        <p className="page-sub">Learn more about the platform</p>
      </div>
      <div className="glass-card" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🎓</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>CampUs</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Version 1.0.0</div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.8, marginBottom: 20 }}>
          CampUs is a student-first platform connecting university students through academic tools, peer-to-peer exchange, emergency services, and campus community features.
        </p>
        {[["📚","Academic Tools","Notes, assignments, timetables, and results in one place."],
          ["🔄","Student Exchange","Buy, sell, lend, and borrow items with fellow students."],
          ["🚨","Emergency","Quick access to campus security, medical, and support."],
          ["💰","Campus Coins","Earn and spend coins across the platform."]].map(([icon,title,desc]) => (
          <div key={title} style={{ display: "flex", gap: 14, padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default About;