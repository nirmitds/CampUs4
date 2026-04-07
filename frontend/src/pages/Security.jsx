import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function Security() {
  return (
    <div className="dash-page">
      <div className="page-header"><h1 className="page-title">🛡️ Security</h1><p className="page-sub">Campus security contacts and alerts</p></div>
      <div className="glass-card" style={{ marginBottom: 20, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 32 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Emergency: Call Security Now</div>
            <div style={{ fontSize: 15, color: "#f87171", fontWeight: 700, marginTop: 4 }}>📞 +91-XXXX-XXXXXX</div>
          </div>
        </div>
      </div>
      <div className="grid-2">
        {[
          { icon:"📞", title:"Security Desk",   val:"+91-XXXX-000001", sub:"24/7 helpline" },
          { icon:"🚔", title:"Campus Police",    val:"+91-XXXX-000002", sub:"Emergency response" },
          { icon:"📹", title:"CCTV Control",     val:"+91-XXXX-000003", sub:"Surveillance team" },
          { icon:"🔒", title:"Gate Security",    val:"+91-XXXX-000004", sub:"Main gate office" },
        ].map((c, i) => (
          <div key={i} className="glass-card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 28 }}>{c.icon}</span>
            <div>
              <div style={{ fontWeight: 700 }}>{c.title}</div>
              <div style={{ color: "#60a5fa", fontWeight: 600, margin: "4px 0" }}>{c.val}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Security;