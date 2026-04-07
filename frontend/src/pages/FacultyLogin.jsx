import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import API from "../api.js";

export default function FacultyLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!identifier || !password) return setError("Enter your Faculty ID or Email and password.");
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/faculty/login`, { facultyId: identifier, password });
      localStorage.setItem("facultyToken", data.token);
      localStorage.setItem("facultyName",  data.faculty.name);
      navigate("/faculty/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#03030d", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Outfit',sans-serif", padding:24, position:"relative", overflow:"hidden" }}>
      {/* bg glows */}
      <div style={{ position:"fixed", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,0.14),transparent 70%)", top:-150, left:-150, filter:"blur(80px)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)", bottom:-100, right:-100, filter:"blur(80px)", pointerEvents:"none" }} />

      <form onSubmit={handleLogin} style={{ position:"relative", zIndex:10, width:"100%", maxWidth:400, background:"rgba(255,255,255,0.05)", backdropFilter:"blur(30px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:"40px 36px 32px", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}>

        {/* brand */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,#06b6d4,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 6px 20px rgba(6,182,212,0.4)" }}>👨‍🏫</div>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>Faculty Portal</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)", marginTop:1 }}>CampUs — Educator Access</div>
          </div>
        </div>

        <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>Welcome, Faculty</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:24 }}>Sign in with your Faculty ID or Email</div>

        {error && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.28)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#fca5a5", marginBottom:16 }}>
            ⚠️ {error}
          </div>
        )}

        {/* identifier */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:6, letterSpacing:"0.5px", textTransform:"uppercase" }}>Faculty ID or Email</div>
          <input
            style={{ width:"100%", padding:"12px 15px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:12, fontFamily:"Outfit,sans-serif", fontSize:14, color:"#fff", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
            placeholder="FAC001 or faculty@university.edu"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            autoComplete="username"
            onFocus={e => e.target.style.borderColor = "rgba(6,182,212,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
          />
        </div>

        {/* password */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:6, letterSpacing:"0.5px", textTransform:"uppercase" }}>Password</div>
          <div style={{ position:"relative" }}>
            <input
              style={{ width:"100%", padding:"12px 44px 12px 15px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:12, fontFamily:"Outfit,sans-serif", fontSize:14, color:"#fff", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              onFocus={e => e.target.style.borderColor = "rgba(6,182,212,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:16 }}>
              {showPw ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {/* info box */}
        <div style={{ background:"rgba(6,182,212,0.06)", border:"1px solid rgba(6,182,212,0.15)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:20 }}>
          💡 Your credentials were sent to your email by the admin. Contact admin if you haven't received them.
        </div>

        <button type="submit" disabled={loading}
          style={{ width:"100%", padding:13, background:"linear-gradient(135deg,#06b6d4,#8b5cf6)", border:"none", borderRadius:13, fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:700, color:"#fff", cursor: loading?"not-allowed":"pointer", opacity: loading?0.6:1, boxShadow:"0 6px 24px rgba(6,182,212,0.35)", transition:"opacity 0.2s" }}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <div style={{ marginTop:20, textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.25)" }}>
          Not a faculty?{" "}
          <span style={{ color:"#60a5fa", cursor:"pointer", fontWeight:600 }} onClick={() => navigate("/")}>Student Login</span>
          {" · "}
          <span style={{ color:"#a78bfa", cursor:"pointer", fontWeight:600 }} onClick={() => navigate("/admin")}>Admin Login</span>
        </div>
      </form>
    </div>
  );
}
