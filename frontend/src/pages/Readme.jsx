import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

const SECTIONS = [
  {
    id: "overview", icon: "🎓", title: "What is CampUs?",
    content: `CampUs is a student-first campus platform that connects university students through academic tools, peer-to-peer exchange, real-time messaging, emergency services, and a coin-based reward system. Everything you need for campus life — in one place.`,
  },
  {
    id: "auth", icon: "🔐", title: "Login & Registration",
    items: [
      ["🔑 Password Login", "Sign in with your username/email and password."],
      ["📧 Email OTP", "Get a 6-digit one-time code sent to your email. No password needed."],
      ["📝 Register", "2-step signup: fill your name, username, phone → then set email & password."],
      ["🛡️ Admin Login", "Admins use /admin to access the admin portal with separate credentials."],
    ],
  },
  {
    id: "profile", icon: "👤", title: "Profile",
    items: [
      ["📷 Profile Photo", "Upload, crop, and edit your avatar. Max 5MB. Supports JPG, PNG, WEBP."],
      ["🏫 Academic Info", "Add university, roll number, course, branch, year, semester, and bio."],
      ["🪪 ID Card", "Upload your university ID card for admin verification. Status: Not Uploaded / Pending / Verified / Rejected."],
      ["📊 Completion Bar", "Shows how complete your profile is. Complete it to earn +20 🪙 bonus coins."],
    ],
  },
  {
    id: "exchange", icon: "🔄", title: "Exchange",
    items: [
      ["📤 Post a Request", "List items to Sell, Buy, Lend, or Borrow. Set a coin price (0 = free). Only 1 open request at a time."],
      ["✅ Accept a Request", "Pay the coin price to accept. Opens a private chat with the poster."],
      ["💰 Bargain", "Acceptors can counter-offer a different coin amount. Owner can accept or reject."],
      ["📋 My Requests", "View your posted and accepted requests. Open chat from accepted ones."],
    ],
  },
  {
    id: "chat", icon: "💬", title: "Messages & Chat",
    items: [
      ["⚡ Real-time", "Messages appear instantly via Socket.IO — no refresh needed."],
      ["📷 Photo Sharing", "Send images in chat. Click to view fullscreen."],
      ["✍️ Typing Indicator", "See when the other person is typing."],
      ["👤 Profile Photos", "Avatars shown in every message bubble."],
      ["📍 Live Location", "Both users auto-share GPS location when chat opens. Owner sees acceptor's live location on Google Maps."],
      ["🔔 Notifications", "Bell icon shows unread message count. Updates in real-time."],
    ],
  },
  {
    id: "wallet", icon: "💰", title: "Wallet & Coins",
    items: [
      ["🪙 Campus Coins", "Every student starts with 100 coins. Used for exchange requests."],
      ["⚡ Earn Coins", "Complete tasks: Daily Login (+5), Complete Profile (+20), Surveys (+25-30), Watch Ads (+8-10), Refer Friends (+50), Share Notes (+20)."],
      ["💸 Transfer", "Send coins to any student by username with an optional note."],
      ["📜 History", "Full transaction log: credits, debits, categories, timestamps."],
      ["🔄 Real-time Balance", "Balance updates instantly via Socket.IO when coins change."],
    ],
  },
  {
    id: "academic", icon: "📚", title: "Academic Tools",
    items: [
      ["📝 Notes", "Create, pin, search, and color-code class notes by subject."],
      ["📋 Assignments", "Track assignments with due dates and status (Pending/In Progress/Done)."],
      ["📅 Timetable", "Weekly class schedule with color-coded subjects."],
      ["📊 Results", "View marks, grades, and CGPA with progress bars."],
      ["💬 Doubts", "Post academic questions. Other students can answer."],
      ["👥 Groups", "Join or create study groups by subject."],
    ],
  },
  {
    id: "emergency", icon: "🚨", title: "Emergency",
    items: [
      ["🛡️ Security", "Campus security contacts with one-tap call."],
      ["🏥 Medical", "Health center, pharmacy, doctor on duty, ambulance info."],
      ["⚠️ Report Issue", "Submit infrastructure, safety, or hostel issues to admin."],
      ["🎧 Support", "FAQ accordion + submit a support ticket to admin team."],
    ],
  },
  {
    id: "admin", icon: "🛡️", title: "Admin Portal",
    items: [
      ["🔗 Access", "Go to /admin — separate login page for admin accounts only."],
      ["📊 Overview", "Stats: total users, requests, messages, transactions, coins in circulation, pending IDs."],
      ["👥 Users", "Search all users, view their details, promote/revoke admin role."],
      ["🪪 ID Verification", "Review uploaded ID cards. Filter by status. Verify or reject with reason."],
      ["🔄 Requests", "View all exchange requests across all users."],
      ["💰 Transactions", "Full transaction history for every user."],
    ],
  },
  {
    id: "tech", icon: "⚙️", title: "Tech Stack",
    items: [
      ["⚛️ Frontend", "React 19 + Vite + React Router v7"],
      ["🟢 Backend", "Node.js + Express 5 + Socket.IO"],
      ["🍃 Database", "MongoDB + Mongoose"],
      ["🔐 Auth", "JWT tokens + bcrypt + Email OTP via Gmail SMTP"],
      ["📡 Real-time", "Socket.IO for chat, notifications, wallet updates, live location"],
      ["☁️ Storage", "Base64 in MongoDB (avatars, ID cards, images)"],
    ],
  },
];

export default function Readme() {
  const navigate = useNavigate();
  const [active, setActive] = useState("overview");
  const [search, setSearch] = useState("");

  const filtered = search
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content?.toLowerCase().includes(search.toLowerCase()) ||
        s.items?.some(([t, d]) => t.toLowerCase().includes(search.toLowerCase()) || d.toLowerCase().includes(search.toLowerCase()))
      )
    : SECTIONS;

  return (
    <div className="dash-page">
      {/* hero */}
      <div style={{
        background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(6,182,212,0.06) 100%)",
        border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20,
        padding: "32px 28px", marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.15),transparent 70%)", pointerEvents:"none" }} />
        <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:16 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, boxShadow:"0 8px 24px rgba(59,130,246,0.4)" }}>🎓</div>
          <div>
            <div style={{ fontSize:26, fontWeight:900, letterSpacing:-0.5 }}>CampUs</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Complete Platform Guide · v1.0.0</div>
          </div>
        </div>
        <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.8, maxWidth:600, marginBottom:20 }}>
          Everything you need to know about CampUs — the all-in-one campus platform for students. Browse sections below or search for anything.
        </p>
        {/* search */}
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"0 14px", maxWidth:400 }}>
          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:16 }}>🔍</span>
          <input
            style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"Outfit,sans-serif", fontSize:14, color:"#fff", padding:"11px 0" }}
            placeholder="Search the guide…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          {search && <span style={{ cursor:"pointer", color:"rgba(255,255,255,0.3)", fontSize:18 }} onClick={() => setSearch("")}>×</span>}
        </div>
      </div>

      <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
        {/* sidebar nav */}
        {!search && (
          <div style={{ width:200, flexShrink:0, position:"sticky", top:24 }}>
            <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"8px 6px", display:"flex", flexDirection:"column", gap:2 }}>
              {SECTIONS.map(s => (
                <button key={s.id}
                  onClick={() => { setActive(s.id); document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior:"smooth", block:"start" }); }}
                  style={{
                    display:"flex", alignItems:"center", gap:9, padding:"9px 12px", borderRadius:10,
                    border:"none", background: active===s.id ? "rgba(59,130,246,0.15)" : "transparent",
                    color: active===s.id ? "#60a5fa" : "rgba(255,255,255,0.45)",
                    fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:500, cursor:"pointer",
                    textAlign:"left", transition:"all 0.15s",
                    borderLeft: active===s.id ? "2px solid #3b82f6" : "2px solid transparent",
                  }}>
                  <span>{s.icon}</span> {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* content */}
        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:16 }}>
          {filtered.map(s => (
            <div key={s.id} id={`section-${s.id}`} className="glass-card"
              style={{ scrollMarginTop: 24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"rgba(59,130,246,0.12)", border:"1px solid rgba(59,130,246,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                  {s.icon}
                </div>
                <div style={{ fontSize:18, fontWeight:800 }}>{s.title}</div>
              </div>

              {s.content && (
                <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.8, marginBottom: s.items ? 16 : 0 }}>
                  {s.content}
                </p>
              )}

              {s.items && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {s.items.map(([title, desc]) => (
                    <div key={title} style={{ display:"flex", gap:14, padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:12, border:"1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, marginBottom:3, color:"#fff" }}>{title}</div>
                        <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="glass-card" style={{ textAlign:"center", padding:48, color:"rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🔍</div>
              No results for "{search}"
            </div>
          )}

          {/* quick links */}
          {!search && (
            <div className="glass-card">
              <div style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>🚀 Quick Navigation</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
                {[
                  ["🏠","Dashboard","/student/dashboard"],
                  ["🔄","Exchange","/student/exchange"],
                  ["💬","Messages","/student/messages"],
                  ["💰","Wallet","/student/wallet"],
                  ["👤","Profile","/student/profile"],
                  ["📚","Academic","/student/academic"],
                  ["🚨","Emergency","/student/emergency"],
                  ["ℹ️","About","/student/about"],
                ].map(([icon, label, path]) => (
                  <button key={label} onClick={() => navigate(path)} style={{
                    display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
                    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)",
                    borderRadius:10, cursor:"pointer", fontFamily:"Outfit,sans-serif",
                    fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.7)",
                    transition:"all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background="rgba(59,130,246,0.12)"; e.currentTarget.style.color="#60a5fa"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.color="rgba(255,255,255,0.7)"; }}
                  >
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
