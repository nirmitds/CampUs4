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

  const contactAdmin = () => {
    const subject = ticket.subject || "Support Request - CampUs";
    const body = ticket.message
      ? `Hi Admin,\n\n${ticket.message}\n\nThank you.`
      : `Hi Admin,\n\nI need help with my CampUs account.\n\nThank you.`;
    navigator.clipboard.writeText(body).catch(() => {});
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=campus4292@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
  };

  return (
    <div className="dash-page" style={{ position: "relative" }}>
      <div className="page-header">
        <h1 className="page-title">🎧 Support</h1>
        <p className="page-sub">Get help from the campus admin team</p>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="glass-card" style={{ marginBottom: 20 }}>
            <div className="section-title">📋 FAQs</div>
            {faqs.map((f, i) => (
              <div key={i} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none", paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
                <div style={{ fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: 14 }}
                  onClick={() => setOpen(open === i ? null : i)}>
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
            <input className="dash-input" placeholder="What do you need help with?"
              value={ticket.subject} onChange={e => setTicket({ ...ticket, subject: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="dash-textarea" placeholder="Describe your issue…"
              value={ticket.message} onChange={e => setTicket({ ...ticket, message: e.target.value })} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={contactAdmin}>
            📧 Send to Admin
          </button>
        </div>
      </div>

      {/* Floating Contact Admin button — bottom right */}
      <button
        onClick={contactAdmin}
        style={{
          position: "fixed",
          bottom: 16,
          right: 20,
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 18px",
          background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
          border: "none",
          borderRadius: 50,
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "Outfit,sans-serif",
          boxShadow: "0 4px 20px rgba(59,130,246,0.45)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(59,130,246,0.55)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,130,246,0.45)"; }}
        title="Contact Admin via Gmail"
      >
        ✉️ Contact Admin
      </button>
    </div>
  );
}

export default Support;
