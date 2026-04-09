import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";

injectDashStyles();

const CHAT_STYLE = "campus-chat-styles-v2";
if (!document.getElementById(CHAT_STYLE)) {
  const s = document.createElement("style");
  s.id = CHAT_STYLE;
  s.textContent = `
    .chat-shell {
      display: flex; flex-direction: column;
      flex: 1; min-height: 0; overflow: hidden;
      font-family: 'Outfit', sans-serif;
      /* take full viewport height minus header */
      height: calc(100vh - var(--hh, 58px));
      max-height: calc(100vh - var(--hh, 58px));
    }
    .chat-header { padding:10px 16px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
    .chat-header-row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .chat-title { font-size:15px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .chat-sub   { font-size:11px; color:rgba(255,255,255,0.38); margin-top:2px; }
    .chat-info-bar { display:flex; align-items:center; gap:7px; flex-wrap:wrap; padding:7px 16px; background:rgba(59,130,246,0.04); border-bottom:1px solid rgba(59,130,246,0.1); flex-shrink:0; }
    .info-chip { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); font-size:12px; font-weight:500; white-space:nowrap; }
    .info-chip a { color:#60a5fa; text-decoration:none; font-weight:600; }
    .info-chip a:hover { text-decoration:underline; }
    .info-chip.green  { border-color:rgba(34,197,94,0.3);  background:rgba(34,197,94,0.08);  color:#4ade80; cursor:pointer; }
    .info-chip.red    { border-color:rgba(239,68,68,0.3);  background:rgba(239,68,68,0.08);  color:#f87171; cursor:pointer; }
    .info-chip.yellow { border-color:rgba(251,191,36,0.3); background:rgba(251,191,36,0.08); color:#fbbf24; cursor:pointer; }
    .info-chip.live   { border-color:rgba(34,197,94,0.4);  background:rgba(34,197,94,0.1);   color:#4ade80; cursor:pointer; text-decoration:none; }
    .live-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; box-shadow:0 0 6px rgba(34,197,94,0.8); animation:pulse 1.5s ease infinite; flex-shrink:0; }
    .bargain-panel { padding:9px 16px; background:rgba(251,191,36,0.05); border-bottom:1px solid rgba(251,191,36,0.15); display:flex; align-items:center; gap:9px; flex-wrap:wrap; flex-shrink:0; }
    .bargain-input { width:110px; padding:7px 11px; background:rgba(255,255,255,0.07); border:1px solid rgba(251,191,36,0.3); border-radius:9px; color:#fff; font-family:'Outfit',sans-serif; font-size:13px; outline:none; }
    .bargain-input:focus { border-color:rgba(251,191,36,0.6); }
    .bargain-input::placeholder { color:rgba(255,255,255,0.3); }
    .bargain-card { align-self:flex-start; background:rgba(251,191,36,0.07); border:1px solid rgba(251,191,36,0.22); border-radius:14px; padding:13px 15px; max-width:290px; }
    .bargain-card.accepted { background:rgba(34,197,94,0.07); border-color:rgba(34,197,94,0.25); }
    .bargain-card.rejected { background:rgba(239,68,68,0.05); border-color:rgba(239,68,68,0.18); opacity:0.7; }
    .chat-messages { flex:1; min-height:0; overflow-y:auto; padding:12px 16px; display:flex; flex-direction:column; gap:4px; }
    .chat-messages::-webkit-scrollbar { width:3px; }
    .chat-messages::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:3px; }
    .chat-date-sep { text-align:center; font-size:11px; color:rgba(255,255,255,0.2); margin:8px 0 4px; }
    .typing-indicator { display:flex; gap:8px; align-items:flex-end; padding:2px 0; }
    .typing-bubble { background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.07); border-radius:14px; border-bottom-left-radius:4px; padding:10px 14px; display:flex; gap:4px; align-items:center; }
    .typing-dot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.4); animation:typingBounce 1.2s ease infinite; }
    .typing-dot:nth-child(2) { animation-delay:0.2s; }
    .typing-dot:nth-child(3) { animation-delay:0.4s; }
    @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
    .msg-row { display:flex; gap:8px; align-items:flex-end; margin-bottom:2px; }
    .msg-row.mine { flex-direction:row-reverse; }
    .msg-row.mine + .msg-row.mine .msg-avatar,
    .msg-row:not(.mine) + .msg-row:not(.mine) .msg-avatar { visibility:hidden; }
    .msg-avatar { width:28px; height:28px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#3b82f6,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:#fff; overflow:hidden; }
    .msg-avatar img { width:100%; height:100%; object-fit:cover; }
    .msg-col { display:flex; flex-direction:column; max-width:68%; }
    .msg-row.mine .msg-col { align-items:flex-end; }
    .msg-sender { font-size:10px; color:rgba(255,255,255,0.3); margin-bottom:2px; }
    .msg-bubble { padding:9px 13px; border-radius:16px; font-size:13.5px; line-height:1.55; word-break:break-word; }
    .msg-bubble.theirs { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.07); border-bottom-left-radius:4px; }
    .msg-bubble.mine   { background:linear-gradient(135deg,rgba(59,130,246,0.35),rgba(139,92,246,0.3)); border:1px solid rgba(59,130,246,0.3); border-bottom-right-radius:4px; }
    .msg-img { max-width:220px; max-height:220px; border-radius:12px; cursor:pointer; display:block; object-fit:cover; }
    .msg-time { font-size:10px; color:rgba(255,255,255,0.22); margin-top:3px; }
    .msg-row.mine .msg-time { text-align:right; }
    .img-preview-bar { padding:8px 16px; background:rgba(255,255,255,0.03); border-top:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; gap:10px; flex-shrink:0; }
    .img-preview-thumb { width:52px; height:52px; border-radius:8px; object-fit:cover; border:2px solid rgba(59,130,246,0.4); }
    .chat-input-bar { padding:10px 14px; border-top:1px solid rgba(255,255,255,0.07); display:flex; gap:8px; align-items:flex-end; flex-shrink:0; background:rgba(3,3,13,0.95); position:sticky; bottom:0; z-index:10; }
    .chat-attach-btn { width:38px; height:38px; border-radius:10px; flex-shrink:0; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09); cursor:pointer; color:rgba(255,255,255,0.5); font-size:18px; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
    .chat-attach-btn:hover { background:rgba(255,255,255,0.12); color:#fff; }
    .chat-textarea { flex:1; padding:9px 13px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09); border-radius:12px; font-family:'Outfit',sans-serif; font-size:14px; color:#fff; outline:none; resize:none; max-height:100px; transition:border-color 0.2s; line-height:1.5; }
    .chat-textarea:focus { border-color:rgba(59,130,246,0.45); }
    .chat-textarea::placeholder { color:rgba(255,255,255,0.25); }
    .chat-send-btn { width:38px; height:38px; border-radius:10px; flex-shrink:0; background:linear-gradient(135deg,#3b82f6,#8b5cf6); border:none; cursor:pointer; color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center; transition:transform 0.15s,opacity 0.15s; }
    .chat-send-btn:hover:not(:disabled) { transform:scale(1.08); }
    .chat-send-btn:disabled { opacity:0.35; cursor:not-allowed; }
    .cab { padding:6px 12px; border-radius:8px; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; }
    .chat-toast { position:fixed; top:68px; left:50%; transform:translateX(-50%); background:#111128; border:1px solid rgba(59,130,246,0.35); border-radius:10px; padding:9px 18px; font-size:13px; font-weight:600; color:#fff; z-index:9999; box-shadow:0 8px 28px rgba(0,0,0,0.5); white-space:nowrap; animation:fadeUpT 0.25s ease both; }
    @keyframes fadeUpT { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    .lightbox { position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:9999; display:flex; align-items:center; justify-content:center; cursor:zoom-out; }
    .lightbox img { max-width:90vw; max-height:90vh; border-radius:12px; object-fit:contain; }
    /* location blocker overlay */
    .loc-blocker {
      position:absolute; inset:0; z-index:200;
      background:rgba(3,3,13,0.92);
      backdrop-filter:blur(8px);
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      gap:16px; padding:32px; text-align:center;
    }
    .loc-blocker-icon { font-size:52px; }
    .loc-blocker-title { font-size:20px; font-weight:800; color:#fff; }
    .loc-blocker-sub { font-size:14px; color:rgba(255,255,255,0.5); line-height:1.6; max-width:320px; }
    .loc-timer { font-size:28px; font-weight:800; color:#ef4444; font-variant-numeric:tabular-nums; }
    .loc-allow-btn {
      padding:13px 28px; border-radius:13px;
      background:linear-gradient(135deg,#3b82f6,#8b5cf6);
      border:none; color:#fff; font-family:'Outfit',sans-serif;
      font-size:15px; font-weight:700; cursor:pointer;
      box-shadow:0 6px 24px rgba(59,130,246,0.4);
      transition:transform 0.15s;
    }
    .loc-allow-btn:hover { transform:translateY(-2px); }
    @media(max-width:768px) {
      .chat-input-bar { padding-bottom: 74px; }
    }
  `;
  document.head.appendChild(s);
}

import API from "../api.js";
const tok  = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

function myUsername() {
  try { return JSON.parse(atob(tok().split(".")[1])).username; } catch { return null; }
}
function fmtTime(d) { return new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); }
function fmtDate(d) {
  const dt = new Date(d), today = new Date(), yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (dt.toDateString() === today.toDateString())   return "Today";
  if (dt.toDateString() === yest.toDateString())    return "Yesterday";
  return dt.toLocaleDateString([], { day:"numeric", month:"short" });
}

function BargainCard({ bargain, isOwner, onAccept, onReject }) {
  const colors = { pending:"#fbbf24", accepted:"#4ade80", rejected:"#f87171" };
  const labels = { pending:"⏳ Pending owner response", accepted:"✅ Deal accepted", rejected:"❌ Offer rejected" };
  return (
    <div className={`bargain-card ${bargain.status}`}>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:5 }}>💰 Bargain from @{bargain.offeredBy}</div>
      <div style={{ fontSize:22, fontWeight:800, color:"#fbbf24", marginBottom:5 }}>💰 {bargain.coins} coins</div>
      <div style={{ fontSize:12, color:colors[bargain.status], marginBottom: bargain.status==="pending"&&isOwner?10:0 }}>{labels[bargain.status]}</div>
      {bargain.status === "pending" && isOwner && (
        <div style={{ display:"flex", gap:8 }}>
          <button className="cab" style={{ background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", color:"#4ade80" }} onClick={onAccept}>Accept</button>
          <button className="cab" style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171" }} onClick={onReject}>Reject</button>
        </div>
      )}
    </div>
  );
}

export default function ExchangeChat() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const me       = myUsername();

  const [request,      setRequest]      = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [avatars,      setAvatars]      = useState({});
  const [text,         setText]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [error,        setError]        = useState("");
  const [showBargain,  setShowBargain]  = useState(false);
  const [bargainCoins, setBargainCoins] = useState("");
  const [bargainBusy,  setBargainBusy]  = useState(false);
  const [sharing,      setSharing]      = useState(false);
  const [toast,        setToast]        = useState("");
  const [imgFile,      setImgFile]      = useState(null);
  const [lightbox,     setLightbox]     = useState(null);
  const [otherTyping,  setOtherTyping]  = useState(false);
  // location state
  const [myLoc,        setMyLoc]        = useState(null);   // { lat, lng, sharing }
  const [otherLoc,     setOtherLoc]     = useState(null);   // { lat, lng, sharing, updatedAt }
  const [locDenied,    setLocDenied]    = useState(false);  // permission denied
  const [countdown,    setCountdown]    = useState(10 * 60); // 10 min in seconds

  const bottomRef  = useRef();
  const socketRef  = useRef();
  const locRef     = useRef();
  const seenRef    = useRef(false);
  const fileRef    = useRef();
  const typingRef  = useRef();
  const countRef   = useRef();  // countdown interval
  const locStarted = useRef(false);

  const markSeen = useCallback(() => {
    axios.post(`${API}/chat/${id}/seen`, {}, { headers: hdrs() }).catch(() => {});
  }, [id]);

  /* initial load */
  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/chat/${id}`, { headers: hdrs() });
      setRequest(data.request);
      setMessages(data.messages);
      markSeen();
      /* set initial location state */
      const r = data.request;
      const isOwner = r.ownerUsername === myUsername();
      setMyLoc(isOwner ? r.ownerLocation : r.acceptorLocation);
      setOtherLoc(isOwner ? r.acceptorLocation : r.ownerLocation);
      /* fetch avatars */
      const users = [r.ownerUsername, r.acceptedBy].filter(Boolean);
      const avMap = {};
      await Promise.all(users.map(async (u) => {
        try {
          const res = await axios.get(`${API}/auth/user/${u}`, { headers: hdrs() });
          avMap[u] = res.data.avatar || null;
        } catch { avMap[u] = null; }
      }));
      setAvatars(avMap);
    } catch (e) { setError(e.response?.data?.message || "Could not load chat"); }
  }, [id, markSeen]);

  /* auto-start location sharing */
  const pushLocation = useCallback((pos) => {
    const { latitude: lat, longitude: lng } = pos.coords;
    setMyLoc({ lat, lng, sharing: true, updatedAt: new Date().toISOString() });
    axios.post(`${API}/exchange/${id}/location`,
      { lat, lng, sharing: true }, { headers: hdrs() }
    ).catch(() => {});
  }, [id]);

  const startAutoLocation = useCallback(() => {
    if (locStarted.current) return;
    if (!navigator.geolocation) { setLocDenied(true); return; }
    locStarted.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pushLocation(pos);
        setSharing(true);
        setLocDenied(false);
        clearInterval(countRef.current); // stop countdown
        setCountdown(0); // mark as resolved
        /* keep pushing every 30s */
        locRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(pushLocation, () => {});
        }, 30000);
      },
      () => {
        setLocDenied(true);
        /* start 10-min countdown */
        countRef.current = setInterval(() => {
          setCountdown(c => {
            if (c <= 1) { clearInterval(countRef.current); return 0; }
            return c - 1;
          });
        }, 1000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [pushLocation]);

  /* socket setup */
  useEffect(() => {
    load();
    const socket = io(API, { auth: { token: tok() }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join", id);
    socket.on("message", (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      markSeen();
    });
    socket.on("typing", ({ username, typing }) => {
      if (username !== myUsername()) setOtherTyping(typing);
    });
    socket.on("location_update", ({ field, location }) => {
      /* determine if this update is for me or the other person */
      setRequest(prev => {
        if (!prev) return prev;
        const isOwner = prev.ownerUsername === myUsername();
        const myField    = isOwner ? "ownerLocation"    : "acceptorLocation";
        const otherField = isOwner ? "acceptorLocation" : "ownerLocation";
        if (field === otherField) setOtherLoc(location);
        if (field === myField)    setMyLoc(location);
        return { ...prev, [field]: location };
      });
    });
    /* auto-start location after socket connects */
    startAutoLocation();
    return () => {
      socket.emit("leave", id);
      socket.disconnect();
      if (seenRef.current) markSeen();
      clearInterval(locRef.current);
      clearInterval(countRef.current);
      /* stop sharing on unmount */
      axios.post(`${API}/exchange/${id}/location`, { sharing: false }, { headers: hdrs() }).catch(() => {});
    };
  }, [id, load, markSeen, startAutoLocation]);

  useEffect(() => {
    seenRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  /* typing emit */
  const emitTyping = (val) => {
    clearTimeout(typingRef.current);
    socketRef.current?.emit("typing", { requestId: id, typing: true });
    typingRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", { requestId: id, typing: false });
    }, 1500);
    if (!val) socketRef.current?.emit("typing", { requestId: id, typing: false });
  };

  /* send text */
  const handleSend = async () => {
    if ((!text.trim() && !imgFile) || sending) return;
    setSending(true);
    socketRef.current?.emit("typing", { requestId: id, typing: false });
    try {
      if (imgFile) {
        await axios.post(`${API}/chat/${id}`, { type: "image", image: imgFile.dataUrl }, { headers: hdrs() });
        setImgFile(null);
      }
      if (text.trim()) {
        await axios.post(`${API}/chat/${id}`, { type: "text", text }, { headers: hdrs() });
        setText("");
      }
      markSeen();
    } catch (e) { alert(e.response?.data?.message || "Failed to send"); }
    finally { setSending(false); }
  };

  /* image pick */
  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Only images allowed");
    if (file.size > 5 * 1024 * 1024) return alert("Max 5MB");
    const reader = new FileReader();
    reader.onload = () => setImgFile({ dataUrl: reader.result, file });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* bargain */
  const handleSendBargain = async () => {
    const c = parseInt(bargainCoins);
    if (isNaN(c) || c < 0) return alert("Enter a valid coin amount");
    setBargainBusy(true);
    try {
      const { data } = await axios.post(`${API}/exchange/${id}/bargain`, { coins: c }, { headers: hdrs() });
      setRequest(data); setShowBargain(false); setBargainCoins("");
      showToast("💰 Bargain offer sent!");
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
    finally { setBargainBusy(false); }
  };

  const handleBargainResponse = async (action) => {
    try {
      const { data } = await axios.put(`${API}/exchange/${id}/bargain`, { action }, { headers: hdrs() });
      setRequest(data.request); showToast(data.message);
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  /* manual stop sharing */
  const stopSharing = () => {
    setSharing(false);
    clearInterval(locRef.current);
    locStarted.current = false;
    axios.post(`${API}/exchange/${id}/location`, { sharing: false }, { headers: hdrs() }).catch(() => {});
    showToast("📍 Location sharing stopped");
  };

  /* retry location after denial */
  const retryLocation = () => {
    locStarted.current = false;
    setLocDenied(false);
    setCountdown(10 * 60);
    clearInterval(countRef.current);
    startAutoLocation();
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  if (error) return (
    <div className="dash-page" style={{ textAlign:"center", paddingTop:60 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>{error}</div>
      <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );
  if (!request) return (
    <div className="dash-page" style={{ textAlign:"center", paddingTop:60 }}>
      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:14 }}>Loading chat…</div>
    </div>
  );

  const isOwner    = request.ownerUsername === me;
  const isAcceptor = request.acceptedBy === me;
  const otherUser  = isOwner ? request.acceptedBy : request.ownerUsername;
  const otherPhone = isOwner ? request.acceptorPhone : request.ownerPhone;
  const bargain    = request.bargain?.offeredBy ? request.bargain : null;
  const otherLocData = otherLoc;
  const hasOtherLoc  = otherLocData?.sharing && otherLocData?.lat;
  const chatBlocked  = locDenied && countdown > 0;

  const fmtCountdown = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  /* group by date */
  const grouped = [];
  let lastDate = null;
  for (const m of messages) {
    const lbl = fmtDate(m.createdAt);
    if (lbl !== lastDate) { grouped.push({ type:"sep", label:lbl }); lastDate = lbl; }
    grouped.push({ type:"msg", ...m });
  }

  const Avatar = ({ username }) => {
    const av = avatars[username];
    return (
      <div className="msg-avatar">
        {av ? <img src={av} alt={username} /> : username?.[0]?.toUpperCase()}
      </div>
    );
  };

  return (
    <div className="chat-shell">
      {toast && <div className="chat-toast">{toast}</div>}
      {lightbox && <div className="lightbox" onClick={() => setLightbox(null)}><img src={lightbox} alt="full" /></div>}

      {/* ── location blocker ── */}
      {chatBlocked && (
        <div className="loc-blocker">
          <div className="loc-blocker-icon">📍</div>
          <div className="loc-blocker-title">Location Required</div>
          <div className="loc-blocker-sub">
            Both users must share their live location to use this chat.<br />
            Please allow location access to continue.
          </div>
          <div className="loc-timer">{fmtCountdown(countdown)}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>
            Chat will be disabled when timer reaches 0:00
          </div>
          <button className="loc-allow-btn" onClick={retryLocation}>
            📍 Allow Location Access
          </button>
        </div>
      )}

      {/* ── disabled overlay when time runs out ── */}
      {locDenied && countdown === 0 && (
        <div className="loc-blocker">
          <div className="loc-blocker-icon">🔒</div>
          <div className="loc-blocker-title">Chat Disabled</div>
          <div className="loc-blocker-sub">
            Location sharing is required for this chat.<br />
            Enable location in your browser settings and try again.
          </div>
          <button className="loc-allow-btn" onClick={retryLocation}>
            🔄 Try Again
          </button>
        </div>
      )}

      {/* header */}
      <div className="chat-header">
        <div className="chat-header-row">
          <div style={{ display:"flex", gap:9, alignItems:"center", minWidth:0 }}>
            <button className="btn btn-ghost" style={{ padding:"5px 10px", fontSize:13, flexShrink:0 }} onClick={() => navigate(-1)}>←</button>
            <Avatar username={otherUser} />
            <div style={{ minWidth:0 }}>
              <div className="chat-title">@{otherUser}</div>
              <div className="chat-sub">{request.title} · {request.type}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
            {request.coins > 0 && <span className="badge" style={{ background:"rgba(251,191,36,0.12)", color:"#fbbf24", fontSize:11 }}>💰 {request.coins}</span>}
            <span className="badge badge-yellow" style={{ fontSize:11 }}>{request.status}</span>
          </div>
        </div>
      </div>

      {/* info bar */}
      <div className="chat-info-bar">
        {otherPhone ? (
          <>
            <div className="info-chip">📱 <a href={`tel:${otherPhone}`}>{otherPhone}</a></div>
            <div className="info-chip">💬 <a href={`https://wa.me/91${otherPhone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">WhatsApp</a></div>
          </>
        ) : <div className="info-chip" style={{ color:"rgba(255,255,255,0.3)" }}>No phone for @{otherUser}</div>}

        {/* other person's live location */}
        {hasOtherLoc ? (
          <a className="info-chip live"
            href={`https://www.google.com/maps?q=${otherLocData.lat},${otherLocData.lng}`}
            target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
            <span className="live-dot" />
            @{otherUser} · {fmtTime(otherLocData.updatedAt)}
          </a>
        ) : (
          <div className="info-chip" style={{ color:"rgba(255,255,255,0.28)" }}>
            📍 @{otherUser} not sharing yet
          </div>
        )}

        {/* my location status */}
        {sharing ? (
          <button className="info-chip red" style={{ border:"none" }} onClick={stopSharing}>
            🔴 Stop Sharing
          </button>
        ) : (
          <button className="info-chip green" style={{ border:"none" }} onClick={() => { locStarted.current = false; startAutoLocation(); }}>
            📍 Share My Location
          </button>
        )}

        {/* bargain — acceptor only */}
        {isAcceptor && (!bargain || bargain.status !== "pending") && (
          <button className="info-chip yellow" style={{ border:"none", marginLeft:"auto" }} onClick={() => setShowBargain(v=>!v)}>
            💰 {showBargain ? "Cancel" : "Bargain"}
          </button>
        )}
      </div>

      {/* bargain panel */}
      {showBargain && isAcceptor && (
        <div className="bargain-panel">
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Counter-offer:</span>
          <input className="bargain-input" type="number" min="0" placeholder={`${request.coins} 💰`}
            value={bargainCoins} onChange={e => setBargainCoins(e.target.value)}
            onKeyDown={e => e.key==="Enter" && handleSendBargain()} />
          <button className="cab" style={{ background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#fff" }}
            onClick={handleSendBargain} disabled={bargainBusy}>{bargainBusy?"…":"Send Offer"}</button>
        </div>
      )}

      {/* messages */}
      <div className="chat-messages">
        {bargain && <BargainCard bargain={bargain} isOwner={isOwner} onAccept={() => handleBargainResponse("accept")} onReject={() => handleBargainResponse("reject")} />}

        {messages.length === 0 && !bargain && (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.28)", fontSize:13, marginTop:48 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>👋</div>
            <div>Say hi to @{otherUser}!</div>
          </div>
        )}

        {grouped.map((item, i) =>
          item.type === "sep" ? (
            <div key={`sep-${i}`} className="chat-date-sep">— {item.label} —</div>
          ) : (
            <div key={item._id} className={`msg-row ${item.sender===me?"mine":""}`}>
              <Avatar username={item.sender} />
              <div className="msg-col">
                {item.sender !== me && <div className="msg-sender">@{item.sender}</div>}
                {item.type === "image" ? (
                  <img src={item.image} alt="shared" className="msg-img" onClick={() => setLightbox(item.image)} />
                ) : (
                  <div className={`msg-bubble ${item.sender===me?"mine":"theirs"}`}>{item.text}</div>
                )}
                <div className="msg-time">{fmtTime(item.createdAt)}</div>
              </div>
            </div>
          )
        )}

        {otherTyping && (
          <div className="typing-indicator">
            <Avatar username={otherUser} />
            <div className="typing-bubble">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* image preview bar */}
      {imgFile && (
        <div className="img-preview-bar">
          <img src={imgFile.dataUrl} className="img-preview-thumb" alt="preview" />
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.6)", flex:1 }}>Ready to send</span>
          <button className="cab" style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171" }}
            onClick={() => setImgFile(null)}>✕ Remove</button>
        </div>
      )}

      {/* input bar */}
      <div className="chat-input-bar">
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFilePick} />
        <button className="chat-attach-btn" onClick={() => fileRef.current.click()} title="Send photo">📎</button>
        <textarea className="chat-textarea" rows={1}
          placeholder={`Message @${otherUser}…`}
          value={text}
          onChange={e => { setText(e.target.value); emitTyping(e.target.value); }}
          onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={sending || (!text.trim() && !imgFile)}>➤</button>
      </div>
    </div>
  );
}
