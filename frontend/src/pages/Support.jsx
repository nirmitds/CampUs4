import { useState } from "react";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function Support() {
  const faqs = [
    { q: "How do I reset my password?",         a: "Use the OTP login option on the login page with your registered email." },
    { q: "How do campus coins work?",            a: "Coins are earned by contributing content and can be spent in the Exchange." },
    { q: "How to join a study group?",           a: "Go to Academic → Groups and click Join Group on any available group." },
    { q: "How to report an emergency?",          a: "Go to Emergency section and use the Security or Medical quick contacts." },
  ];
  const [open, setOpen] = useState(null);
  const [ticket, setTicket] = useState({ subject: "", message: "" });
  return (
    <div className="dash-page">
      <div className="page-header"><h1 className="page-title">🎧 Support</h1><p className="page-sub">Get help from the campus admin team</p></div>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="glass-card" style={{ marginBottom: 20 }}>
            <div className="section-title">📋 FAQs</div>
            {faqs.map((f, i) => (
              <div key={i} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none", paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
                <div style={{ fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: 14 }} onClick={() => setOpen(open === i ? null : i)}>
                  {f.q} <span>{open === i ? "▲" : "▼"}</span>
                </div>
                {open === i && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8, lineHeight: 1.6 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card">
          <div className="section-title">✉️ Submit a Ticket</div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input className="dash-input" placeholder="What do you need help with?" value={ticket.subject} onChange={e => setTicket({ ...ticket, subject: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="dash-textarea" placeholder="Describe your issue…" value={ticket.message} onChange={e => setTicket({ ...ticket, message: e.target.value })} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => alert("Ticket submitted! We'll get back to you soon.")}>
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
export default Support;