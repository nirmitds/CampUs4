import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
import VerifyBanner from "../components/VerifyBanner";
import { useVerification } from "../hooks/useVerification";
injectDashStyles();

const SC = "campus-sc-v2";
if (!document.getElementById(SC)) {
  const s = document.createElement("style");
  s.id = SC;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
    .sc-root { display:flex; flex:1; min-height:0; overflow:hidden; background:#03030d; font-family:'Outfit',sans-serif; height:100%; max-height:100%; }

    /* ── LEFT PANEL ── */
    .sc-panel { width:340px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; background:rgba(8,8,20,0.8); min-height:0; overflow:hidden; }
    .sc-panel-head { padding:18px 20px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
    .sc-panel-title { font-size:18px; font-weight:800; letter-spacing:-0.3px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; }
    .sc-new-btn { width:32px; height:32px; border-radius:9px; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; font-size:18px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.15s; }
    .sc-new-btn:hover { background:rgba(59,130,246,0.25); }
    .sc-search-bar { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:0 12px; transition:border-color 0.2s; }
    .sc-search-bar:focus-within { border-color:rgba(59,130,246,0.4); }
    .sc-search-bar input { flex:1; background:none; border:none; outline:none; font-family:'Outfit',sans-serif; font-size:13px; color:#fff; padding:10px 0; }
    .sc-search-bar input::placeholder { color:rgba(255,255,255,0.28); }
    .sc-seg { display:flex; gap:2px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.06); flex-shrink:0; }
    .sc-seg-btn { flex:1; padding:7px 4px; border-radius:9px; border:none; font-family:'Outfit',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; background:transparent; color:rgba(255,255,255,0.38); }
    .sc-seg-btn.on { background:rgba(59,130,246,0.18); color:#60a5fa; }
    .sc-list { flex:1; overflow-y:auto; }
    .sc-list::-webkit-scrollbar { width:3px; }
    .sc-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:3px; }

    /* conv row */
    .sc-row { display:flex; gap:12px; align-items:center; padding:12px 16px; cursor:pointer; transition:background 0.12s; position:relative; }
    .sc-row:hover { background:rgba(255,255,255,0.04); }
    .sc-row:hover .sc-hide-btn { opacity:1 !important; }
    .sc-row.active { background:rgba(59,130,246,0.1); }
    .sc-row.active::before { content:''; position:absolute; left:0; top:15%; bottom:15%; width:3px; border-radius:0 3px 3px 0; background:linear-gradient(180deg,#3b82f6,#8b5cf6); }
    .sc-av { width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; color:#fff; overflow:hidden; flex-shrink:0; border:2px solid rgba(59,130,246,0.2); }
    .sc-av img { width:100%; height:100%; object-fit:cover; }
    .sc-av-sm { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:#fff; overflow:hidden; flex-shrink:0; }
    .sc-av-sm img { width:100%; height:100%; object-fit:cover; }
    .sc-row-body { flex:1; min-width:0; }
    .sc-row-name { font-size:14px; font-weight:700; color:#fff; }
    .sc-row-sub { font-size:12px; color:rgba(255,255,255,0.4); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:1px; }
    .sc-row-sub.bold { color:rgba(255,255,255,0.8); font-weight:600; }
    .sc-row-meta { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
    .sc-time { font-size:10px; color:rgba(255,255,255,0.28); }
    .sc-unread { min-width:18px; height:18px; border-radius:9px; background:linear-gradient(135deg,#3b82f6,#8b5cf6); color:#fff; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; padding:0 4px; }
    .sc-req-dot { width:8px; height:8px; border-radius:50%; background:#f59e0b; box-shadow:0 0 6px rgba(245,158,11,0.7); }

    /* ── RIGHT PANEL ── */
    .sc-chat { flex:1; min-width:0; max-width:100%; display:flex; flex-direction:column; min-height:0; overflow:hidden; position:relative; }
    .sc-chat-top { padding:12px 18px; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; gap:12px; flex-shrink:0; background:rgba(8,8,20,0.6); backdrop-filter:blur(20px); }
    .sc-chat-name { font-size:15px; font-weight:700; }
    .sc-chat-sub { font-size:11px; color:rgba(255,255,255,0.38); margin-top:1px; }

    /* request banner */
    .sc-req-banner { padding:14px 18px; background:rgba(245,158,11,0.08); border-bottom:1px solid rgba(245,158,11,0.2); flex-shrink:0; }
    .sc-req-banner-title { font-size:13px; font-weight:700; color:#fbbf24; margin-bottom:4px; }
    .sc-req-banner-sub { font-size:12px; color:rgba(255,255,255,0.5); margin-bottom:10px; }

    /* messages */
    .sc-msgs { flex:1; overflow-y:auto; overflow-x:hidden; padding:14px 18px; display:flex; flex-direction:column; gap:4px; min-height:0; }
    .sc-msgs::-webkit-scrollbar { width:3px; }
    .sc-msgs::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:3px; }
    .sc-date-sep { text-align:center; font-size:11px; color:rgba(255,255,255,0.2); margin:8px 0 4px; }
    .sc-msg-row { display:flex; gap:8px; align-items:flex-end; max-width:100%; }
    .sc-msg-row.mine { flex-direction:row-reverse; }
    .sc-bubble { max-width:66%; padding:9px 13px; border-radius:18px; font-size:13.5px; line-height:1.5; word-break:break-word; overflow-wrap:break-word; }
    .sc-bubble.theirs { background:rgba(255,255,255,0.09); border:1px solid rgba(255,255,255,0.07); border-bottom-left-radius:4px; }
    .sc-bubble.mine { background:linear-gradient(135deg,#3b82f6,#6366f1); border-bottom-right-radius:4px; }
    .sc-msg-img { max-width:220px; max-height:220px; border-radius:14px; cursor:pointer; display:block; object-fit:cover; }
    .sc-msg-time { font-size:10px; color:rgba(255,255,255,0.22); margin-top:3px; }
    .sc-msg-row.mine .sc-msg-time { text-align:right; }
    .sc-typing-row { display:flex; gap:8px; align-items:flex-end; }
    .sc-typing-bubble { background:rgba(255,255,255,0.09); border-radius:18px; border-bottom-left-radius:4px; padding:10px 14px; display:flex; gap:4px; }
    .sc-t-dot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.4); animation:tBounce 1.2s ease infinite; }
    .sc-t-dot:nth-child(2){animation-delay:0.2s} .sc-t-dot:nth-child(3){animation-delay:0.4s}
    @keyframes tBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}

    /* input */
    .sc-input-wrap { padding:10px 16px; border-top:1px solid rgba(255,255,255,0.07); display:flex; gap:8px; align-items:flex-end; flex-shrink:0; background:rgba(3,3,13,0.95); position:sticky; bottom:0; z-index:10; }
    .sc-textarea { flex:1; padding:10px 14px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09); border-radius:22px; font-family:'Outfit',sans-serif; font-size:14px; color:#fff; outline:none; resize:none; max-height:100px; transition:border-color 0.2s; line-height:1.5; }
    .sc-textarea:focus { border-color:rgba(59,130,246,0.45); }
    .sc-textarea::placeholder { color:rgba(255,255,255,0.25); }
    .sc-send { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#6366f1); border:none; cursor:pointer; color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center; transition:transform 0.15s,opacity 0.15s; flex-shrink:0; }
    .sc-send:hover:not(:disabled) { transform:scale(1.1); }
    .sc-send:disabled { opacity:0.35; cursor:not-allowed; }
    .sc-attach { width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09); cursor:pointer; color:rgba(255,255,255,0.5); font-size:17px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.15s; }
    .sc-attach:hover { background:rgba(255,255,255,0.12); color:#fff; }

    /* empty / placeholder */
    .sc-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; color:rgba(255,255,255,0.3); text-align:center; padding:40px; }
    .sc-empty-icon { font-size:56px; opacity:0.4; }

    /* new chat modal */
    .sc-modal { position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
    .sc-modal-box { background:#0d0d22; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:24px; width:100%; max-width:400px; }
    .sc-modal-title { font-size:16px; font-weight:700; margin-bottom:16px; }

    /* lightbox */
    .sc-lb { position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:9999; display:flex; align-items:center; justify-content:center; cursor:zoom-out; }
    .sc-lb img { max-width:90vw; max-height:90vh; border-radius:12px; }

    @media(max-width:640px) {
      .sc-root { height:100%; max-height:100%; }
      .sc-panel { width:100%; }
      .sc-chat { display:none; }
      .sc-root.open .sc-panel { display:none; }
      .sc-root.open .sc-chat { display:flex; }
      .sc-input-wrap { padding:10px 16px 14px; }
      .sc-msgs { padding-bottom: 8px; }
    }
  `;
  document.head.appendChild(s);
}

import API from "../api.js";
const tok = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });
function myName() { try { return JSON.parse(atob(tok().split(".")[1])).username; } catch { return null; } }
function fmtTime(d) { return new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); }
function fmtDate(d) {
  const dt=new Date(d),t=new Date(),y=new Date(t); y.setDate(t.getDate()-1);
  if(dt.toDateString()===t.toDateString()) return "Today";
  if(dt.toDateString()===y.toDateString()) return "Yesterday";
  return dt.toLocaleDateString([],{day:"numeric",month:"short"});
}
function ago(d) {
  if(!d) return ""; const diff=Date.now()-new Date(d).getTime(),m=Math.floor(diff/60000);
  if(m<1) return "now"; if(m<60) return `${m}m`; const h=Math.floor(m/60);
  if(h<24) return `${h}h`; return `${Math.floor(h/24)}d`;
}

function Av({ user, size=46 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.38, fontWeight:800, color:"#fff", overflow:"hidden", flexShrink:0, border:`2px solid rgba(59,130,246,0.2)` }}>
      {user?.avatar ? <img src={user.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : (user?.name||user?.username||"?")[0]?.toUpperCase()}
    </div>
  );
}

export default function SocialChat() {
  const navigate = useNavigate();
  const { username: routeUser } = useParams();
  const me = myName();
  const { idVerified, emailVerified, isVerified } = useVerification();

  const [seg,       setSeg]       = useState("chats"); // chats | requests | people
  const [convs,     setConvs]     = useState([]);
  const [nearby,    setNearby]    = useState([]);
  const [searchRes, setSearchRes] = useState([]);
  const [searchQ,   setSearchQ]   = useState("");
  const [active,    setActive]    = useState(routeUser || null);
  const [msgs,      setMsgs]      = useState([]);
  const [otherInfo, setOtherInfo] = useState(null);
  const [isReq,     setIsReq]     = useState(false); // is this a pending request?
  const [text,      setText]      = useState("");
  const [sending,   setSending]   = useState(false);
  const [typing,    setTyping]    = useState(false);
  const [lb,        setLb]        = useState(null);
  const [imgFile,   setImgFile]   = useState(null);
  const [showNew,   setShowNew]   = useState(false);
  const [newSearch, setNewSearch] = useState("");
  const [newRes,    setNewRes]    = useState([]);

  const socketRef = useRef();
  const bottomRef = useRef();
  const fileRef   = useRef();
  const typRef    = useRef();

  const loadConvs = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/dm/conversations`, { headers: hdrs() });
      setConvs(data);
    } catch {}
  }, []);

  const loadNearby = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/social/nearby`, { headers: hdrs() });
      setNearby(data);
    } catch {}
  }, []);

  const openChat = useCallback(async (username) => {
    setActive(username);
    try {
      const { data } = await axios.get(`${API}/dm/${username}`, { headers: hdrs() });
      setMsgs(data.messages);
      setOtherInfo(data.otherUser);
      setIsReq(data.conv?.isRequest && data.conv?.participants?.find(p=>p!==me) === username);
      loadConvs();
    } catch {}
  }, [me, loadConvs]);

  useEffect(() => {
    loadConvs(); loadNearby();
    if (routeUser) openChat(routeUser);

    const socket = io(API, { auth: { token: tok() }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("dm_message", ({ msg, other }) => {
      const partner = msg.sender === me ? other : msg.sender;
      if (partner === active || msg.sender === active) {
        setMsgs(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
      }
      loadConvs();
    });
    socket.on("dm_typing", ({ from, typing: t }) => { if (from === active) setTyping(t); });
    return () => socket.disconnect();
  }, []);

  useEffect(() => { if (active) openChat(active); }, [active]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, typing]);

  /* search for new chat */
  useEffect(() => {
    if (!newSearch.trim()) { setNewRes([]); return; }
    const t = setTimeout(async () => {
      try { const { data } = await axios.get(`${API}/social/search?q=${encodeURIComponent(newSearch)}`, { headers: hdrs() }); setNewRes(data); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [newSearch]);

  /* search in people tab */
  useEffect(() => {
    if (!searchQ.trim()) { setSearchRes([]); return; }
    const t = setTimeout(async () => {
      try { const { data } = await axios.get(`${API}/social/search?q=${encodeURIComponent(searchQ)}`, { headers: hdrs() }); setSearchRes(data); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const emitTyping = (val) => {
    clearTimeout(typRef.current);
    socketRef.current?.emit("dm_typing", { to: active, typing: true });
    typRef.current = setTimeout(() => socketRef.current?.emit("dm_typing", { to: active, typing: false }), 1500);
    if (!val) socketRef.current?.emit("dm_typing", { to: active, typing: false });
  };

  const handleSend = async () => {
    if ((!text.trim() && !imgFile) || sending) return;
    setSending(true);
    socketRef.current?.emit("dm_typing", { to: active, typing: false });
    try {
      if (imgFile) { await axios.post(`${API}/dm/${active}`, { type:"image", image:imgFile.dataUrl }, { headers: hdrs() }); setImgFile(null); }
      if (text.trim()) { await axios.post(`${API}/dm/${active}`, { type:"text", text }, { headers: hdrs() }); setText(""); }
      loadConvs();
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
    finally { setSending(false); }
  };

  const handleFilePick = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Images only");
    if (file.size > 5*1024*1024) return alert("Max 5MB");
    const reader = new FileReader();
    reader.onload = () => setImgFile({ dataUrl: reader.result });
    reader.readAsDataURL(file); e.target.value = "";
  };

  const acceptRequest = async () => {
    try { await axios.post(`${API}/dm/${active}/accept`, {}, { headers: hdrs() }); setIsReq(false); loadConvs(); } catch {}
  };
  const declineRequest = async () => {
    try { await axios.post(`${API}/dm/${active}/decline`, {}, { headers: hdrs() }); setActive(null); setMsgs([]); loadConvs(); } catch {}
  };

  /* split convs */
  const normalConvs  = convs.filter(c => !c.isRequest);
  const requestConvs = convs.filter(c => c.isRequest && convs.find(x=>x.other===c.other)?.other !== me);
  const myRequests   = convs.filter(c => c.isRequest);

  /* group messages */
  const grouped = [];
  let lastDate = null;
  for (const m of msgs) {
    const lbl = fmtDate(m.createdAt);
    if (lbl !== lastDate) { grouped.push({ type:"sep", label:lbl }); lastDate = lbl; }
    grouped.push({ type:"msg", ...m });
  }

  const listToShow = seg === "chats" ? normalConvs : seg === "requests" ? myRequests : (searchQ ? searchRes : nearby);

  return (
    <div className={`sc-root ${active ? "open" : ""}`}>
      {lb && <div className="sc-lb" onClick={() => setLb(null)}><img src={lb} alt="full" /></div>}

      {/* new chat modal */}
      {showNew && (
        <div className="sc-modal" onClick={e => e.target===e.currentTarget && setShowNew(false)}>
          <div className="sc-modal-box">
            <div className="sc-modal-title">✉️ New Message</div>
            <div className="sc-search-bar" style={{ marginBottom:12 }}>
              <span style={{ color:"rgba(255,255,255,0.3)", fontSize:14 }}>🔍</span>
              <input placeholder="Search people…" value={newSearch} onChange={e => setNewSearch(e.target.value)} autoFocus />
            </div>
            {newRes.map(u => (
              <div key={u._id} style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", cursor:"pointer" }}
                onClick={() => { setActive(u.username); setShowNew(false); setNewSearch(""); setSeg("chats"); }}>
                <Av user={u} size={38} />
                <div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{u.name}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>@{u.username}{u.university ? ` · ${u.university}` : ""}</div>
                </div>
              </div>
            ))}
            {newSearch && newRes.length === 0 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", textAlign:"center", padding:16 }}>No results</div>}
          </div>
        </div>
      )}

      {/* ── LEFT PANEL ── */}
      <div className="sc-panel">
        <div className="sc-panel-head">
          <div className="sc-panel-title">
            <span>Messages</span>
            <button className="sc-new-btn" onClick={() => { if (!isVerified) return; setShowNew(true); }} title="New message"
              style={{ opacity: isVerified ? 1 : 0.4, cursor: isVerified ? "pointer" : "not-allowed" }}>✏️</button>
          </div>
          {(seg === "people") && (
            <div className="sc-search-bar">
              <span style={{ color:"rgba(255,255,255,0.3)", fontSize:14 }}>🔍</span>
              <input placeholder="Search people…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              {searchQ && <span style={{ cursor:"pointer", color:"rgba(255,255,255,0.3)", fontSize:16 }} onClick={() => setSearchQ("")}>×</span>}
            </div>
          )}
        </div>

        {/* verification banner in panel */}
        {!isVerified && idVerified && (
          <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)", borderBottom:"1px solid rgba(239,68,68,0.2)", flexShrink:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#f87171", marginBottom:2 }}>
              {idVerified === "pending" ? "⏳ Verification Pending" : "🪪 ID Verification Required"}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>
              {idVerified === "pending" ? "Awaiting admin review." : "Upload your ID to chat with people."}
            </div>
          </div>
        )}

        {/* segments */}
        <div className="sc-seg">
          <button className={`sc-seg-btn ${seg==="chats"?"on":""}`} onClick={() => setSeg("chats")}>
            💬 Chats {normalConvs.length > 0 && `(${normalConvs.length})`}
          </button>
          <button className={`sc-seg-btn ${seg==="requests"?"on":""}`} onClick={() => setSeg("requests")}>
            📨 Requests {myRequests.length > 0 && <span style={{ marginLeft:4, background:"#f59e0b", color:"#000", borderRadius:8, padding:"1px 5px", fontSize:10, fontWeight:800 }}>{myRequests.length}</span>}
          </button>
          <button className={`sc-seg-btn ${seg==="people"?"on":""}`} onClick={() => setSeg("people")}>
            🌐 People
          </button>
        </div>

        <div className="sc-list">
          {/* CHATS */}
          {seg === "chats" && normalConvs.filter(c => c.other).map(c => (
            <div key={c.convId} className={`sc-row ${active===c.other?"active":""}`}
              style={{ position:"relative" }}
              onContextMenu={e => { e.preventDefault(); if(confirm(`Hide chat with @${c.other}?`)) { axios.put(`${API}/dm/${c.other}/hide`, {}, { headers:hdrs() }).then(() => loadConvs()).catch(()=>{}); } }}>
              <div style={{ flex:1, display:"flex", gap:12, alignItems:"center" }} onClick={() => setActive(c.other)}>
                <Av user={c.user} size={46} />
                <div className="sc-row-body">
                  <div className="sc-row-name">@{c.other}</div>
                  <div className={`sc-row-sub ${c.unread>0?"bold":""}`}>{c.lastMessage?.text || c.lastMessage || "Say hi!"}</div>
                </div>
                <div className="sc-row-meta">
                  <div className="sc-time">{ago(c.lastAt)}</div>
                  {c.unread > 0 && <div className="sc-unread">{c.unread}</div>}
                </div>
              </div>
              {/* hide button on hover */}
              <button
                style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:6, color:"#f87171", fontSize:11, padding:"3px 7px", cursor:"pointer", opacity:0, transition:"opacity 0.15s", fontFamily:"Outfit,sans-serif" }}
                className="sc-hide-btn"
                onClick={e => { e.stopPropagation(); if(confirm(`Hide chat with @${c.other}?`)) { axios.put(`${API}/dm/${c.other}/hide`, {}, { headers:hdrs() }).then(() => loadConvs()).catch(()=>{}); } }}>
                Hide
              </button>
            </div>
          ))}
          {seg === "chats" && normalConvs.length === 0 && (
            <div style={{ padding:32, textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>💬</div>
              No conversations yet.<br />
              <span style={{ color:"#60a5fa", cursor:"pointer" }} onClick={() => setShowNew(true)}>Start a new chat →</span>
            </div>
          )}

          {/* REQUESTS */}
          {seg === "requests" && myRequests.filter(c => c.other).map(c => (
            <div key={c.convId} className={`sc-row ${active===c.other?"active":""}`} onClick={() => setActive(c.other)}>
              <Av user={c.user} size={46} />
              <div className="sc-row-body">
                <div className="sc-row-name">@{c.other}</div>
                <div className="sc-row-sub">Wants to message you</div>
              </div>
              <div className="sc-row-meta">
                <div className="sc-req-dot" />
              </div>
            </div>
          ))}
          {seg === "requests" && myRequests.length === 0 && (
            <div style={{ padding:32, textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📨</div>
              No message requests
            </div>
          )}

          {/* PEOPLE */}
          {seg === "people" && (searchQ ? searchRes : nearby).map(u => (
            <div key={u._id} className="sc-row" onClick={() => navigate(`/student/user/${u.username}`)}>
              <Av user={u} size={46} />
              <div className="sc-row-body">
                <div className="sc-row-name">{u.name}</div>
                <div className="sc-row-sub">@{u.username}{u.university ? ` · ${u.university}` : ""}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); setActive(u.username); setSeg("chats"); }} style={{ padding:"5px 12px", borderRadius:9, border:"none", background:"rgba(59,130,246,0.15)", color:"#60a5fa", fontFamily:"Outfit,sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Message
              </button>
            </div>
          ))}
          {seg === "people" && !searchQ && nearby.length === 0 && (
            <div style={{ padding:32, textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📍</div>
              <div style={{ marginBottom:8 }}>No nearby students found.</div>
              <div style={{ fontSize:12, marginBottom:12 }}>Add your university in Profile to find students from your campus.</div>
              <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => navigate("/student/profile")}>
                Update Profile →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="sc-chat">
        {!active ? (
          <div className="sc-empty">
            <div className="sc-empty-icon">💬</div>
            <div style={{ fontSize:18, fontWeight:700, color:"rgba(255,255,255,0.5)" }}>Your Messages</div>
            <div style={{ fontSize:13 }}>Send a message to start a conversation</div>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>✏️ New Message</button>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="sc-chat-top">
              <button className="btn btn-ghost" style={{ padding:"5px 10px", fontSize:13 }} onClick={() => setActive(null)}>←</button>
              <Av user={otherInfo} size={36} />
              <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={() => navigate(`/student/user/${active}`)}>
                <div className="sc-chat-name">@{active}</div>
                {otherInfo?.university && <div className="sc-chat-sub">{otherInfo.university}</div>}
              </div>
              <button className="btn btn-ghost" style={{ padding:"5px 10px", fontSize:12 }} onClick={() => navigate(`/student/user/${active}`)}>
                👤
              </button>
            </div>

            {/* request banner */}
            {isReq && (
              <div className="sc-req-banner">
                <div className="sc-req-banner-title">📨 Message Request</div>
                <div className="sc-req-banner-sub">@{active} wants to message you. Accept to reply.</div>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn btn-primary" style={{ fontSize:13 }} onClick={acceptRequest}>✅ Accept</button>
                  <button className="btn btn-danger" style={{ fontSize:13 }} onClick={declineRequest}>❌ Decline</button>
                </div>
              </div>
            )}

            {/* messages */}
            <div className="sc-msgs">
              {msgs.length === 0 && (
                <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:13, marginTop:48 }}>
                  <div style={{ fontSize:40, marginBottom:8 }}>👋</div>
                  Say hi to @{active}!
                </div>
              )}
              {grouped.map((item, i) =>
                item.type === "sep" ? (
                  <div key={`sep-${i}`} className="sc-date-sep">— {item.label} —</div>
                ) : (
                  <div key={item._id} className={`sc-msg-row ${item.sender===me?"mine":""}`}>
                    {item.sender !== me && <Av user={otherInfo} size={26} />}
                    <div style={{ position:"relative" }} className="sc-msg-wrap"
                      onContextMenu={e => { e.preventDefault(); if (item.sender===me) { if(confirm("Delete this message?")) { axios.delete(`${API}/dm/message/${item._id}`, { headers:hdrs() }).then(() => setMsgs(prev => prev.filter(m => m._id !== item._id))).catch(()=>{}); } } }}
                      onTouchStart={e => { if (item.sender===me) { const t = setTimeout(() => { if(confirm("Delete this message?")) { axios.delete(`${API}/dm/message/${item._id}`, { headers:hdrs() }).then(() => setMsgs(prev => prev.filter(m => m._id !== item._id))).catch(()=>{}); } }, 600); e.currentTarget._lp = t; } }}
                      onTouchEnd={e => { clearTimeout(e.currentTarget._lp); }}>
                      {item.type === "image"
                        ? <img src={item.image} alt="img" className="sc-msg-img" onClick={() => setLb(item.image)} />
                        : <div className={`sc-bubble ${item.sender===me?"mine":"theirs"}`}>{item.text}</div>
                      }
                      <div className={`sc-msg-time ${item.sender===me?"mine":""}`}>{fmtTime(item.createdAt)}</div>
                    </div>
                  </div>
                )
              )}
              {typing && (
                <div className="sc-typing-row">
                  <Av user={otherInfo} size={26} />
                  <div className="sc-typing-bubble"><div className="sc-t-dot"/><div className="sc-t-dot"/><div className="sc-t-dot"/></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* image preview */}
            {imgFile && (
              <div style={{ padding:"8px 16px", background:"rgba(255,255,255,0.03)", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:10 }}>
                <img src={imgFile.dataUrl} style={{ width:48, height:48, borderRadius:8, objectFit:"cover", border:"2px solid rgba(59,130,246,0.4)" }} alt="preview" />
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", flex:1 }}>Ready to send</span>
                <button onClick={() => setImgFile(null)} style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171", borderRadius:7, padding:"4px 10px", fontFamily:"Outfit,sans-serif", fontSize:12, cursor:"pointer" }}>✕</button>
              </div>
            )}

            {/* input — disabled if request not accepted */}
            <div className="sc-input-wrap">
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFilePick} />
              {!isReq && <button className="sc-attach" onClick={() => fileRef.current.click()}>📎</button>}
              <textarea className="sc-textarea" rows={1}
                value={text} disabled={isReq || !isVerified}
                onChange={e => { setText(e.target.value); emitTyping(e.target.value); }}
                onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={!isVerified ? "Verify your ID to send messages…" : isReq ? "Accept the request to reply…" : `Message @${active}…`}
              />
              <button className="sc-send" onClick={handleSend} disabled={sending||isReq||(!text.trim()&&!imgFile)||!isVerified}>➤</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
