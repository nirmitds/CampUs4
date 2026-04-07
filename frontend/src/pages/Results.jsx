import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function Results() {
  const results = [
    { subject: "Physics",   marks: 82, max: 100, grade: "B+" },
    { subject: "Maths",     marks: 91, max: 100, grade: "A"  },
    { subject: "CS",        marks: 95, max: 100, grade: "A+" },
    { subject: "Chemistry", marks: 74, max: 100, grade: "B"  },
    { subject: "English",   marks: 88, max: 100, grade: "A-" },
  ];
  const avg = (results.reduce((a, r) => a + r.marks, 0) / results.length).toFixed(1);
  const gc = { "A+":"badge-green","A":"badge-green","A-":"badge-blue","B+":"badge-blue","B":"badge-yellow","C":"badge-red" };
  return (
    <div className="dash-page">
      <div className="page-header"><h1 className="page-title">📊 Results</h1><p className="page-sub">Your academic performance</p></div>
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><span className="stat-icon">📈</span><span className="stat-val" style={{ color:"#4ade80" }}>{avg}%</span><span className="stat-label">Average Score</span></div>
        <div className="stat-card"><span className="stat-icon">🏆</span><span className="stat-val" style={{ color:"#fbbf24" }}>8.6</span><span className="stat-label">CGPA</span></div>
        <div className="stat-card"><span className="stat-icon">📚</span><span className="stat-val" style={{ color:"#60a5fa" }}>{results.length}</span><span className="stat-label">Subjects</span></div>
      </div>
      <div className="glass-card">
        <table className="dash-table">
          <thead><tr><th>Subject</th><th>Marks</th><th>Grade</th><th>Progress</th></tr></thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.subject}</td>
                <td>{r.marks} / {r.max}</td>
                <td><span className={`badge ${gc[r.grade] || "badge-blue"}`}>{r.grade}</span></td>
                <td style={{ width: 160 }}>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${r.marks}%`, background: "linear-gradient(90deg,#3b82f6,#8b5cf6)", borderRadius: 4 }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Results;