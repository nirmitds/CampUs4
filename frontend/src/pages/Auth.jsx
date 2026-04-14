import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { injectAuthStyles } from "../styles/authstyles";

injectAuthStyles();

import API from "../api.js";

function OtpBoxes({ otp, setOtp }) {
  const refs = useRef([]);
  const handle = (i, e) => {
    const val = e.target.value.replace(/\D/, "").slice(-1);
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handlePaste = (e) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) { setOtp(p.split("")); refs.current[5]?.focus(); }
  };
  return (
    <div className="otp-boxes">
      {otp.map((v, i) => (
        <input key={i} ref={el => refs.current[i] = el}
          className="otp-box" maxLength={1} value={v}
          onChange={e => handle(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste} />
      ))}
    </div>
  );
}

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("password"); // password | otp | forgot | verify-email

  /* password */
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);

  /* email otp */
  const [otpId,    setOtpId]    = useState("");
  const [otpSent,  setOtpSent]  = useState(false);
  const [otp,      setOtp]      = useState(Array(6).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [devMode,  setDevMode]  = useState(false);

  /* forgot / reset password */
  const [fpEmail,    setFpEmail]    = useState("");
  const [fpOtp,      setFpOtp]      = useState(Array(6).fill(""));
  const [fpOtpSent,  setFpOtpSent]  = useState(false);
  const [fpNewPw,    setFpNewPw]    = useState("");
  const [fpConfirm,  setFpConfirm]  = useState("");
  const [fpCooldown, setFpCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [showChangeEmail,  setShowChangeEmail]  = useState(false);
  const [newEmailInput,    setNewEmailInput]    = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (fpCooldown <= 0) return;
    const t = setTimeout(() => setFpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [fpCooldown]);

  /* password login */
  const handlePasswordLogin = async () => {
    if (!identifier || !password) return setError("Please fill in all fields.");
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, { username: identifier, password }, { timeout: 60000 });
      localStorage.setItem("token", data.token);
      navigate("/student");
    } catch (err) {
      if (err.response?.data?.code === "EMAIL_UNVERIFIED") {
        // redirect to a verify page with the email
        setError("");
        setMode("verify-email");
        setOtpId(err.response.data.email || identifier);
        setSuccess("Your email is not verified. Enter the code sent to your email.");
        setCooldown(0);
      } else if (err.response?.status === 401 || err.response?.status === 404) {
        try {
          const { data: fData } = await axios.post(`${API}/faculty/login`, { facultyId: identifier, password }, { timeout: 60000 });
          localStorage.setItem("facultyToken", fData.token);
          localStorage.setItem("facultyName", fData.faculty.name);
          navigate("/faculty/dashboard");
          return;
        } catch {}
        setError(err.response?.data?.message || "Login failed.");
      } else {
        setError(err.response?.data?.message || "Login failed.");
      }
    } finally { setLoading(false); }
  };

  /* send email OTP */
  const handleSendOtp = async () => {
    const val = otpId.trim();
    if (!val) return setError("Enter your email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return setError("Enter a valid email address.");
    setError(""); setSuccess(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/send-otp`, { identifier: val }, { timeout: 15000 });
      setOtpSent(true);
      setDevMode(data.devMode === true);
      setSuccess(data.message);
      setCooldown(60);
    } catch (err) {
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        setError("Server is waking up — please wait 5 seconds and try again.");
      } else if (!err.response) {
        setError("Cannot reach server. Check your connection.");
      } else {
        setError(err.response?.data?.message || "Failed to send OTP.");
      }
    } finally { setLoading(false); }
  };

  /* verify email OTP */
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError("Enter the complete 6-digit OTP.");
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/verify-otp`, {
        identifier: otpId.trim(), otp: code,
      });
      localStorage.setItem("token", data.token);
      navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally { setLoading(false); }
  };

  const switchMode = m => {
    setMode(m); setError(""); setSuccess("");
    setOtpSent(false); setOtp(Array(6).fill("")); setDevMode(false);
    setShowChangeEmail(false); setNewEmailInput("");
  };

  const handleChangeEmail = async () => {
    const newEmail = newEmailInput.trim().toLowerCase();
    if (!newEmail) return setError("Enter a new email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return setError("Enter a valid email address.");
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/change-verify-email`, {
        oldEmail: otpId,
        newEmail,
      }, { timeout: 30000 });
      setOtpId(data.newEmail);          // update to new email
      setOtp(Array(6).fill(""));        // clear OTP boxes
      setShowChangeEmail(false);
      setNewEmailInput("");
      setSuccess(`Code sent to ${data.newEmail}`);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to change email.");
    } finally { setLoading(false); }
  };

  return (
    <div className="campus-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="auth-card">
        <div className="auth-logo-row">
          <div className="auth-logo-icon">
            <img src="/logo.png" alt="CampUs" style={{ width:28, height:28 }} />
          </div>
          <div>
            <div className="auth-logo-title">CampUs</div>
            <div className="auth-logo-sub">Connecting Students Together</div>
          </div>
        </div>

        <div className="auth-heading">Welcome back</div>
        <div className="auth-subtext">Sign in to your campus account</div>

        {mode !== "forgot" && (
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "password" ? "active" : ""}`}
              onClick={() => switchMode("password")}>🔑 Password</button>
            <button className={`auth-tab ${mode === "otp" ? "active" : ""}`}
              onClick={() => switchMode("otp")}>📧 Email OTP</button>
          </div>
        )}

        {error   && <div className="auth-error">⚠️ {error}</div>}
        {success && <div className="auth-success">✅ {success}</div>}

        {devMode && otpSent && (
          <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#fbbf24", marginBottom:14, lineHeight:1.5 }}>
            💡 Email delivery failed. Check your <strong>spam folder</strong> or contact support.
          </div>
        )}

        {/* PASSWORD */}
        {mode === "password" && (
          <form onSubmit={e => { e.preventDefault(); handlePasswordLogin(); }} autoComplete="on">
            <div className="auth-field">
              <input className="auth-input" placeholder="Username or Email"
                autoComplete="username"
                name="username"
                value={identifier} onChange={e => setIdentifier(e.target.value)} />
            </div>
            <div className="auth-field">
              <input className="auth-input padded-right"
                type={showPw ? "text" : "password"} placeholder="Password"
                autoComplete="current-password"
                name="password"
                value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" className="eye-btn" onClick={() => setShowPw(!showPw)}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            <div style={{ textAlign:"right", marginBottom:12, marginTop:-4 }}>
              <span style={{ fontSize:12, color:"#60a5fa", cursor:"pointer", fontWeight:600 }}
                onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}>
                Forgot password?
              </span>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === "forgot" && (
          <>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>🔑 Reset Password</div>
            <p className="auth-hint" style={{ marginBottom:14 }}>Enter your registered email to receive a reset code.</p>
            <div className="otp-send-row">
              <input className="auth-input" placeholder="Your email address" type="email"
                value={fpEmail} onChange={e => { setFpEmail(e.target.value); setFpOtpSent(false); setFpOtp(Array(6).fill("")); }}
                disabled={fpOtpSent && fpCooldown > 0} />
              <button className="send-btn"
                disabled={loading || (fpOtpSent && fpCooldown > 0)}
                onClick={async () => {
                  if (!fpEmail) return setError("Enter your email.");
                  setError(""); setSuccess(""); setLoading(true);
                  try {
                    const { data } = await axios.post(`${API}/auth/forgot-password`, { email: fpEmail }, { timeout: 60000 });
                    setFpOtpSent(true); setFpCooldown(60); setSuccess(data.message);
                  } catch (e) { setError(e.response?.data?.message || "Failed to send reset code."); }
                  finally { setLoading(false); }
                }}>
                {loading ? "…" : fpCooldown > 0 ? `${fpCooldown}s` : fpOtpSent ? "Resend" : "Send Code"}
              </button>
            </div>
            {fpOtpSent && (
              <>
                <p className="auth-hint">Enter the 6-digit code sent to <strong style={{ color:"#fff" }}>{fpEmail}</strong></p>
                <OtpBoxes otp={fpOtp} setOtp={setFpOtp} />
                <div className="auth-field" style={{ marginTop:12 }}>
                  <input className="auth-input" type="password" placeholder="New password (min 6 chars)"
                    value={fpNewPw} onChange={e => setFpNewPw(e.target.value)} />
                </div>
                <div className="auth-field">
                  <input className="auth-input" type="password" placeholder="Confirm new password"
                    value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} />
                </div>
                <button className="auth-btn" disabled={loading}
                  onClick={async () => {
                    if (fpNewPw !== fpConfirm) return setError("Passwords don't match.");
                    if (fpNewPw.length < 6) return setError("Password must be at least 6 characters.");
                    setError(""); setLoading(true);
                    try {
                      const { data } = await axios.post(`${API}/auth/reset-password`, { email: fpEmail, otp: fpOtp.join(""), newPassword: fpNewPw }, { timeout: 60000 });
                      setSuccess(data.message);
                      setTimeout(() => { setMode("password"); setFpEmail(""); setFpOtp(Array(6).fill("")); setFpOtpSent(false); setFpNewPw(""); setFpConfirm(""); }, 2000);
                    } catch (e) { setError(e.response?.data?.message || "Reset failed."); }
                    finally { setLoading(false); }
                  }}>
                  {loading ? "Resetting…" : "Reset Password →"}
                </button>
              </>
            )}
            <p className="auth-hint" style={{ marginTop:14, textAlign:"center" }}>
              <span style={{ color:"#60a5fa", cursor:"pointer", fontWeight:600 }} onClick={() => { setMode("password"); setError(""); setSuccess(""); }}>← Back to login</span>
            </p>
          </>
        )}

        {/* VERIFY EMAIL (after registration) */}
        {mode === "verify-email" && (
          <>
            {!showChangeEmail ? (
              <>
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:40, marginBottom:8 }}>📧</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:4 }}>Verify your email</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
                    Enter the code sent to <strong style={{ color:"#60a5fa" }}>{otpId}</strong>
                  </div>
                </div>
                <OtpBoxes otp={otp} setOtp={setOtp} />
                <button className="auth-btn" style={{ marginTop:12 }} disabled={loading || otp.join("").length < 6}
                  onClick={async () => {
                    setError(""); setLoading(true);
                    try {
                      const { data } = await axios.post(`${API}/auth/verify-registration-email`, { email: otpId, otp: otp.join("") }, { timeout: 60000 });
                      if (data.token) { localStorage.setItem("token", data.token); navigate("/student"); }
                      else { setSuccess(data.message); setTimeout(() => navigate("/"), 1500); }
                    } catch (e) { setError(e.response?.data?.message || "Verification failed."); }
                    finally { setLoading(false); }
                  }}>
                  {loading ? "Verifying…" : "Verify & Sign In →"}
                </button>
                <div style={{ textAlign:"center", marginTop:12, fontSize:12, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ color:"#60a5fa", cursor:"pointer" }}
                    onClick={async () => {
                      try {
                        await axios.post(`${API}/auth/resend-verify-email`, { email: otpId });
                        setSuccess("Code resent!"); setOtp(Array(6).fill(""));
                      } catch (e) { setError(e.response?.data?.message || "Failed"); }
                    }}>
                    Resend code
                  </span>
                  <span style={{ color:"rgba(255,255,255,0.2)" }}>·</span>
                  <span style={{ color:"#a78bfa", cursor:"pointer" }}
                    onClick={() => { setOtp(Array(6).fill("")); setError(""); setSuccess(""); }}>
                    Re-enter OTP
                  </span>
                  <span style={{ color:"rgba(255,255,255,0.2)" }}>·</span>
                  <span style={{ color:"#f59e0b", cursor:"pointer" }}
                    onClick={() => { setShowChangeEmail(true); setNewEmailInput(""); setError(""); setSuccess(""); }}>
                    Change email
                  </span>
                </div>
              </>
            ) : (
              /* ── Change Email Form ── */
              <>
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>✉️</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:4 }}>Change Email Address</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.5 }}>
                    Enter a new email. Your account details (password, phone, etc.) will be kept.
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:12 }}>
                  Current: <strong style={{ color:"rgba(255,255,255,0.6)" }}>{otpId}</strong>
                </div>
                <div className="auth-field">
                  <input className="auth-input" type="email" placeholder="Enter new email address"
                    value={newEmailInput}
                    onChange={e => { setNewEmailInput(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleChangeEmail()}
                    autoFocus
                  />
                </div>
                <button className="auth-btn" disabled={loading || !newEmailInput.trim()}
                  onClick={handleChangeEmail}>
                  {loading ? "Updating…" : "Update & Send OTP →"}
                </button>
                <p style={{ textAlign:"center", marginTop:10, fontSize:12 }}>
                  <span style={{ color:"rgba(255,255,255,0.4)", cursor:"pointer" }}
                    onClick={() => { setShowChangeEmail(false); setError(""); setSuccess(""); }}>
                    ← Back
                  </span>
                </p>
              </>
            )}
          </>
        )}

        {/* EMAIL OTP */}
        {mode === "otp" && (
          <>
            <div className="otp-send-row">
              <input className="auth-input" placeholder="Email address"
                value={otpId}
                onChange={e => { setOtpId(e.target.value); setOtpSent(false); setOtp(Array(6).fill("")); setSuccess(""); setError(""); setDevMode(false); }}
                disabled={otpSent && cooldown > 0} />
              <button className="send-btn" onClick={handleSendOtp}
                disabled={loading || (otpSent && cooldown > 0)}>
                {loading && !otpSent ? "…" : cooldown > 0 ? `${cooldown}s` : otpSent ? "Resend" : "Send OTP"}
              </button>
            </div>

            {!otpSent && (
              <p className="auth-hint" style={{ marginBottom:14 }}>
                We'll send a 6-digit code to your email.
              </p>
            )}

            {otpSent && (
              <>
                <p className="auth-hint">
                  Enter the code sent to <strong style={{ color:"#fff" }}>{otpId}</strong>
                </p>
                <OtpBoxes otp={otp} setOtp={setOtp} />
                <button className="auth-btn" onClick={handleVerifyOtp} disabled={loading}>
                  {loading ? "Verifying…" : "Verify & Sign In →"}
                </button>
                <div style={{ textAlign:"center", marginTop:10, fontSize:12, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ color:"#a78bfa", cursor:"pointer" }}
                    onClick={() => { setOtp(Array(6).fill("")); setError(""); setSuccess(""); }}>
                    Re-enter OTP
                  </span>
                  <span style={{ color:"rgba(255,255,255,0.2)" }}>·</span>
                  <span style={{ color:"#60a5fa", cursor:"pointer" }}
                    onClick={() => { setOtpSent(false); setOtp(Array(6).fill("")); setCooldown(0); setError(""); setSuccess(""); }}>
                    Change email
                  </span>
                </div>

                {/* Contact Admin fallback */}
                <div style={{ marginTop:16, padding:"12px 14px", background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10, textAlign:"center" }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:8 }}>
                    Not receiving OTP?
                  </div>
                  <a
                    href={`mailto:campus4292@gmail.com?subject=OTP%20Request%20-%20CampUs&body=Hi%20Admin%2C%0A%0AI%20am%20unable%20to%20receive%20the%20OTP%20on%20my%20email%3A%20${encodeURIComponent(otpId)}%0A%0APlease%20send%20me%20the%20OTP%20to%20login%20to%20CampUs.%0A%0AThank%20you.`}
                    style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 16px", background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.35)", borderRadius:8, color:"#fbbf24", fontSize:12, fontWeight:600, textDecoration:"none" }}>
                    ✉️ Contact Admin for OTP
                  </a>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:6 }}>
                    Opens your email app — sends request to admin
                  </div>
                </div>
              </>
            )}

            {!otpSent && (
              <button className="auth-btn" onClick={handleSendOtp} disabled={loading || !otpId}>
                {loading ? "Sending…" : "Get OTP →"}
              </button>
            )}
          </>
        )}

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span>or</span>
          <div className="auth-divider-line" />
        </div>

        <p className="auth-switch">
          Don't have an account?
          <span className="auth-link" onClick={() => navigate("/register")}>Create one</span>
        </p>
        <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:8 }}>
          Faculty? Use your Faculty ID or email — you'll be redirected automatically.
        </p>
      </div>
    </div>
  );
}

export default Auth;
