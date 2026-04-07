import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";

injectDashStyles();

const MSG_STYLE = "campus-messages-page";
if (!document.getElementById(MSG_STYLE)) {
  const s = document.createElement("style");
  s.id = MSG_STYLE;
  s.textContent = `
    .msg-page { padding: 0; display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .msg-hero {
      padding: 28px 28px 20px;
      background: linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
    }
    .msg-hero-title {
      font-size: 26px; font-weight: 800; letter-spacing: -0.5px;
      background: linear-gradient(135deg, #fff 40%, #a78bfa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .msg-hero-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 4px; }
    .msg-search-wrap {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 14px; padding: 0 14px;
      margin-top: 16px; transition: border-color 0.2s;
    }
    .msg-search-wrap:focus-within { border-color: rgba(59,130,246,0.5); }
    .msg-search-wrap input {
      flex: 1; background: none; border: none; outline: none;
      font-family: 'Outfit', sans-serif; font-size: 14px; color: #fff;
      padding: 11px 0;
    }
    .msg-search-wrap input::placeholder { color: rgba(255,255,255,0.28); }
    .msg-list { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .msg-list::-webkit-scrollbar { width: 3px; }
    .msg-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 3px; }
    .msg-card {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; border-radius: 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      cursor: pointer; transition: all 0.2s;
      position: relative; overflow: hidden;
    }
    .msg-card::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04));
      opacity: 0; transition: opacity 0.2s;
    }
    .msg-card:hover { border-color: rgba(59,130,246,0.3); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .msg-card:hover::before { opacity: 1; }
    .msg-card.unread { border-color: rgba(59,130,246,0.25); background: rgba(59,130,246,0.06); }
    .msg-card.unread::after {
      content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
      width: 3px; border-radius: 0 3px 3px 0;
      background: linear-gradient(180deg, #3b82f6, #8b5cf6);
    }
    .msg-avatar-wrap { position: relative; flex-shrink: 0; }
    .msg-av {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 800; color: #fff;
      overflow: hidden; border: 2px solid rgba(59,130,246,0.3);
    }
    .msg-av img { width: 100%; height: 100%; object-fit: cover; }
    .msg-online-dot {
      position: absolute; bottom: 1px; right: 1px;
      width: 12px; height: 12px; border-radius: 50%;
      background: #22c55e; border: 2px solid #03030d;
      box-shadow: 0 0 6px rgba(34,197,94,0.7);
    }
    .msg-body { flex: 1; min-width: 0; }
    .msg-name-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px; }
    .msg-name { font-size: 14px; font-weight: 700; color: #fff; }
    .msg-time { font-size: 11px; color: rgba(255,255,255,0.3); flex-shrink: 0; }
    .msg-preview-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .msg-preview { font-size: 13px; color: rgba(255,255,255,0.45); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .msg-preview.unread-text { color: rgba(255,255,255,0.75); font-weight: 500; }
    .msg-badge {
      min-width: 20px; height: 20px; border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: #fff; font-size: 11px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      padding: 0 5px; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(59,130,246,0.5);
      animation: badgePop 0.3s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes badgePop { from{transform:scale(0)} to{transform:scale(1)} }
    .msg-topic { font-size: 11px; color: rgba(255,255,255,0.28); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .msg-empty {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 12px; color: rgba(255,255,255,0.3); text-align: center;
      padding: 48px 24px;
    }
    .msg-empty-icon { font-size: 56px; opacity: 0.5; }
    .msg-stats-row {
      display: flex; gap: 12px; padding: 0 28px 16px;
      flex-shrink: 0;
    }
    .msg-stat {
      flex: 1; padding: 12px 16px; border-radius: 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      text-align: center;
    }
    .msg-stat-val { font-size: 22px; font-weight: 800; }
    .msg-stat-label { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }
    .msg-filter-row {
      display: flex; gap: 6px; padding: 0 16px 8px;
      flex-shrink: 0; flex-wrap: wrap;
    }
    .msg-filter-chip {
      padding: 5px 13px; border-radius: 20px; font-size: 12px; font-weight: 600;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
      color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s;
    }
    .msg-filter-chip.active {
      background: rgba(59,130,246,0.2); border-color: rgba(59,130,246,0.4); color: #60a5fa;
    }
  `;
  document.head.appendChild(s);
}

import API from "../api.js";
const tok = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function Messages() {
  const navigate = useNavigate();
  const [chats,    setChats]    = useState([]);
  const [avatars,  setAvatars]  = useState({});
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all"); // all | unread
  const [loading,  setLoading]  = useState(true);
  const socketRef = useRef();

  const loadSummary = async () => {
    try {
      const { data } = await axios.get(`${API}/chat/summary`, { headers: hdrs() });
      setChats(data.chats || []);
      /* fetch avatars for all other users */
      const users = [...new Set((data.chats || []).map(c => c.otherUser))];
      const avMap = { ...avatars };
      await Promise.all(users.filter(u => !(u in avMap)).map(async (u) => {
        try {
          const r = await axios.get(`${API}/auth/user/${u}`, { headers: hdrs() });
          avMap[u] = r.data.avatar || null;
        } catch { avMap[u] = null; }
      }));
      setAvatars(avMap);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadSummary();
    const socket = io(API, { auth: { token: tok() }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("summary_update", (data) => {
      setChats(data.chats || []);
    });
    return () => socket.disconnect();
  }, []);

  const filtered = chats
    .filter(c => filter === "unread" ? c.unread > 0 : true)
    .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
                            c.otherUser.toLowerCase().includes(search.toLowerCase()));

  const totalUnread = chats.reduce((a, c) => a + c.unread, 0);

  return (
    <div className="msg-page">
      {/* hero */}
      <div className="msg-hero">
        <div className="msg-hero-title">💬 Messages</div>
        <div className="msg-hero-sub">
          {totalUnread > 0
            ? `${totalUnread} unread message${totalUnread > 1 ? "s" : ""} across ${chats.length} chat${chats.length !== 1 ? "s" : ""}`
            : `${chats.length} active chat${chats.length !== 1 ? "s" : ""}`}
        </div>
        <div className="msg-search-wrap">
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>🔍</span>
          <input
            placeholder="Search chats or people…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <span style={{ cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 18 }}
              onClick={() => setSearch("")}>×</span>
          )}
        </div>
      </div>

      {/* stats */}
      {chats.length > 0 && (
        <div className="msg-stats-row" style={{ paddingTop: 16 }}>
          <div className="msg-stat">
            <div className="msg-stat-val" style={{ color: "#60a5fa" }}>{chats.length}</div>
            <div className="msg-stat-label">Active Chats</div>
          </div>
          <div className="msg-stat">
            <div className="msg-stat-val" style={{ color: totalUnread > 0 ? "#f87171" : "#4ade80" }}>
              {totalUnread}
            </div>
            <div className="msg-stat-label">Unread</div>
          </div>
          <div className="msg-stat">
            <div className="msg-stat-val" style={{ color: "#a78bfa" }}>
              {chats.filter(c => c.lastMessage).length}
            </div>
            <div className="msg-stat-label">With Messages</div>
          </div>
        </div>
      )}

      {/* filter chips */}
      <div className="msg-filter-row">
        {[["all", "All Chats"], ["unread", `Unread (${totalUnread})`]].map(([key, label]) => (
          <span key={key} className={`msg-filter-chip ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}>{label}</span>
        ))}
      </div>

      {/* list */}
      <div className="msg-list">
        {loading && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 40 }}>
            Loading chats…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="msg-empty">
            <div className="msg-empty-icon">💬</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
              {search ? "No chats match your search" : filter === "unread" ? "No unread messages" : "No active chats yet"}
            </div>
            <div style={{ fontSize: 13 }}>
              {!search && filter === "all" && "Accept an exchange request to start chatting with other students"}
            </div>
            {!search && filter === "all" && (
              <button className="btn btn-primary" style={{ marginTop: 8 }}
                onClick={() => navigate("/student/exchange")}>
                Browse Exchange →
              </button>
            )}
          </div>
        )}

        {filtered.map((c, i) => {
          const av = avatars[c.otherUser];
          const hasUnread = c.unread > 0;
          const lastMsg = c.lastMessage;
          const preview = lastMsg
            ? `${lastMsg.sender === c.otherUser ? "" : "You: "}${lastMsg.text || "📷 Photo"}`
            : "No messages yet — say hi!";

          return (
            <div
              key={c.requestId}
              className={`msg-card ${hasUnread ? "unread" : ""}`}
              onClick={() => navigate(`/student/chat/${c.requestId}`)}
              style={{ animationDelay: `${i * 0.04}s`, animation: "pageIn 0.3s ease both" }}
            >
              <div className="msg-avatar-wrap">
                <div className="msg-av" onClick={e => { e.stopPropagation(); navigate(`/student/user/${c.otherUser}`); }}>
                  {av ? <img src={av} alt={c.otherUser} /> : c.otherUser?.[0]?.toUpperCase()}
                </div>
              </div>

              <div className="msg-body">
                <div className="msg-name-row">
                  <div className="msg-name">@{c.otherUser}</div>
                  <div className="msg-time">{timeAgo(c.lastAt)}</div>
                </div>
                <div className="msg-preview-row">
                  <div className={`msg-preview ${hasUnread ? "unread-text" : ""}`}>{preview}</div>
                  {hasUnread && (
                    <div className="msg-badge">{c.unread > 99 ? "99+" : c.unread}</div>
                  )}
                </div>
                <div className="msg-topic">{c.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
