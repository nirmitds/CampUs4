import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();
function Timetable() {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat"];
  const slots = [
    { time:"9-10",  Mon:"Physics",  Tue:"",       Wed:"CS",      Thu:"Maths",   Fri:"",        Sat:"" },
    { time:"10-11", Mon:"",         Tue:"Chemistry",Wed:"",      Thu:"",        Fri:"CS",      Sat:"Physics" },
    { time:"11-12", Mon:"Maths",    Tue:"",       Wed:"English", Thu:"",        Fri:"Maths",   Sat:"" },
    { time:"2-3",   Mon:"CS Lab",   Tue:"Physics",Wed:"",        Thu:"English", Fri:"",        Sat:"" },
    { time:"3-4",   Mon:"",         Tue:"Maths",  Wed:"Physics", Thu:"",        Fri:"Chemistry",Sat:"" },
  ];
  const colors = { Physics:"filled", Maths:"filled purple", CS:"filled green","CS Lab":"filled green", Chemistry:"filled yellow", English:"filled" };
  return (
    <div className="dash-page">
      <div className="page-header"><h1 className="page-title">📅 Timetable</h1><p className="page-sub">Your weekly class schedule</p></div>
      <div className="glass-card" style={{ overflowX: "auto" }}>
        <div className="tt-grid">
          <div className="tt-cell header">Time</div>
          {days.map(d => <div key={d} className="tt-cell header">{d}</div>)}
          {slots.map((row, i) => (
            <>
              <div key={i+"t"} className="tt-cell header">{row.time}</div>
              {days.map(d => (
                <div key={d} className={`tt-cell ${row[d] ? colors[row[d]] || "filled" : ""}`}>
                  {row[d] || ""}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
export default Timetable;