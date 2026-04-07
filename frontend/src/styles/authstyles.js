const STYLE_ID = "campus-auth-styles";

export function injectAuthStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

    .campus-page {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #05050f;
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(255,255,255,0.85);
      position: relative;
      overflow: hidden;
      padding: 24px;
      box-sizing: border-box;
    }

    /* blobs */
    .blob {
      position: fixed; border-radius: 50%;
      filter: blur(90px); opacity: 0.5;
      animation: floatBlob 14s ease-in-out infinite alternate;
      pointer-events: none; z-index: 0;
    }
    .blob-1 { width:500px; height:500px; background:radial-gradient(circle,#3b82f6,#1d4ed8); top:-150px; left:-150px; }
    .blob-2 { width:400px; height:400px; background:radial-gradient(circle,#ec4899,#9333ea); bottom:-100px; right:-100px; animation-duration:11s; animation-delay:-5s; }
    .blob-3 { width:260px; height:260px; background:radial-gradient(circle,#06b6d4,#3b82f6); top:40%; left:55%; animation-duration:17s; animation-delay:-8s; opacity:0.3; }
    @keyframes floatBlob {
      0%   { transform: translate(0,0) scale(1); }
      50%  { transform: translate(30px,-40px) scale(1.06); }
      100% { transform: translate(-15px,25px) scale(0.95); }
    }

    /* card */
    .auth-card {
      position: relative; z-index: 10;
      width: 100%; max-width: 420px;
      padding: 40px 36px 32px;
      background: rgba(255,255,255,0.055);
      backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12);
      animation: cardIn 0.6s cubic-bezier(.22,1,.36,1) both;
      font-family: 'Outfit', sans-serif;
      font-size: 14px; line-height: 1.5;
      color: rgba(255,255,255,0.85);
      text-align: left;
      box-sizing: border-box;
      max-height: 90vh;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .auth-card::-webkit-scrollbar { width: 3px; }
    .auth-card::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
    @keyframes cardIn {
      from { opacity:0; transform:translateY(28px) scale(0.97); }
      to   { opacity:1; transform:none; }
    }

    /* logo row */
    .auth-logo-row {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 24px;
    }
    .auth-logo-icon {
      width: 44px; height: 44px; flex-shrink: 0;
      background: linear-gradient(135deg,#3b82f6,#8b5cf6);
      border-radius: 13px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      box-shadow: 0 6px 20px rgba(59,130,246,0.4);
    }
    .auth-logo-title {
      font-size: 18px; font-weight: 700; color: #fff;
      letter-spacing: -0.3px; line-height: 1.2;
    }
    .auth-logo-sub { font-size: 11px; color: rgba(255,255,255,0.38); margin-top: 2px; }

    /* heading */
    .auth-heading {
      font-size: 24px !important;
      font-weight: 800 !important;
      color: #fff !important;
      letter-spacing: -0.4px !important;
      margin: 0 0 4px 0 !important;
      padding: 0 !important;
      line-height: 1.25 !important;
      display: block;
    }
    .auth-subtext {
      font-size: 13px !important;
      color: rgba(255,255,255,0.4) !important;
      margin: 0 0 22px 0 !important;
      padding: 0 !important;
      line-height: 1.4 !important;
      display: block;
    }

    /* tabs */
    .auth-tabs {
      display: flex;
      background: rgba(255,255,255,0.06);
      border-radius: 12px; padding: 4px;
      margin-bottom: 20px;
    }
    .auth-tab {
      flex: 1; padding: 9px 6px;
      font-family: 'Outfit', sans-serif;
      font-size: 13px; font-weight: 600;
      border: none; background: transparent;
      color: rgba(255,255,255,0.4);
      border-radius: 9px; cursor: pointer;
      transition: all 0.2s;
    }
    .auth-tab.active {
      background: rgba(59,130,246,0.85); color: #fff;
      box-shadow: 0 4px 14px rgba(59,130,246,0.35);
    }

    /* step dots */
    .step-row {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 22px;
    }
    .step-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255,255,255,0.15);
      transition: background 0.3s, transform 0.3s;
    }
    .step-dot.active { background: #3b82f6; transform: scale(1.35); }
    .step-dot.done   { background: #22c55e; }
    .step-line { flex: 1; height: 1px; background: rgba(255,255,255,0.1); }

    /* inputs */
    .auth-field { position: relative; margin-bottom: 12px; }
    .auth-input {
      width: 100%; padding: 12px 15px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 12px;
      font-family: 'Outfit', sans-serif;
      font-size: 14px; color: #fff;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
      -webkit-appearance: none;
      appearance: none;
    }
    .auth-input::placeholder { color: rgba(255,255,255,0.28); }
    .auth-input:focus {
      border-color: rgba(59,130,246,0.6);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.14);
    }
    .auth-input:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-input.padded-right { padding-right: 44px; }
    /* select specific */
    select.auth-input {
      background: rgba(15,15,35,0.98);
      cursor: pointer;
      color: #fff;
      padding-right: 36px;
    }
    select.auth-input option {
      background: #111128;
      color: #fff;
      padding: 10px;
      font-size: 14px;
    }
    select.auth-input option:disabled,
    select.auth-input option[value=""] {
      color: rgba(255,255,255,0.35);
    }

    .eye-btn {
      position: absolute; right: 13px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      color: rgba(255,255,255,0.35);
      cursor: pointer; font-size: 16px; line-height: 1;
      transition: color 0.2s;
    }
    .eye-btn:hover { color: rgba(255,255,255,0.7); }

    /* otp row */
    .otp-send-row { display: flex; gap: 10px; margin-bottom: 12px; }
    .otp-send-row .auth-input { flex: 1; }
    .send-btn {
      white-space: nowrap; padding: 12px 15px;
      background: rgba(59,130,246,0.18);
      border: 1px solid rgba(59,130,246,0.35);
      border-radius: 12px; color: #60a5fa;
      font-family: 'Outfit', sans-serif;
      font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .send-btn:hover:not(:disabled) { background: rgba(59,130,246,0.3); color: #fff; }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* 6-box OTP */
    .otp-boxes {
      display: flex; gap: 6px; margin-bottom: 12px;
      width: 100%;
    }
    .otp-box {
      flex: 1; min-width: 0;
      height: 48px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 10px; text-align: center;
      font-family: 'Outfit', sans-serif;
      font-size: 18px; font-weight: 700; color: #fff;
      outline: none; transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
      padding: 0;
    }
    .otp-box:focus {
      border-color: rgba(59,130,246,0.6);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.14);
    }

    /* strength */
    .strength-wrap { margin: 2px 0 12px; }
    .strength-bar  { height: 4px; border-radius: 4px; background: rgba(255,255,255,0.08); overflow: hidden; }
    .strength-fill { height: 100%; border-radius: 4px; transition: width 0.3s, background 0.3s; }
    .strength-label { font-size: 11px; margin-top: 4px; }

    /* primary button */
    .auth-btn {
      width: 100%; padding: 13px;
      background: linear-gradient(135deg,#3b82f6,#6366f1);
      border: none; border-radius: 13px;
      font-family: 'Outfit', sans-serif;
      font-size: 15px; font-weight: 700; color: #fff;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(59,130,246,0.35);
      transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
      margin-top: 4px; display: block;
    }
    .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(59,130,246,0.5); }
    .auth-btn:active:not(:disabled) { transform: scale(0.98); }
    .auth-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    /* back button */
    .back-btn {
      padding: 13px 16px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 13px; color: rgba(255,255,255,0.55);
      font-family: 'Outfit', sans-serif;
      font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background 0.2s; flex-shrink: 0;
    }
    .back-btn:hover { background: rgba(255,255,255,0.12); }

    /* divider */
    .auth-divider {
      display: flex; align-items: center; gap: 12px;
      margin: 16px 0;
    }
    .auth-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.09); }
    .auth-divider span { font-size: 12px; color: rgba(255,255,255,0.28); }

    /* alerts */
    .auth-error {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.28);
      border-radius: 10px; padding: 10px 14px;
      font-size: 13px; color: #fca5a5; margin-bottom: 14px;
    }
    .auth-success {
      background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.28);
      border-radius: 10px; padding: 10px 14px;
      font-size: 13px; color: #86efac; margin-bottom: 14px;
    }

    /* switch */
    .auth-switch {
      margin-top: 18px; text-align: center;
      font-size: 13px; color: rgba(255,255,255,0.38);
    }
    .auth-link {
      color: #60a5fa; font-weight: 600;
      cursor: pointer; margin-left: 5px; transition: color 0.2s;
    }
    .auth-link:hover { color: #93c5fd; }

    /* hint */
    .auth-hint {
      font-size: 12px; color: rgba(255,255,255,0.35);
      margin-bottom: 10px; display: block;
    }

    @media (max-width: 480px) {
      .campus-page { padding: 12px; }
      .auth-card { padding: 22px 16px 20px; border-radius: 18px; }
      .auth-heading { font-size: 20px !important; }
      .otp-box { height: 42px; font-size: 16px; }
      .otp-boxes { gap: 5px; }
      .auth-btn { padding: 12px; font-size: 14px; }
      .auth-tabs { padding: 3px; }
      .auth-tab { padding: 8px 4px; font-size: 12px; }
    }
    @media (max-width: 360px) {
      .auth-card { padding: 18px 14px 16px; }
      .otp-box { height: 38px; font-size: 15px; }
      .otp-boxes { gap: 4px; }
    }
  `;
  document.head.appendChild(style);
}
