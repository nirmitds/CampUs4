import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
import VerifyBanner from "../components/VerifyBanner";
import { useVerification } from "../hooks/useVerification";

injectDashStyles();

const WALLET_STYLE = "campus-wallet-styles";
if (!document.getElementById(WALLET_STYLE)) {
  const s = document.createElement("style");
  s.id = WALLET_STYLE;
  s.textContent = `
    .wallet-hero {
      background: linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(245,158,11,0.06) 100%);
      border: 1px solid rgba(251,191,36,0.2);
      border-radius: 20px; padding: 32px; text-align: center;
      margin-bottom: 20px; position: relative; overflow: hidden;
    }
    .wallet-hero::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(ellipse 60% 60% at 50% 0%, rgba(251,191,36,0.15), transparent);
      pointer-events: none;
    }
    .wallet-balance { font-size: 56px; font-weight: 900; color: #fbbf24; letter-spacing: -2px; line-height: 1; }
    .wallet-label   { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 6px; }
    .coin-flash { animation: coinFlash 0.6s ease both; }
    @keyframes coinFlash {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.18); color: #fde68a; }
      100% { transform: scale(1); }
    }
    .tx-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
      animation: txIn 0.3s ease both;
    }
    .tx-row:last-child { border-bottom: none; }
    @keyframes txIn {
      from { opacity:0; transform: translateX(-10px); }
      to   { opacity:1; transform: none; }
    }
    .tx-icon {
      width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .tx-icon.credit { background: rgba(34,197,94,0.15); }
    .tx-icon.debit  { background: rgba(239,68,68,0.12); }
    .tx-desc  { flex: 1; font-size: 14px; font-weight: 500; }
    .tx-date  { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }
    .tx-amt   { font-size: 15px; font-weight: 800; flex-shrink: 0; }
    .tx-amt.credit { color: #4ade80; }
    .tx-amt.debit  { color: #f87171; }

    .task-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; padding: 16px;
      display: flex; align-items: center; gap: 14px;
      transition: all 0.2s;
    }
    .task-card:hover { border-color: rgba(251,191,36,0.3); background: rgba(251,191,36,0.05); }
    .task-card.done  { opacity: 0.5; }
    .task-icon { font-size: 28px; flex-shrink: 0; }
    .task-body { flex: 1; min-width: 0; }
    .task-title { font-size: 14px; font-weight: 700; }
    .task-desc  { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; }
    .task-next  { font-size: 11px; color: rgba(251,191,36,0.6); margin-top: 3px; }
    .task-earn  { font-size: 13px; font-weight: 800; color: #fbbf24; flex-shrink: 0; }
    .task-btn {
      padding: 7px 14px; border-radius: 9px; border: none;
      font-family: 'Outfit',sans-serif; font-size: 12px; font-weight: 700;
      cursor: pointer; transition: all 0.18s; flex-shrink: 0;
    }
    .task-btn.available {
      background: linear-gradient(135deg,#f59e0b,#d97706); color: #fff;
      box-shadow: 0 4px 12px rgba(245,158,11,0.35);
    }
    .task-btn.available:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(245,158,11,0.5); }
    .task-btn.done { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); cursor: not-allowed; }

    .transfer-modal {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px); z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .transfer-box {
      background: #0f0f23; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px; padding: 28px; width: 100%; max-width: 400px;
      animation: slideUp 0.25s ease both;
    }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }

    .earn-toast {
      position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg,#f59e0b,#d97706);
      color: #fff; font-weight: 800; font-size: 15px;
      padding: 10px 24px; border-radius: 12px;
      box-shadow: 0 8px 28px rgba(245,158,11,0.5);
      z-index: 9999; animation: toastIn 0.3s ease both;
      white-space: nowrap;
    }
    @keyframes toastIn {
      from{opacity:0;transform:translateX(-50%) translateY(-10px) scale(0.9)}
      to  {opacity:1;transform:translateX(-50%) translateY(0) scale(1)}
    }
  `;
  document.head.appendChild(s);
}

import API from "../api.js";
const tok = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

function fmtDate(d) {
  const dt = new Date(d), now = new Date();
  const diff = Math.floor((now - dt) / 60000);
  if (diff < 1)   return "just now";
  if (diff < 60)  return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
  return dt.toLocaleDateString([], { day:"numeric", month:"short" });
}

function fmtCountdown(nextAt) {
  const diff = new Date(nextAt) - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const TX_ICONS = {
  bonus: "🎁", exchange: "🔄", task: "✅", survey: "📋", transfer: "💸", penalty: "⚠️"
};

export default function Wallet() {
  const navigate = useNavigate();
  const { idVerified, isVerified } = useVerification();

  // ── all state at top level ──
  const [coins,      setCoins]      = useState(null);
  const [txs,        setTxs]        = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [tab,        setTab]        = useState("overview");
  const [toast,      setToast]      = useState("");
  const [flash,      setFlash]      = useState(false);
  const [showXfer,   setShowXfer]   = useState(false);
  const [showBuy,    setShowBuy]    = useState(false);
  const [packages,   setPackages]   = useState([]);
  const [upiInfo,    setUpiInfo]    = useState({ upiId:"", upiName:"", qrImage:null });
  const [buyBusy,    setBuyBusy]    = useState(null);
  const [xferTo,     setXferTo]     = useState("");
  const [xferAmt,    setXferAmt]    = useState("");
  const [xferNote,   setXferNote]   = useState("");
  const [xferBusy,   setXferBusy]   = useState(false);
  const [taskBusy,   setTaskBusy]   = useState(null);
  const [deposit,    setDeposit]    = useState(null);
  const [utr,        setUtr]        = useState("");
  const [utrBusy,    setUtrBusy]    = useState(false);
  const [depTimer,   setDepTimer]   = useState(0);  // renamed to avoid conflict with task countdown

  const socketRef = useRef();
  const countRef  = useRef();

  const loadWallet = async () => {
    try {
      const { data } = await axios.get(`${API}/wallet`, { headers: hdrs() });
      setCoins(data.coins);
      setTxs(data.transactions);
    } catch {}
  };

  const loadTasks = async () => {
    try {
      const { data } = await axios.get(`${API}/wallet/tasks`, { headers: hdrs() });
      setTasks(data.tasks || data); // handle both old and new format
    } catch {}
  };

  useEffect(() => {
    loadWallet();
    loadTasks();
    axios.get(`${API}/wallet/packages`, { headers: hdrs() }).then(r => {
      setPackages(r.data.packages || []);
      setUpiInfo({ upiId: r.data.upiId || "", upiName: r.data.upiName || "", qrImage: r.data.qrImage || null });
    }).catch(() => {});

    const socket = io(API, { auth: { token: tok() }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("wallet_update", ({ coins: c, tx }) => {
      setCoins(c);
      setFlash(true); setTimeout(() => setFlash(false), 600);
      if (tx) setTxs(prev => [tx, ...prev].slice(0, 50));
    });
    socket.on("deposit_approved", ({ coins: c }) => {
      setCoins(c); setFlash(true); setTimeout(() => setFlash(false), 600);
      showToast("🎉 Coins credited! Your deposit was approved.");
      loadWallet();
    });
    socket.on("deposit_rejected", () => {
      showToast("❌ Your deposit was rejected. Contact support.");
    });
    return () => socket.disconnect();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleTask = async (task) => {
    /* redirect tasks — send user to the right page to complete the action */
    if (task.action === "redirect" && task.actionUrl) {
      navigate(task.actionUrl);
      return;
    }
    /* claim tasks — award coins immediately */
    setTaskBusy(task.id);
    try {
      const { data } = await axios.post(`${API}/wallet/task/${task.id}`, {}, { headers: hdrs() });
      setCoins(data.coins);
      setFlash(true); setTimeout(() => setFlash(false), 600);
      setTxs(prev => [data.tx, ...prev].slice(0, 50));
      showToast(data.message);
      loadTasks();
    } catch (e) {
      showToast("⚠️ " + (e.response?.data?.message || "Failed"));
    } finally { setTaskBusy(null); }
  };

  const handleTransfer = async () => {
    const amt = parseInt(xferAmt);
    if (!xferTo || isNaN(amt) || amt <= 0) return showToast("Fill all fields");
    setXferBusy(true);
    try {
      const { data } = await axios.post(`${API}/wallet/transfer`,
        { toUsername: xferTo, amount: amt, note: xferNote },
        { headers: hdrs() }
      );
      setCoins(data.coins);
      setFlash(true); setTimeout(() => setFlash(false), 600);
      showToast(data.message);
      setShowXfer(false); setXferTo(""); setXferAmt(""); setXferNote("");
      loadWallet();
    } catch (e) {
      showToast("⚠️ " + (e.response?.data?.message || "Transfer failed"));
    } finally { setXferBusy(false); }
  };

  const handlePurchase = async (pkg) => {
    if (!pkg.available) return;
    setBuyBusy(pkg.id);
    try {
      const { data } = await axios.post(`${API}/wallet/deposit`, { packageId: pkg.id }, { headers: hdrs() });
      setDeposit(data);
      setUtr("");
      /* start 5-min countdown */
      const secs = Math.floor((new Date(data.expiresAt) - Date.now()) / 1000);
      setDepTimer(secs);
      clearInterval(countRef.current);
      countRef.current = setInterval(() => {
        setDepTimer(c => {
          if (c <= 1) { clearInterval(countRef.current); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (e) {
      showToast("⚠️ " + (e.response?.data?.message || "Failed to create deposit"));
    } finally { setBuyBusy(null); }
  };

  const handleSubmitUtr = async () => {
    if (!utr.trim()) return showToast("Enter your UTR / transaction number");
    if (depTimer <= 0) return showToast("⚠️ Deposit expired. Please start again.");
    setUtrBusy(true);
    try {
      const { data } = await axios.put(`${API}/wallet/deposit/${deposit.deposit._id}/utr`, { utr }, { headers: hdrs() });
      showToast("✅ " + data.message);
      setDeposit(null); setUtr(""); setShowBuy(false);
      clearInterval(countRef.current);
    } catch (e) {
      showToast("⚠️ " + (e.response?.data?.message || "Failed"));
    } finally { setUtrBusy(false); }
  };

  const availableTasks = tasks.filter(t => t.canDo);
  const totalEarnable  = availableTasks.reduce((a, t) => a + t.coins, 0);

  return (
    <div className="dash-page">
      {toast && <div className="earn-toast">{toast}</div>}
      <VerifyBanner idVerified={idVerified} blockedActions={!isVerified ? ["Add Coins", "Transfer Coins"] : []} />

      {/* ── QR Deposit Modal ── */}
      {showBuy && (
        <div className="transfer-modal" onClick={e => e.target === e.currentTarget && !deposit && setShowBuy(false)}>
          <div className="transfer-box" style={{ maxWidth: 420 }}>
            {!deposit ? (
              /* STEP 1: pick package */
              <>
                <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>💳 Add Coins</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:20 }}>
                  Pay via UPI · Admin credits coins after verification
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                  {packages.map(pkg => {
                    const unavailable = pkg.oneTime && pkg.available === false;
                    return (
                      <div key={pkg.id}
                        onClick={() => !buyBusy && !unavailable && handlePurchase(pkg)}
                        style={{
                          padding:"14px", borderRadius:12, cursor: (buyBusy||unavailable) ? "not-allowed" : "pointer",
                          background: pkg.id==="pack_10" ? "linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.15))" : "rgba(255,255,255,0.05)",
                          border: pkg.id==="pack_10" ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.09)",
                          position:"relative", opacity: unavailable ? 0.45 : 1, transition:"all 0.15s",
                        }}>
                        {pkg.badge && !unavailable && (
                          <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)", background: pkg.id==="pack_10" ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#3b82f6,#8b5cf6)", color:"#fff", fontSize:8, fontWeight:800, padding:"2px 8px", borderRadius:8, whiteSpace:"nowrap" }}>{pkg.badge}</div>
                        )}
                        {unavailable && <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)", background:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.6)", fontSize:8, fontWeight:800, padding:"2px 8px", borderRadius:8 }}>USED</div>}
                        <div style={{ fontSize:20, fontWeight:900, color: pkg.id==="pack_10"?"#4ade80":"#fbbf24", marginBottom:2 }}>💰 {pkg.coins}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>{pkg.label}</div>
                        <div style={{ fontSize:16, fontWeight:800 }}>₹{pkg.inr}</div>
                        {buyBusy===pkg.id && <div style={{ fontSize:11, color:"#60a5fa", marginTop:4 }}>Creating…</div>}
                      </div>
                    );
                  })}
                </div>
                <button className="btn btn-ghost" style={{ width:"100%" }} onClick={() => setShowBuy(false)}>Cancel</button>
              </>
            ) : (
              /* STEP 2: show QR + countdown */
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div style={{ fontSize:16, fontWeight:700 }}>📱 Scan & Pay</div>
                  <div style={{ fontSize:13, fontWeight:800, color: depTimer <= 60 ? "#f87171" : "#fbbf24" }}>
                    ⏱ {String(Math.floor(depTimer/60)).padStart(2,"0")}:{String(depTimer%60).padStart(2,"0")}
                  </div>
                </div>

                {depTimer <= 0 ? (
                  <div style={{ textAlign:"center", padding:"24px 0" }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>⏰</div>
                    <div style={{ fontSize:15, fontWeight:700, color:"#f87171", marginBottom:8 }}>Deposit Expired</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:16 }}>The 5-minute window has passed.</div>
                    <button className="btn btn-primary" onClick={() => { setDeposit(null); setUtr(""); }}>Try Again</button>
                  </div>
                ) : (
                  <>
                    {/* QR image */}
                    <div style={{ background:"#fff", borderRadius:16, padding:16, textAlign:"center", marginBottom:14 }}>
                      {upiInfo.qrImage
                        ? <img src={upiInfo.qrImage} alt="QR" style={{ width:"100%", maxWidth:220, height:"auto" }} />
                        : (
                          <div style={{ width:220, height:220, margin:"0 auto", background:"#f0f0f0", borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                            <div style={{ fontSize:32 }}>📱</div>
                            <div style={{ fontSize:12, color:"#666", textAlign:"center", padding:"0 16px" }}>
                              Add QR_IMAGE_URL to backend/.env to show your QR code here
                            </div>
                          </div>
                        )
                      }
                      <div style={{ fontSize:13, color:"#333", marginTop:10, fontWeight:600 }}>UPI ID: {upiInfo.upiId}</div>
                      <div style={{ fontSize:12, color:"#666" }}>{upiInfo.upiName}</div>
                    </div>

                    {/* amount to pay */}
                    <div style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", borderRadius:12, padding:"12px 16px", textAlign:"center", marginBottom:14 }}>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Pay exactly</div>
                      <div style={{ fontSize:28, fontWeight:900, color:"#fbbf24" }}>₹{deposit.deposit.inr}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>to receive 💰 {deposit.deposit.coins} coins</div>
                    </div>

                    {/* UTR input */}
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>
                      After paying, enter your UTR / transaction reference number:
                    </div>
                    <input className="dash-input" placeholder="e.g. 123456789012"
                      value={utr} onChange={e => setUtr(e.target.value)}
                      style={{ marginBottom:10 }} />

                    <button className="btn btn-primary" style={{ width:"100%", marginBottom:8 }}
                      onClick={handleSubmitUtr} disabled={utrBusy || !utr.trim()}>
                      {utrBusy ? "Submitting…" : "✅ I've Paid — Submit UTR"}
                    </button>
                    <button className="btn btn-ghost" style={{ width:"100%" }}
                      onClick={() => { setDeposit(null); setUtr(""); clearInterval(countRef.current); }}>
                      ← Back to Packages
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* transfer modal */}
      {showXfer && (
        <div className="transfer-modal" onClick={e => e.target === e.currentTarget && setShowXfer(false)}>
          <div className="transfer-box">
            <div style={{ fontSize:17, fontWeight:700, marginBottom:18 }}>💸 Transfer Coins</div>
            <div className="form-group">
              <label className="form-label">Recipient username</label>
              <input className="dash-input" placeholder="@username"
                value={xferTo} onChange={e => setXferTo(e.target.value.replace("@",""))} />
            </div>
            <div className="form-group">
              <label className="form-label">Amount 💰</label>
              <input className="dash-input" type="number" min="1" placeholder="0"
                value={xferAmt} onChange={e => setXferAmt(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input className="dash-input" placeholder="What's it for?"
                value={xferNote} onChange={e => setXferNote(e.target.value)} />
            </div>
            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              <button className="btn btn-ghost" onClick={() => setShowXfer(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:1 }}
                onClick={handleTransfer} disabled={xferBusy}>
                {xferBusy ? "Sending…" : "Send Coins"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">💰 Wallet</h1>
        <p className="page-sub">Manage and earn your campus coins</p>
      </div>

      {/* balance hero */}
      <div className="wallet-hero">
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:8 }}>Total Balance</div>
        <div className={`wallet-balance ${flash ? "coin-flash" : ""}`}>
          💰 {coins ?? "—"}
        </div>
        <div className="wallet-label">Campus Coins</div>
        {availableTasks.length > 0 && (
          <div style={{ fontSize:12, color:"#fbbf24", marginTop:8, opacity:0.8 }}>
            +{totalEarnable} 💰 available to earn right now
          </div>
        )}
        <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:20, flexWrap:"wrap" }}>
          <button className="btn btn-primary" onClick={() => isVerified && setShowBuy(true)}
            disabled={!isVerified} style={{ opacity: isVerified ? 1 : 0.5 }}>💳 Buy Coins</button>
          <button className="btn btn-ghost" onClick={() => setTab("earn")}>⚡ Earn Free</button>
          <button className="btn btn-ghost" onClick={() => isVerified && setShowXfer(true)}
            disabled={!isVerified} style={{ opacity: isVerified ? 1 : 0.5 }}>💸 Transfer</button>
          <button className="btn btn-ghost" onClick={() => setTab("history")}>📜 History</button>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.05)", borderRadius:12, padding:4, marginBottom:20, width:"fit-content" }}>
        {[["overview","📊 Overview"],["earn","⚡ Earn"],["history","📜 History"]].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding:"8px 16px", borderRadius:9, border:"none",
            fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:600, cursor:"pointer",
            background: tab===key ? "linear-gradient(135deg,#3b82f6,#8b5cf6)" : "transparent",
            color: tab===key ? "#fff" : "rgba(255,255,255,0.45)",
            transition:"all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <>
          {/* stats */}
          <div className="stat-grid" style={{ marginBottom:20 }}>
            <div className="stat-card">
              <span className="stat-icon">📈</span>
              <span className="stat-val" style={{ color:"#4ade80" }}>
                +{txs.filter(t=>t.type==="credit").reduce((a,t)=>a+t.amount,0)}
              </span>
              <span className="stat-label">Total Earned</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📉</span>
              <span className="stat-val" style={{ color:"#f87171" }}>
                -{txs.filter(t=>t.type==="debit").reduce((a,t)=>a+t.amount,0)}
              </span>
              <span className="stat-label">Total Spent</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <span className="stat-val" style={{ color:"#fbbf24" }}>
                {tasks.filter(t=>!t.canDo).length}/{tasks.length}
              </span>
              <span className="stat-label">Tasks Done</span>
            </div>
          </div>

          {/* recent transactions */}
          <div className="glass-card">
            <div className="row-between" style={{ marginBottom:14 }}>
              <div className="section-title" style={{ marginBottom:0 }}>Recent Activity</div>
              <button className="btn btn-ghost" style={{ padding:"5px 12px", fontSize:12 }}
                onClick={() => setTab("history")}>View all</button>
            </div>
            {txs.length === 0 ? (
              <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"24px 0" }}>
                No transactions yet
              </div>
            ) : txs.slice(0,6).map((t,i) => (
              <div key={t._id || i} className="tx-row">
                <div className={`tx-icon ${t.type}`}>{TX_ICONS[t.category] || "💰"}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="tx-desc">{t.description}</div>
                  <div className="tx-date">{fmtDate(t.createdAt)}</div>
                </div>
                <div className={`tx-amt ${t.type}`}>
                  {t.type==="credit" ? "+" : "-"}{t.amount} 💰
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── EARN ── */}
      {tab === "earn" && (
        <div className="glass-card">
          <div className="section-title">⚡ Earn Coins</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:20 }}>
            Complete campus activities to earn coins. All tasks are based on real actions within CampUs.
          </div>

          {/* 7-day streak calendar */}
          {(() => {
            const streakTasks = tasks.filter(t => t.streakDay !== undefined).sort((a,b) => a.streakDay - b.streakDay);
            if (!streakTasks.length) return null;
            const currentStreak = streakTasks[0]?.currentStreak ?? 0;
            return (
              <div style={{ marginBottom:20, padding:"16px", background:"linear-gradient(135deg,rgba(251,191,36,0.08),rgba(245,158,11,0.04))", border:"1px solid rgba(251,191,36,0.2)", borderRadius:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>🔥 Daily Login Streak</div>
                  <div style={{ fontSize:12, color:"#fbbf24", fontWeight:600 }}>Day {currentStreak}/7</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
                  {streakTasks.map(t => {
                    const isClaimed  = t.autoCompleted;           // previous days ✅
                    const isToday    = t.canDo;                    // claimable now 🌅
                    const isDoneToday = t.claimedToday;            // claimed today, come back tomorrow ✔️
                    const isFuture   = !t.canDo && !t.autoCompleted && !t.claimedToday; // locked 🔒
                    return (
                      <div key={t.id}
                        onClick={() => isToday && handleTask(t)}
                        style={{
                          display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                          padding:"10px 4px", borderRadius:12, cursor: isToday ? "pointer" : "default",
                          background: isClaimed ? "rgba(34,197,94,0.15)" : isDoneToday ? "rgba(59,130,246,0.15)" : isToday ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.04)",
                          border: isClaimed ? "1px solid rgba(34,197,94,0.3)" : isDoneToday ? "1px solid rgba(59,130,246,0.3)" : isToday ? "1px solid rgba(251,191,36,0.5)" : "1px solid rgba(255,255,255,0.07)",
                          transition:"all 0.15s",
                          transform: isToday ? "scale(1.05)" : "none",
                          boxShadow: isToday ? "0 4px 16px rgba(251,191,36,0.25)" : "none",
                        }}>
                        <div style={{ fontSize:18 }}>
                          {isClaimed ? "✅" : isDoneToday ? "✔️" : isToday ? t.icon : "🔒"}
                        </div>
                        <div style={{ fontSize:9, fontWeight:700, color: isClaimed ? "#4ade80" : isDoneToday ? "#60a5fa" : isToday ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                          Day {t.streakDay}
                        </div>
                        <div style={{ fontSize:10, fontWeight:800, color: isClaimed ? "#4ade80" : isDoneToday ? "#60a5fa" : isToday ? "#fbbf24" : "rgba(255,255,255,0.25)" }}>
                          +{t.coins}💰
                        </div>
                        {isToday && taskBusy === t.id && <div style={{ fontSize:9, color:"#60a5fa" }}>…</div>}
                        {isDoneToday && <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>Tomorrow</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:10, textAlign:"center" }}>
                  {currentStreak === 0 ? "Start your streak today! Log in daily to earn more coins." :
                   currentStreak >= 7 ? "🎉 Streak complete! Start again tomorrow." :
                   `Come back tomorrow for Day ${currentStreak + 1} · ${7 - currentStreak} day${7-currentStreak>1?"s":""} left`}
                </div>
              </div>
            );
          })()}

          {/* other tasks */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {tasks.filter(t => t.streakDay === undefined).map(task => {
              const taskCountdown = task.nextAvailableAt ? fmtCountdown(task.nextAvailableAt) : null;
              const btnLabel = taskBusy === task.id ? "…"
                : !task.canDo ? "Done"
                : task.action === "redirect" ? "Go →"
                : "Claim";
              return (
                <div key={task.id} className={`task-card ${!task.canDo ? "done" : ""}`}>
                  <div className="task-icon">{task.icon}</div>
                  <div className="task-body">
                    <div className="task-title">{task.title}</div>
                    <div className="task-desc">{task.desc}</div>
                    {!task.canDo && taskCountdown && (
                      <div className="task-next">⏰ Available in {taskCountdown}</div>
                    )}
                    {!task.canDo && !taskCountdown && task.cooldownHours === 0 && (
                      <div className="task-next" style={{ color:"#4ade80" }}>
                        {task.autoCompleted ? "✅ Already done" : "✅ Completed"}
                      </div>
                    )}
                    {task.canDo && task.action === "redirect" && (
                      <div className="task-next" style={{ color:"rgba(255,255,255,0.4)" }}>
                        Tap to go → then come back to claim
                      </div>
                    )}
                  </div>
                  <div className="task-earn">+{task.coins} 💰</div>
                  <button
                    className={`task-btn ${task.canDo ? "available" : "done"}`}
                    disabled={!task.canDo || taskBusy === task.id}
                    onClick={() => task.canDo && handleTask(task)}
                  >
                    {btnLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <div className="glass-card">
          <div className="section-title">📜 Transaction History</div>
          {txs.length === 0 ? (
            <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"32px 0" }}>
              No transactions yet
            </div>
          ) : txs.map((t,i) => (
            <div key={t._id || i} className="tx-row">
              <div className={`tx-icon ${t.type}`}>{TX_ICONS[t.category] || "💰"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="tx-desc">{t.description}</div>
                <div className="tx-date">{fmtDate(t.createdAt)} · {t.category}</div>
              </div>
              <div className={`tx-amt ${t.type}`}>
                {t.type==="credit" ? "+" : "-"}{t.amount} 💰
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
