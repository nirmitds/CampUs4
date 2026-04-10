import { useNavigate } from "react-router-dom";

export default function VerifyBanner({ idVerified, emailVerified = true, blockedActions = [] }) {
  const navigate = useNavigate();

  // Email not verified — highest priority
  if (emailVerified === false) {
    return (
      <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
        <span style={{ fontSize:24, flexShrink:0 }}>📧</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#f87171", marginBottom:4 }}>Email Not Verified</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>
            Check your inbox for the verification code sent during registration.
          </div>
        </div>
        <button onClick={() => navigate("/")}
          style={{ padding:"8px 16px", borderRadius:10, background:"#ef4444", border:"none", color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
          Verify Now →
        </button>
      </div>
    );
  }

  // ID not verified
  if (idVerified === "verified") return null;

  const configs = {
    none: {
      color:"#f87171", bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.25)",
      icon:"🪪", title:"ID Verification Required",
      msg:"Upload your university ID card to unlock all features.",
      btn:"Upload ID Card",
    },
    pending: {
      color:"#fbbf24", bg:"rgba(251,191,36,0.08)", border:"rgba(251,191,36,0.25)",
      icon:"⏳", title:"ID Verification Pending",
      msg:"Your ID card is under review. Features unlock once admin verifies it.",
      btn:null,
    },
    rejected: {
      color:"#f87171", bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.25)",
      icon:"❌", title:"ID Verification Rejected",
      msg:"Your ID was rejected. Please re-upload a clear photo of your university ID.",
      btn:"Re-upload ID",
    },
  };

  const c = configs[idVerified] || configs.none;

  return (
    <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
      <span style={{ fontSize:24, flexShrink:0 }}>{c.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, color:c.color, marginBottom:4 }}>{c.title}</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom: blockedActions.length ? 8 : 0 }}>{c.msg}</div>
        {blockedActions.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {blockedActions.map(a => (
              <span key={a} style={{ padding:"2px 8px", borderRadius:6, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.2)", fontSize:11, color:"#f87171" }}>
                🔒 {a}
              </span>
            ))}
          </div>
        )}
      </div>
      {c.btn && (
        <button onClick={() => navigate("/student/profile")}
          style={{ padding:"8px 16px", borderRadius:10, background:"#ef4444", border:"none", color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
          {c.btn} →
        </button>
      )}
    </div>
  );
}
