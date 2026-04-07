import { useState } from "react";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function ReportIssue() {
  const [form, setForm] = useState({ type: "Infrastructure", title: "", desc: "", location: "" });
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = () => {
    if (!form.title || !form.desc) return alert("Fill all required fields.");
    setSubmitted(true);
  };
  if (submitted) return (
    <div className="dash-page">
      <div className="glass-card" style={{ textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Issue Reported!</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
          Your report has been submitted. The admin team will review it shortly.
        </div>
        <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ type:"Infrastructure",title:"",desc:"",location:"" }); }}>
          Report Another
        </button>
      </div>
    </div>
  );
  return (
    <div className="dash-page">
      <div className="page-header"><h1 className="page-title">⚠️ Report Issue</h1><p className="page-sub">Report a campus problem to the admin</p></div>
      <div className="glass-card" style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className="form-group">
          <label className="form-label">Issue Type</label>
          <select className="dash-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            {["Infrastructure","Safety","Academic","Hostel","Cleanliness","Other"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="dash-input" placeholder="Short description of the issue" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="dash-input" placeholder="e.g. Block B, 2nd floor" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea className="dash-textarea" placeholder="Describe the issue in detail…" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSubmit}>Submit Report</button>
      </div>
    </div>
  );
}
export default ReportIssue;