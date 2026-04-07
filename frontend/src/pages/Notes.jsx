import { useState } from "react";
import { injectDashStyles } from "../styles/dashstyles";

injectDashStyles();

const COLORS = [
  { name: "Blue",   bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.3)",  text: "#60a5fa"  },
  { name: "Purple", bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.3)",  text: "#a78bfa"  },
  { name: "Cyan",   bg: "rgba(6,182,212,0.15)",   border: "rgba(6,182,212,0.3)",   text: "#22d3ee"  },
  { name: "Green",  bg: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.3)",   text: "#4ade80"  },
  { name: "Yellow", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)",  text: "#fbbf24"  },
  { name: "Pink",   bg: "rgba(236,72,153,0.15)",  border: "rgba(236,72,153,0.3)",  text: "#f472b6"  },
];

const SUBJECTS = ["All", "Physics", "Maths", "CS", "Chemistry", "English", "Biology", "Other"];

const INIT_NOTES = [
  {
    id: 1, subject: "Physics", topic: "Quantum Mechanics Ch.3",
    content: "Wave-particle duality: particles exhibit wave properties.\nde Broglie wavelength: λ = h/mv\nHeisenberg Uncertainty Principle: Δx·Δp ≥ ħ/2\nSchrödinger equation describes quantum state evolution.",
    date: "Today", color: COLORS[0], pinned: true,
  },
  {
    id: 2, subject: "Maths", topic: "Differential Equations",
    content: "First-order linear ODE: dy/dx + P(x)y = Q(x)\nIntegrating factor: μ(x) = e^∫P(x)dx\nSeparable equations: dy/dx = f(x)g(y)\nGeneral solution includes constant of integration C.",
    date: "Yesterday", color: COLORS[1], pinned: false,
  },
  {
    id: 3, subject: "CS", topic: "Data Structures — Trees",
    content: "Binary Tree: each node has at most 2 children.\nBST property: left < root < right\nTraversals: Inorder, Preorder, Postorder\nHeight of balanced BST: O(log n)\nAVL trees maintain balance factor = -1, 0, or 1.",
    date: "Mon", color: COLORS[2], pinned: false,
  },
  {
    id: 4, subject: "Chemistry", topic: "Organic Chemistry Summary",
    content: "Functional groups: -OH (alcohol), -COOH (acid), -CHO (aldehyde)\nNucleophilic substitution: SN1 vs SN2\nSN1: first order, carbocation intermediate, racemization\nSN2: second order, backside attack, inversion of config.",
    date: "Sun", color: COLORS[3], pinned: false,
  },
  {
    id: 5, subject: "English", topic: "Essay Writing Guidelines",
    content: "Structure: Introduction → Body Paragraphs → Conclusion\nIntro: Hook, background, thesis statement\nBody: Topic sentence, evidence, analysis, transition\nConclusion: Restate thesis, summarize, closing thought.",
    date: "Fri", color: COLORS[4], pinned: false,
  },
  {
    id: 6, subject: "Maths", topic: "Integration by Parts",
    content: "Formula: ∫u dv = uv - ∫v du\nLIATE rule for choosing u:\nLogarithmic, Inverse trig, Algebraic, Trigonometric, Exponential\nExample: ∫x·eˣ dx = x·eˣ - eˣ + C",
    date: "Thu", color: COLORS[5], pinned: false,
  },
];

const NOTE_STYLE_ID = "campus-notes-styles";
if (!document.getElementById(NOTE_STYLE_ID)) {
  const s = document.createElement("style");
  s.id = NOTE_STYLE_ID;
  s.textContent = `
    .notes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 16px;
    }
    .note-card {
      border-radius: 16px; padding: 20px;
      cursor: pointer; position: relative;
      display: flex; flex-direction: column; gap: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
      animation: noteIn 0.3s ease both;
    }
    @keyframes noteIn {
      from { opacity:0; transform: scale(0.96) translateY(8px); }
      to   { opacity:1; transform: none; }
    }
    .note-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.5); }
    .note-pin {
      position: absolute; top: 14px; right: 14px;
      background: none; border: none; cursor: pointer;
      font-size: 16px; opacity: 0.35; transition: opacity 0.2s; line-height:1;
    }
    .note-pin:hover, .note-pin.pinned { opacity: 1; }
    .note-subject { font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; }
    .note-topic   { font-size: 15px; font-weight: 700; line-height: 1.3; padding-right: 24px; }
    .note-preview {
      font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.6;
      display: -webkit-box; -webkit-line-clamp: 3;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .note-footer {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: auto; padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.07);
    }
    .note-date { font-size: 11px; color: rgba(255,255,255,0.3); }
    .note-viewer {
      white-space: pre-wrap; font-size: 14px; line-height: 1.8;
      color: rgba(255,255,255,0.75); font-family: Outfit, sans-serif;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px; padding: 16px; min-height: 160px;
    }
    .notes-search {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.09);
      border-radius: 12px; padding: 0 14px; transition: border-color 0.2s;
    }
    .notes-search:focus-within { border-color: rgba(59,130,246,0.5); }
    .notes-search input {
      background: none; border: none; outline: none;
      font-family: Outfit, sans-serif; font-size: 14px; color: #fff;
      padding: 12px 0; flex: 1;
    }
    .notes-search input::placeholder { color: rgba(255,255,255,0.3); }
    .color-picker { display: flex; gap: 8px; flex-wrap: wrap; }
    .color-dot {
      width: 26px; height: 26px; border-radius: 50%;
      cursor: pointer; border: 2px solid transparent;
      transition: transform 0.15s, border-color 0.15s;
    }
    .color-dot:hover { transform: scale(1.15); }
    .color-dot.selected { border-color: #fff; transform: scale(1.2); }
  `;
  document.head.appendChild(s);
}

function Notes() {
  const [notes, setNotes]           = useState(INIT_NOTES);
  const [search, setSearch]         = useState("");
  const [subFilter, setSubFilter]   = useState("All");
  const [viewing, setViewing]       = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({
    subject: "Physics", topic: "", content: "", color: COLORS[0],
  });

  const filtered = notes
    .filter(n => subFilter === "All" || n.subject === subFilter)
    .filter(n =>
      n.topic.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.pinned - a.pinned);

  const handleCreate = () => {
    if (!form.topic.trim() || !form.content.trim()) return alert("Topic and content are required.");
    setNotes([{
      id: Date.now(), subject: form.subject,
      topic: form.topic.trim(), content: form.content.trim(),
      date: "Just now", color: form.color, pinned: false,
    }, ...notes]);
    setForm({ subject: "Physics", topic: "", content: "", color: COLORS[0] });
    setShowCreate(false);
  };

  const handleDelete = (id) => {
    setNotes(notes.filter(n => n.id !== id));
    if (viewing?.id === id) setViewing(null);
  };

  const handlePin = (id, e) => {
    e?.stopPropagation();
    setNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    if (viewing?.id === id) setViewing(v => ({ ...v, pinned: !v.pinned }));
  };

  const openCreate = () => { setShowCreate(true); setViewing(null); };
  const openNote   = (n) => { setViewing(n); setShowCreate(false); };

  return (
    <div className="dash-page">

      {/* header */}
      <div className="row-between page-header">
        <div>
          <h1 className="page-title">📝 Notes</h1>
          <p className="page-sub">{notes.length} notes saved</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Note</button>
      </div>

      {/* search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div className="notes-search" style={{ flex: 1, minWidth: 200 }}>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>🔍</span>
          <input placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <span style={{ cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 20, lineHeight: 1 }}
              onClick={() => setSearch("")}>×</span>
          )}
        </div>
      </div>

      {/* subject filter */}
      <div className="chip-list" style={{ marginBottom: 22 }}>
        {SUBJECTS.map(s => (
          <span key={s} className={`chip ${subFilter === s ? "active" : ""}`}
            onClick={() => setSubFilter(s)}>{s}</span>
        ))}
      </div>

      {/* body */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div className="glass-card">
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No notes found. Create your first one!</p>
              </div>
            </div>
          ) : (
            <div className="notes-grid">
              {filtered.map(n => (
                <div key={n.id} className="note-card"
                  style={{ background: n.color.bg, border: `1px solid ${n.color.border}` }}
                  onClick={() => openNote(n)}>
                  <button className={`note-pin ${n.pinned ? "pinned" : ""}`}
                    onClick={e => handlePin(n.id, e)}>
                    {n.pinned ? "📌" : "📍"}
                  </button>
                  <div className="note-subject" style={{ color: n.color.text }}>{n.subject}</div>
                  <div className="note-topic">{n.topic}</div>
                  <div className="note-preview">{n.content}</div>
                  <div className="note-footer">
                    <span className="note-date">{n.date}</span>
                    <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 11 }}
                      onClick={e => { e.stopPropagation(); handleDelete(n.id); }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* side panel */}
        {(viewing || showCreate) && (
          <div style={{ width: "100%", maxWidth: 355, flexShrink: 0 }}>
            <div className="glass-card" style={{
              position: "sticky", top: 24,
              border: viewing && !showCreate ? `1px solid ${viewing.color.border}` : "1px solid rgba(255,255,255,0.1)",
              background: viewing && !showCreate ? viewing.color.bg : "rgba(255,255,255,0.055)",
            }}>

              {/* VIEW */}
              {viewing && !showCreate && (
                <>
                  <div className="row-between" style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: viewing.color.text }}>
                      {viewing.subject}
                    </span>
                    <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
                      onClick={() => setViewing(null)}>×</button>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, lineHeight: 1.3 }}>
                    {viewing.topic}
                  </div>
                  <div className="note-viewer">{viewing.content}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button className="btn btn-ghost" style={{ flex: 1, fontSize: 13 }}
                      onClick={() => handlePin(viewing.id)}>
                      {viewing.pinned ? "📌 Unpin" : "📍 Pin"}
                    </button>
                    <button className="btn btn-danger" style={{ flex: 1, fontSize: 13 }}
                      onClick={() => handleDelete(viewing.id)}>
                      🗑 Delete
                    </button>
                  </div>
                </>
              )}

              {/* CREATE */}
              {showCreate && (
                <>
                  <div className="row-between" style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>✏️ New Note</div>
                    <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
                      onClick={() => setShowCreate(false)}>×</button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <select className="dash-select" value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}>
                      {SUBJECTS.filter(s => s !== "All").map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Topic / Title</label>
                    <input className="dash-input" placeholder="e.g. Newton's Laws of Motion"
                      value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Content</label>
                    <textarea className="dash-textarea" style={{ minHeight: 140 }}
                      placeholder="Write your notes here…"
                      value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <div className="color-picker">
                      {COLORS.map((c, i) => (
                        <div key={i}
                          className={`color-dot ${form.color.name === c.name ? "selected" : ""}`}
                          style={{ background: c.text }}
                          onClick={() => setForm({ ...form, color: c })} />
                      ))}
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }}
                    onClick={handleCreate}>
                    Save Note 📝
                  </button>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notes;