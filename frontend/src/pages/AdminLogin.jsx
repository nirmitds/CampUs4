import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import API from "../api.js";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  /* already logged in as admin → skip to dashboard */
  useState(() => {
    try {
      const t = localStorage.getItem("adminToken");
      if (!t) return;
      const p = JSON.parse(atob(t.split(".")[1]));
      if (p.role === "admin" && p.exp * 1000 > Date.now()) navigate("/admin/dashboard");
    } catch {}
  });

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) return setError("Enter username and password.");
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/admin/login`, { username, password });
      /* store admin token separately, clear any student token */
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminName",  data.name);
      localStorage.removeItem("token"); // prevent admin from accessing student routes
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#03030d",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit', sans-serif", padding: 24,
      position: "relative", overflow: "hidden",
    }}>
      {/* background blobs */}
      <div style={{ position:"fixed", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,0.14),transparent 70%)", top:-150, left:-150, filter:"blur(80px)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)", bottom:-100, right:-100, filter:"blur(80px)", pointerEvents:"none" }} />

      <form onSubmit={handleLogin} style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 400,
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(30px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, padding: "40px 36px 32px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
      }}>
        {/* logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <div style={{
            width:46, height:46, borderRadius:14,
            background:"linear-gradient(135deg,#4f46e5,#7c3aed)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 6px 20px rgba(79,70,229,0.4)", overflow:"hidden",
          }}>
            <img src="/logo.png" alt="CampUs" style={{ width:30, height:30 }} />
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>CampUs Admin</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)", marginTop:1 }}>Restricted access</div>
          </div>
        </div>

        <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>Admin Login</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:24 }}>
          Sign in with your admin credentials
        </div>

        {error && (
          <div style={{
            background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.28)",
            borderRadius:10, padding:"10px 14px", fontSize:13, color:"#fca5a5", marginBottom:16,
          }}>⚠️ {error}</div>
        )}

        {/* username */}
        <div style={{ marginBottom:12 }}>
          <input
            style={{
              width:"100%", padding:"12px 15px",
              background:"rgba(255,255,255,0.07)",
              border:"1px solid rgba(255,255,255,0.09)",
              borderRadius:12, fontFamily:"Outfit,sans-serif",
              fontSize:14, color:"#fff", outline:"none",
              boxSizing:"border-box",
            }}
            placeholder="Username or Email"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* password */}
        <div style={{ position:"relative", marginBottom:20 }}>
          <input
            style={{
              width:"100%", padding:"12px 44px 12px 15px",
              background:"rgba(255,255,255,0.07)",
              border:"1px solid rgba(255,255,255,0.09)",
              borderRadius:12, fontFamily:"Outfit,sans-serif",
              fontSize:14, color:"#fff", outline:"none",
              boxSizing:"border-box",
            }}
            type={showPw ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="off"
          />
          <button type="button"
            onClick={() => setShowPw(!showPw)}
            style={{
              position:"absolute", right:13, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", color:"rgba(255,255,255,0.35)",
              cursor:"pointer", fontSize:16, lineHeight:1,
            }}>
            {showPw ? "🙈" : "👁"}
          </button>
        </div>

        <button type="submit" disabled={loading} style={{
          width:"100%", padding:13,
          background:"linear-gradient(135deg,#3b82f6,#6366f1)",
          border:"none", borderRadius:13,
          fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:700, color:"#fff",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          boxShadow:"0 6px 24px rgba(59,130,246,0.35)",
          transition:"transform 0.15s, box-shadow 0.15s",
        }}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <div style={{ marginTop:20, textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.25)" }}>
          Not an admin?{" "}
          <span style={{ color:"#60a5fa", cursor:"pointer", fontWeight:600 }}
            onClick={() => navigate("/")}>
            Go to student login
          </span>
        </div>
      </form>
    </div>
  );
}
