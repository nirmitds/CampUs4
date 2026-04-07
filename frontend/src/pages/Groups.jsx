import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function Groups() {
  const groups = [
    { name: "Physics Study Circle",  members: 12, subject: "Physics",   joined: true  },
    { name: "CS Coders Club",        members: 28, subject: "CS",        joined: true  },
    { name: "Maths Problem Solvers", members: 8,  subject: "Maths",     joined: false },
    { name: "Chemistry Lab Group",   members: 6,  subject: "Chemistry", joined: false },
    { name: "English Literature",    members: 15, subject: "English",   joined: false },
  ];
  return (
    <div className="dash-page">
      <div className="row-between page-header">
        <div><h1 className="page-title">👥 Groups</h1><p className="page-sub">Join study groups with classmates</p></div>
        <button className="btn btn-primary">+ Create Group</button>
      </div>
      <div className="grid-2">
        {groups.map((g, i) => (
          <div key={i} className="glass-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span className="badge badge-blue">{g.subject}</span>
              {g.joined && <span className="badge badge-green">Joined</span>}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{g.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>👥 {g.members} members</div>
            <button className={`btn ${g.joined ? "btn-ghost" : "btn-primary"}`} style={{ width: "100%" }}>
              {g.joined ? "View Group" : "Join Group"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Groups;