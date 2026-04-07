import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function Assignments() {
  const items = [
    { subject: "Physics",   title: "Lab Report - Optics",     due: "Tomorrow",  status: "Pending" },
    { subject: "Maths",     title: "Problem Set 5",           due: "In 3 days", status: "Pending" },
    { subject: "CS",        title: "Binary Search Tree Code", due: "In 5 days", status: "In Progress" },
    { subject: "Chemistry", title: "Research Paper",          due: "Next week", status: "Not Started" },
    { subject: "English",   title: "Book Review Essay",       due: "Submitted", status: "Done" },
  ];
  const sc = { "Pending":"badge-yellow","In Progress":"badge-blue","Done":"badge-green","Not Started":"badge-red" };
  return (
    <div className="dash-page">
      <div className="row-between page-header">
        <div><h1 className="page-title">📋 Assignments</h1><p className="page-sub">Track all your deadlines</p></div>
        <button className="btn btn-primary">+ Add</button>
      </div>
      <div className="glass-card">
        <table className="dash-table">
          <thead><tr><th>Subject</th><th>Assignment</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {items.map((a, i) => (
              <tr key={i}>
                <td><span className="badge badge-purple">{a.subject}</span></td>
                <td style={{ fontWeight: 600 }}>{a.title}</td>
                <td style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{a.due}</td>
                <td><span className={`badge ${sc[a.status]}`}>{a.status}</span></td>
                <td><button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>{a.status === "Done" ? "View" : "Update"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Assignments;