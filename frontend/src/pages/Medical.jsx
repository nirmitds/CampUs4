import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function Medical() {
  return (
    <div className="dash-page">
      <div className="page-header"><h1 className="page-title">🏥 Medical</h1><p className="page-sub">Campus health center and emergency contacts</p></div>
      <div className="glass-card" style={{ marginBottom: 20, borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 32 }}>🚑</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Medical Emergency</div>
            <div style={{ fontSize: 15, color: "#fbbf24", fontWeight: 700, marginTop: 4 }}>📞 +91-XXXX-MED-000</div>
          </div>
        </div>
      </div>
      <div className="grid-2">
        {[
          { icon:"🏥", title:"Health Center",    hours:"Mon-Sat 8AM-8PM",   loc:"Block A, Ground Floor" },
          { icon:"💊", title:"Campus Pharmacy",  hours:"Mon-Sat 9AM-6PM",   loc:"Near Main Gate" },
          { icon:"🩺", title:"Doctor on Duty",   hours:"24/7 Emergency",    loc:"Medical Room, Block B" },
          { icon:"🚑", title:"Ambulance",        hours:"Available 24/7",    loc:"Call: +91-XXXX-AMB" },
        ].map((c, i) => (
          <div key={i} className="glass-card">
            <span style={{ fontSize: 28, display: "block", marginBottom: 10 }}>{c.icon}</span>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>⏰ {c.hours}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>📍 {c.loc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Medical;