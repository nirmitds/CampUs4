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
  const [mode, setMode] = useState("password");

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

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  /* password login */
  const handlePasswordLogin = async () => {
    if (!identifier || !password) return setError("Please fill in all fields.");
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, { username: identifier, password });
      localStorage.setItem("token", data.token);
      navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
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
      const { data } = await axios.post(`${API}/auth/send-otp`, { identifier: val }, { timeout: 30000 });
      setOtpSent(true);
      setDevMode(data.devMode === true);
      setSuccess(data.message);
      setCooldown(60);
    } catch (err) {
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        setError("Server is waking up (free tier). Please wait 30s and try again.");
      } else {
        setError(err.response?.data?.message || "Failed to send OTP. Check backend is running.");
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
  };

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

        <div className="auth-heading">Welcome back</div>
        <div className="auth-subtext">Sign in to your campus account</div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "password" ? "active" : ""}`}
            onClick={() => switchMode("password")}>🔑 Password</button>
          <button className={`auth-tab ${mode === "otp" ? "active" : ""}`}
            onClick={() => switchMode("otp")}>📧 Email OTP</button>
        </div>

        {error   && <div className="auth-error">⚠️ {error}</div>}
        {success && <div className="auth-success">✅ {success}</div>}

        {devMode && otpSent && (
          <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#fbbf24", marginBottom:14, lineHeight:1.5 }}>
            💡 <strong>Dev mode:</strong> Check the <strong>backend terminal</strong> for the OTP.
          </div>
        )}

        {/* PASSWORD */}
        {mode === "password" && (
          <>
            <div className="auth-field">
              <input className="auth-input" placeholder="Username or Email"
                value={identifier} onChange={e => setIdentifier(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handlePasswordLogin()} />
            </div>
            <div className="auth-field">
              <input className="auth-input padded-right"
                type={showPw ? "text" : "password"} placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handlePasswordLogin()} />
              <button className="eye-btn" onClick={() => setShowPw(!showPw)}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            <button className="auth-btn" onClick={handlePasswordLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
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
      </div>
    </div>
  );
}

export default Auth;
