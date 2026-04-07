import { useState } from "react";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function Doubts() {
  const [doubts] = useState([
    { q: "How to solve integration by parts?", subject: "Maths", ans: 3, by: "Priya", time: "2h ago" },
    { q: "Difference between TCP and UDP?",     subject: "CS",    ans: 5, by: "Rahul", time: "5h ago" },
    { q: "What is Heisenberg's principle?",     subject: "Physics",ans:2, by: "Ananya",time: "1d ago" },
    { q: "How does recursion work?",            subject: "CS",    ans: 7, by: "Karan", time: "2d ago" },
  ]);
  const [show, setShow] = useState(false);
  const [q, setQ] = useState("");
  return (
    <div className="dash-page">
      <div className="row-between page-header">
        <div><h1 className="page-title">💬 Doubts</h1><p className="page-sub">Ask and answer academic questions</p></div>
        <button className="btn btn-primary" onClick={() => setShow(true)}>+ Ask Doubt</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {doubts.map((d, i) => (
          <div key={i} className="glass-card">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{d.q}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-blue">{d.subject}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>by @{d.by}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{d.time}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: "#4ade80" }}>💬 {d.ans}</span>
                <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 13 }}>Answer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {show && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShow(false)}>
          <div className="modal-box">
            <div className="modal-title">Ask a Doubt</div>
            <div className="form-group">
              <label className="form-label">Your Question</label>
              <textarea className="dash-textarea" placeholder="Type your doubt clearly…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn btn-primary">Post Doubt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Doubts;