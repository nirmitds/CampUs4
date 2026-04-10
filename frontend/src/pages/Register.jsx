import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { injectAuthStyles } from "../styles/authstyles";

injectAuthStyles();

import API from "../api.js";

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return [
    { label: "",       color: "transparent", width: "0%"   },
    { label: "Weak",   color: "#ef4444",     width: "25%"  },
    { label: "Fair",   color: "#f59e0b",     width: "50%"  },
    { label: "Good",   color: "#3b82f6",     width: "75%"  },
    { label: "Strong", color: "#22c55e",     width: "100%" },
  ][s];
}

const UNIVERSITIES = [
  "K.R. Mangalam University (KRMU)",
  "Delhi University (DU)",
  "Jawaharlal Nehru University (JNU)",
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "BITS Pilani",
  "Amity University",
  "Sharda University",
  "Lovely Professional University (LPU)",
  "Chandigarh University",
  "VIT Vellore",
  "Manipal University",
  "SRM University",
  "Other",
];

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  /* step 1 — basic info */
  const [name,       setName]       = useState("");
  const [username,   setUsername]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [university, setUniversity] = useState("");
  const [customUni,  setCustomUni]  = useState("");
  const [rollNo,     setRollNo]     = useState("");
  const [course,     setCourse]     = useState("");

  /* step 2 — ID card */
  const [idPreview,  setIdPreview]  = useState(null);
  const [idDataUrl,  setIdDataUrl]  = useState(null);
  const fileRef = useRef();

  /* step 3 — credentials */
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);

  /* step 4 — email verification */
  const [verifyOtp,     setVerifyOtp]     = useState(Array(6).fill(""));
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendCooldown,  setResendCooldown]  = useState(0);
  const verifyRefs = Array.from({ length: 6 }, () => null);
  const verifyRefsArr = [];

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const numbersOnly = v => v.replace(/\D/g, "");
  const strength    = getStrength(password);
  const finalUni    = university === "Other" ? customUni : university;

  const goStep2 = () => {
    if (!name || !username || !phone) return setError("Please fill name, username and phone.");
    if (phone.length < 10)            return setError("Enter a valid 10-digit phone number.");
    if (!university)                  return setError("Please select your university.");
    if (university === "Other" && !customUni.trim()) return setError("Please enter your university name.");
    if (!rollNo.trim())               return setError("Roll number / student ID is required.");
    setError(""); setStep(2);
  };

  const handleIdPick = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Only image files allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("ID card image must be under 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setIdPreview(reader.result); setIdDataUrl(reader.result); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const goStep3 = () => {
    if (!idDataUrl) return setError("Please upload your university ID card.");
    setError(""); setStep(3);
  };

  const handleRegister = async () => {
    if (!email || !password || !confirm) return setError("Please fill all fields.");
    if (password !== confirm)            return setError("Passwords don't match.");
    if (password.length < 6)            return setError("Password must be at least 6 characters.");
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/register`, {
        name, username, email, phone, password,
        university: finalUni, rollNo, course,
        idCard: idDataUrl,
      });
      setRegisteredEmail(email);
      setSuccess(data.message);
      setResendCooldown(60);
      setStep(4); // go to email verification step
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  const handleVerifyEmail = async () => {
    const code = verifyOtp.join("");
    if (code.length < 6) return setError("Enter the complete 6-digit code.");
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/verify-registration-email`, { email: registeredEmail, otp: code });
      if (data.token) {
        localStorage.setItem("token", data.token);
        setSuccess("Email verified! Redirecting…");
        setTimeout(() => navigate("/student"), 1200);
      } else {
        setSuccess(data.message);
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally { setLoading(false); }
  };

  const handleResendVerify = async () => {
    if (resendCooldown > 0) return;
    setError(""); setLoading(true);
    try {
      await axios.post(`${API}/auth/resend-verify-email`, { email: registeredEmail });
      setSuccess("New code sent!"); setResendCooldown(60);
    } catch (err) { setError(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  // countdown for resend
  if (resendCooldown > 0) {
    setTimeout(() => setResendCooldown(c => c > 0 ? c - 1 : 0), 1000);
  }

  const stepLabels = ["Your Info", "ID Card", "Credentials", "Verify Email"];

  return (
    <div className="campus-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="auth-card">
        <div className="auth-logo-row">
          <div className="auth-logo-icon">🎓</div>
          <div>
            <div className="auth-logo-title">CampUs</div>
            <div className="auth-logo-sub">Connecting Students Together</div>
          </div>
        </div>

        <div className="auth-heading">Create account</div>
        <div className="auth-subtext">{stepLabels[step - 1]}</div>

        {/* 3-step indicator */}
        <div className="step-row">
          <div className={`step-dot ${step > 1 ? "done" : "active"}`} />
          <div className="step-line" />
          <div className={`step-dot ${step === 2 ? "active" : step > 2 ? "done" : ""}`} />
          <div className="step-line" />
          <div className={`step-dot ${step === 3 ? "active" : step > 3 ? "done" : ""}`} />
          <div className="step-line" />
          <div className={`step-dot ${step === 4 ? "active" : ""}`} />
        </div>

        {error   && <div className="auth-error">⚠️ {error}</div>}
        {success && <div className="auth-success">🎉 {success}</div>}

        {/* ── STEP 1: basic info + university ── */}
        {step === 1 && (
          <>
            <div className="auth-field">
              <input className="auth-input" placeholder="Full Name *"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="auth-field">
              <input className="auth-input" placeholder="Username *"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} />
            </div>
            <div className="auth-field">
              <input className="auth-input" placeholder="Phone Number (10 digits) *"
                value={phone}
                onChange={e => setPhone(numbersOnly(e.target.value))}
                maxLength={10} />
            </div>

            {/* university select */}
            <div className="auth-field">
              <select className="auth-input" value={university}
                onChange={e => setUniversity(e.target.value)}>
                <option value="" disabled>Select University *</option>
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {university === "Other" && (
              <div className="auth-field">
                <input className="auth-input" placeholder="Enter your university name *"
                  value={customUni} onChange={e => setCustomUni(e.target.value)} />
              </div>
            )}

            <div className="auth-field">
              <input className="auth-input" placeholder="Roll Number / Student ID *"
                value={rollNo} onChange={e => setRollNo(e.target.value)} />
            </div>
            <div className="auth-field">
              <input className="auth-input" placeholder="Course (e.g. B.Tech CSE)"
                value={course} onChange={e => setCourse(e.target.value)} />
            </div>

            <button className="auth-btn" onClick={goStep2}>Continue →</button>
          </>
        )}

        {/* ── STEP 2: ID card upload ── */}
        {step === 2 && (
          <>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:14, lineHeight:1.6 }}>
              Upload a clear photo of your <strong style={{ color:"#fff" }}>university ID card</strong>. This is required to verify your student status.
            </div>

            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleIdPick} />

            {idPreview ? (
              <div style={{ marginBottom:14 }}>
                <img src={idPreview} alt="ID Card Preview"
                  style={{ width:"100%", maxHeight:200, objectFit:"contain", borderRadius:12, border:"2px solid rgba(59,130,246,0.4)", background:"rgba(0,0,0,0.3)", display:"block" }} />
                <button style={{ marginTop:8, width:"100%", padding:"8px", borderRadius:9, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", fontFamily:"Outfit,sans-serif", fontSize:13, cursor:"pointer" }}
                  onClick={() => { setIdPreview(null); setIdDataUrl(null); }}>
                  🔄 Change Photo
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current.click()}
                style={{ border:"2px dashed rgba(59,130,246,0.4)", borderRadius:14, padding:"32px 20px", textAlign:"center", cursor:"pointer", marginBottom:14, transition:"all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontSize:36, marginBottom:8 }}>🪪</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#60a5fa", marginBottom:4 }}>Tap to upload ID card</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>JPG, PNG · Max 5MB</div>
              </div>
            )}

            <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:16, lineHeight:1.6 }}>
              🔒 Your ID card is stored securely and only visible to admins for verification.
            </div>

            <button className="auth-btn" onClick={goStep3} disabled={!idDataUrl}>
              {idDataUrl ? "Continue →" : "Upload ID Card to Continue"}
            </button>

            <div style={{ display:"flex", justifyContent:"center", marginTop:12 }}>
              <button style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontFamily:"Outfit,sans-serif", fontSize:13, cursor:"pointer" }}
                onClick={() => { setStep(1); setError(""); }}>
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: credentials ── */}
        {step === 3 && (
          <>
            <div style={{ fontSize:12, color:"#4ade80", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              ✅ {finalUni} · {rollNo}
            </div>

            <div className="auth-field">
              <input className="auth-input" type="email" placeholder="Email address *"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="auth-field">
              <input className="auth-input padded-right"
                type={showPw ? "text" : "password"} placeholder="Password *"
                value={password} onChange={e => setPassword(e.target.value)} />
              <button className="eye-btn" onClick={() => setShowPw(!showPw)}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>

            {password.length > 0 && (
              <div className="strength-wrap">
                <div className="strength-bar">
                  <div className="strength-fill" style={{ width: strength.width, background: strength.color }} />
                </div>
                <p className="strength-label" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}

            <div className="auth-field">
              <input className="auth-input padded-right"
                type={showCf ? "text" : "password"} placeholder="Confirm Password *"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleRegister()} />
              <button className="eye-btn" onClick={() => setShowCf(!showCf)}>
                {showCf ? "🙈" : "👁"}
              </button>
            </div>

            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <button className="back-btn" onClick={() => { setStep(2); setError(""); }}>← Back</button>
              <button className="auth-btn" style={{ flex:1, marginTop:0 }}
                onClick={handleRegister} disabled={loading}>
                {loading ? "Creating…" : "Create Account 🎓"}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 4: Email Verification ── */}
        {step === 4 && (
          <>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>📧</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginBottom:6 }}>Verify your email</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
                We sent a 6-digit code to<br />
                <strong style={{ color:"#60a5fa" }}>{registeredEmail}</strong>
              </div>
            </div>

            <div className="otp-boxes" style={{ marginBottom:16 }}>
              {verifyOtp.map((v, i) => (
                <input key={i}
                  ref={el => verifyRefsArr[i] = el}
                  className="otp-box" maxLength={1} value={v}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/,"").slice(-1);
                    const next = [...verifyOtp]; next[i] = val; setVerifyOtp(next);
                    if (val && i < 5) verifyRefsArr[i+1]?.focus();
                  }}
                  onKeyDown={e => { if (e.key==="Backspace" && !v && i > 0) verifyRefsArr[i-1]?.focus(); }}
                  onPaste={e => {
                    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
                    if (p.length === 6) { setVerifyOtp(p.split("")); verifyRefsArr[5]?.focus(); }
                  }}
                />
              ))}
            </div>

            <button className="auth-btn" onClick={handleVerifyEmail} disabled={loading || verifyOtp.join("").length < 6}>
              {loading ? "Verifying…" : "Verify Email →"}
            </button>

            <div style={{ textAlign:"center", marginTop:14, fontSize:13, color:"rgba(255,255,255,0.4)" }}>
              Didn't receive it?{" "}
              <span
                onClick={handleResendVerify}
                style={{ color: resendCooldown > 0 ? "rgba(255,255,255,0.3)" : "#60a5fa", cursor: resendCooldown > 0 ? "default" : "pointer", fontWeight:600 }}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </span>
            </div>
          </>
        )}

        {step < 4 && (
          <>
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span>or</span>
              <div className="auth-divider-line" />
            </div>
            <p className="auth-switch">
              Already have an account?
              <span className="auth-link" onClick={() => navigate("/")}>Sign in</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Register;
