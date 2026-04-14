import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
import VerifyBanner from "../components/VerifyBanner";
import { useVerification } from "../hooks/useVerification";

injectDashStyles();

import API from "../api.js";
const token   = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

function myUsername() {
  try { return JSON.parse(atob(token().split(".")[1])).username; } catch { return null; }
}
function myUniversity() {
  try { return JSON.parse(atob(token().split(".")[1])).university || ""; } catch { return null; }
}

function groupByUser(requests) {
  const map = new Map();
  for (const r of requests) {
    if (!map.has(r.ownerUsername)) map.set(r.ownerUsername, []);
    map.get(r.ownerUsername).push(r);
  }
  return Array.from(map.entries()).map(([username, reqs]) => ({
    username,
    university: reqs[0].ownerUniversity || "",
    requests: reqs,
    latest: reqs[0],
    hasOpen: reqs.some(r => r.status === "Open"),
    hasAccepted: reqs.some(r => r.status === "Accepted"),
  }));
}

function UserGroupCard({ group, me, myUni, onAccept, onDelete, onChat, onVisibility }) {
  const [expanded, setExpanded] = useState(group.requests.length === 1);
  const sameUni = myUni && group.university && group.university.toLowerCase() === myUni.toLowerCase();
  const isMyCard = group.username === me;
  const latest = group.latest;

  const borderColor = isMyCard ? "rgba(139,92,246,0.4)" : sameUni ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.07)";
  const bgColor = isMyCard ? "rgba(139,92,246,0.06)" : sameUni ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.04)";

  const visInfo = (v) => ({
    university: { icon:"🏫", label:"My University", color:"rgba(59,130,246,0.15)", border:"rgba(59,130,246,0.3)", text:"#60a5fa" },
    nearby:     { icon:"📍", label:"Nearby",        color:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.3)",  text:"#4ade80" },
    all:        { icon:"🌍", label:"Everyone",      color:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.3)", text:"#fbbf24" },
  }[v || "university"]);

  const cycleVis = (v) => v === "university" ? "nearby" : v === "nearby" ? "all" : "university";

  const RequestActions = ({ r }) => {
    const isOwner    = r.ownerUsername === me;
    const isAcceptor = r.acceptedBy === me;
    const vis        = visInfo(r.visibility);
    return (
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end", flexShrink:0, alignItems:"center" }}>
        {!isOwner && (
          <span style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:vis.color, border:`1px solid ${vis.border}`, color:vis.text }}>
            {vis.icon} {vis.label}
          </span>
        )}
        {r.status==="Open" && !isOwner && (
          <button className="btn btn-success" style={{ fontSize:12, padding:"6px 12px" }} onClick={() => onAccept(r)}>
            Accept{r.coins>0?` · 💰 ${r.coins}`:""}
          </button>
        )}
        {r.status==="Accepted" && (isOwner||isAcceptor) && (
          <button className="btn btn-primary" style={{ fontSize:12, padding:"6px 12px" }} onClick={() => onChat(r._id)}>💬 Chat</button>
        )}
        {isOwner && r.status==="Open" && (
          <button
            style={{ fontSize:11, padding:"5px 10px", borderRadius:8, border:`1px solid ${vis.border}`, background:vis.color, color:vis.text, cursor:"pointer", fontFamily:"Outfit,sans-serif", fontWeight:600 }}
            onClick={() => onVisibility(r._id, cycleVis(r.visibility))}
            title="Change who can see this request">
            {vis.icon} {vis.label}
          </button>
        )}
        {isOwner && (
          <button className="btn btn-danger" style={{ fontSize:12, padding:"6px 12px" }} onClick={() => onDelete(r._id)}>Delete</button>
        )}
      </div>
    );
  };

  return (
    <div style={{ background:bgColor, border:`1px solid ${borderColor}`, borderRadius:16, overflow:"hidden", position:"relative", transition:"all 0.2s" }}>
      {(sameUni || isMyCard) && (
        <div style={{ height:2, background: isMyCard ? "linear-gradient(90deg,#8b5cf6,#3b82f6)" : "linear-gradient(90deg,#3b82f6,#8b5cf6)" }} />
      )}
      <div style={{ padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}
        onClick={() => group.requests.length > 1 && setExpanded(e => !e)}>
        <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#fff", flexShrink:0 }}>
          {group.username[0].toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, fontSize:14 }}>@{group.username}</span>
            {isMyCard && <span className="badge badge-purple" style={{ fontSize:10 }}>You</span>}
            {sameUni && !isMyCard && <span className="badge badge-blue" style={{ fontSize:10 }}>🏫 Same Uni</span>}
            {group.university && <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{group.university}</span>}
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {latest.title}{group.requests.length > 1 && ` +${group.requests.length - 1} more`}
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          {group.hasOpen && <span className="badge badge-green" style={{ fontSize:10 }}>Open</span>}
          {group.hasAccepted && <span className="badge badge-yellow" style={{ fontSize:10 }}>Accepted</span>}
          {group.requests.length > 1 && (
            <span style={{ fontSize:18, color:"rgba(255,255,255,0.4)", transition:"transform 0.2s", display:"inline-block", transform: expanded ? "rotate(180deg)" : "none" }}>⌄</span>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          {group.requests.map((r, idx) => {
            const vis = visInfo(r.visibility);
            return (
              <div key={r._id} style={{ padding:"12px 16px", borderBottom: idx < group.requests.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none", background: idx===0 ? "rgba(255,255,255,0.03)" : "transparent", position:"relative" }}>
                {idx===0 && <div style={{ position:"absolute", left:0, top:"15%", bottom:"15%", width:2, borderRadius:"0 2px 2px 0", background:"linear-gradient(180deg,#3b82f6,#8b5cf6)" }} />}
                <div style={{ display:"flex", gap:8, alignItems:"flex-start", flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                      <span className="badge badge-blue" style={{ fontSize:11 }}>{r.type}</span>
                      <span className="badge badge-purple" style={{ fontSize:11 }}>{r.category}</span>
                      <span className={`badge ${r.status==="Open"?"badge-green":"badge-yellow"}`} style={{ fontSize:11 }}>{r.status}</span>
                      {r.coins > 0 && <span className="badge" style={{ background:"rgba(251,191,36,0.15)", color:"#fbbf24", fontSize:11 }}>💰 {r.coins}</span>}
                      {idx===0 && <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", alignSelf:"center" }}>Latest</span>}
                      <span style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:vis.color, border:`1px solid ${vis.border}`, color:vis.text }}>{vis.icon} {vis.label}</span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{r.title}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:4 }}>{r.description}</div>
                    {r.acceptedBy && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Accepted by @{r.acceptedBy}</div>}
                  </div>
                  <RequestActions r={r} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!expanded && group.requests.length === 1 && (
        <div style={{ padding:"0 16px 12px" }}>
          <RequestActions r={latest} />
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, count, color = "#60a5fa" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"20px 0 10px" }}>
      <div style={{ width:36, height:36, borderRadius:10, background:`${color}22`, border:`1px solid ${color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
      <div>
        <div style={{ fontSize:15, fontWeight:700 }}>{title}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>{count} user{count!==1?"s":""}</div>
      </div>
    </div>
  );
}

export default function Exchange() {
  const navigate = useNavigate();
  const me  = myUsername();
  const { idVerified, emailVerified, isVerified } = useVerification();

  const [feed,        setFeed]        = useState({ myUni:[], nearby:[], others:[], myUniversity:"" });
  const [showCreate,  setShowCreate]  = useState(false);
  const [acceptModal, setAcceptModal] = useState(null);
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [search,      setSearch]      = useState("");
  const [form,        setForm]        = useState({ title:"", type:"Sell", description:"", category:"books", coins:0 });
  const [loading,     setLoading]     = useState(false);
  const [accepting,   setAccepting]   = useState(false);
  const [msg,         setMsg]         = useState("");
  const [myOpenReq,   setMyOpenReq]   = useState(null);

  const fetchFeed = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/exchange/feed`, { headers: headers() });
      setFeed(data);
      const all = [...data.myUni, ...data.nearby, ...data.others];
      const mine = all.find(r => r.ownerUsername === me && r.status === "Open");
      setMyOpenReq(mine || null);
    } catch {}
  }, [me]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleCreate = async () => {
    if (!form.title || !form.description) return setMsg("Fill all fields.");
    setLoading(true);
    try {
      await axios.post(`${API}/exchange/create`, form, { headers: headers() });
      setShowCreate(false);
      setForm({ title:"", type:"Sell", description:"", category:"books", coins:0 });
      fetchFeed();
    } catch (e) { setMsg(e.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const handleAcceptConfirm = async () => {
    setAccepting(true);
    try {
      await axios.put(`${API}/exchange/accept/${acceptModal._id}`, {}, { headers: headers() });
      setAcceptModal(null); fetchFeed();
    } catch (e) { alert(e.response?.data?.message || "Error"); }
    finally { setAccepting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this request?")) return;
    try { await axios.delete(`${API}/exchange/${id}`, { headers: headers() }); fetchFeed(); }
    catch (e) { alert(e.response?.data?.message || "Error"); }
  };

  const handleVisibility = async (id, visibility) => {
    try {
      await axios.put(`${API}/exchange/${id}/visibility`, { visibility }, { headers: headers() });
      fetchFeed();
    } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  const applyFilter = (list) => list
    .filter(r => typeFilter === "All" || r.type === typeFilter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
                            r.description.toLowerCase().includes(search.toLowerCase()) ||
                            r.ownerUsername.toLowerCase().includes(search.toLowerCase()));

  const allRequests = [...feed.myUni, ...feed.nearby, ...feed.others];
  const myRequests  = allRequests.filter(r => r.ownerUsername === me);

  let sections = [];
  if (scopeFilter === "mine") {
    sections = [{ id:"mine", icon:"📋", title:"My Requests", color:"#a78bfa", items: applyFilter(myRequests) }];
  } else if (scopeFilter === "myuni") {
    sections = [{ id:"myuni", icon:"🏫", title: feed.myUniversity || "My University", color:"#60a5fa", items: applyFilter(feed.myUni.filter(r => r.ownerUsername !== me)) }];
  } else if (scopeFilter === "nearby") {
    sections = [{ id:"nearby", icon:"📍", title:"Nearby Universities", color:"#4ade80", items: applyFilter((feed.nearby||[]).filter(r => r.ownerUsername !== me)) }];
  } else if (scopeFilter === "outside") {
    sections = [{ id:"outside", icon:"🌍", title:"Outside / Other Universities", color:"#f59e0b", items: applyFilter((feed.others||[]).filter(r => r.ownerUsername !== me)) }];
  } else {
    const myUniF  = applyFilter(feed.myUni.filter(r => r.ownerUsername !== me));
    const nearbyF = applyFilter((feed.nearby||[]).filter(r => r.ownerUsername !== me));
    const othersF = applyFilter((feed.others||[]).filter(r => r.ownerUsername !== me));
    if (myUniF.length)  sections.push({ id:"myuni",  icon:"🏫", title: feed.myUniversity || "My University", color:"#60a5fa",              items: myUniF });
    if (nearbyF.length) sections.push({ id:"nearby", icon:"📍", title:"Nearby Universities",                 color:"#4ade80",              items: nearbyF });
    if (othersF.length) sections.push({ id:"others", icon:"🌍", title:"Other Universities",                  color:"rgba(255,255,255,0.4)", items: othersF });
    if (!sections.length) sections = [{ id:"all", icon:"📦", title:"All Requests", color:"rgba(255,255,255,0.4)", items: [] }];
  }

  const totalVisible = sections.reduce((a, s) => a + groupByUser(s.items).length, 0);

  return (
    <div className="dash-page">
      <div className="row-between page-header">
        <div>
          <h1 className="page-title">🔄 Exchange</h1>
          <p className="page-sub">{feed.myUniversity ? `Showing requests from ${feed.myUniversity} first` : "Buy, sell, lend and borrow with fellow students"}</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/student/my-requests")}>📋 My Requests</button>
          <button className="btn btn-primary"
            onClick={() => { if (!isVerified) return; if (myOpenReq) { alert("You already have an open request. Delete it first."); return; } setShowCreate(true); setMsg(""); }}
            disabled={!isVerified} style={{ opacity: isVerified ? 1 : 0.5 }}>
            + New Request
          </button>
        </div>
      </div>

      <VerifyBanner idVerified={idVerified} emailVerified={emailVerified} blockedActions={!isVerified ? ["Post Request", "Accept Request"] : []} />

      {myOpenReq && (
        <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#fbbf24" }}>You have an active open request</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2 }}>"{myOpenReq.title}" — delete it to post a new one.</div>
          </div>
          <button className="btn btn-danger" style={{ padding:"6px 12px", fontSize:12 }} onClick={() => handleDelete(myOpenReq._id)}>Delete</button>
        </div>
      )}

      {!feed.myUniversity && (
        <div style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:18 }}>🏫</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#60a5fa" }}>Add your university to see campus-specific requests first</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Go to Profile → Edit → Add University</div>
          </div>
          <button className="btn btn-ghost" style={{ padding:"6px 12px", fontSize:12 }} onClick={() => navigate("/student/profile")}>Update Profile</button>
        </div>
      )}

      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:12, padding:"0 12px", flex:1, minWidth:200 }}>
          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:14 }}>🔍</span>
          <input style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"Outfit,sans-serif", fontSize:13, color:"#fff", padding:"10px 0" }}
            placeholder="Search requests…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <span style={{ cursor:"pointer", color:"rgba(255,255,255,0.3)", fontSize:16 }} onClick={() => setSearch("")}>×</span>}
        </div>
      </div>

      <div className="chip-list" style={{ marginBottom:8 }}>
        <span className={`chip ${scopeFilter==="all"?"active":""}`} onClick={() => setScopeFilter("all")}>🌐 All</span>
        {feed.myUniversity && <span className={`chip ${scopeFilter==="myuni"?"active":""}`} onClick={() => setScopeFilter("myuni")}>🏫 My University</span>}
        {(feed.nearby||[]).length > 0 && <span className={`chip ${scopeFilter==="nearby"?"active":""}`} onClick={() => setScopeFilter("nearby")}>📍 Nearby</span>}
        <span className={`chip ${scopeFilter==="outside"?"active":""}`} onClick={() => setScopeFilter("outside")}>🌍 Outside</span>
        <span className={`chip ${scopeFilter==="mine"?"active":""}`} onClick={() => setScopeFilter("mine")}>👤 Mine</span>
      </div>

      <div className="chip-list" style={{ marginBottom:20 }}>
        {["All","Sell","Buy","Lend","Borrow"].map(c => (
          <span key={c} className={`chip ${typeFilter===c?"active":""}`} onClick={() => setTypeFilter(c)}>{c}</span>
        ))}
      </div>

      {totalVisible === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>{search ? `No results for "${search}"` : "No requests found."}</p>
          </div>
        </div>
      ) : (
        sections.map(sec => {
          const groups = groupByUser(sec.items);
          return groups.length > 0 && (
            <div key={sec.id}>
              {sections.length > 1 && <SectionHeader icon={sec.icon} title={sec.title} count={groups.length} color={sec.color} />}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {groups.map(group => (
                  <UserGroupCard
                    key={group.username}
                    group={group}
                    me={me}
                    myUni={feed.myUniversity}
                    onAccept={isVerified ? setAcceptModal : () => alert("ID verification required.")}
                    onDelete={handleDelete}
                    onChat={id => navigate(`/student/chat/${id}`)}
                    onVisibility={handleVisibility}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {acceptModal && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setAcceptModal(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">✅ Confirm Accept</div>
              <button className="modal-close" onClick={() => setAcceptModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>{acceptModal.title}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:14 }}>{acceptModal.description}</div>
              {acceptModal.ownerUniversity && (
                <div style={{ fontSize:12, color:"#60a5fa", marginBottom:12, padding:"6px 10px", background:"rgba(59,130,246,0.08)", borderRadius:8 }}>🏫 {acceptModal.ownerUniversity}</div>
              )}
              {acceptModal.coins > 0 ? (
                <div style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>Cost to accept</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#fbbf24" }}>💰 {acceptModal.coins} coins</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:4 }}>Deducted from your wallet</div>
                </div>
              ) : (
                <div style={{ fontSize:13, color:"#4ade80", padding:"8px 12px", background:"rgba(34,197,94,0.08)", borderRadius:8, marginBottom:14 }}>✅ Free to accept — no coins required</div>
              )}
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>After accepting, you'll get a private chat with @{acceptModal.ownerUsername}.</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setAcceptModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAcceptConfirm} disabled={accepting}>
                {accepting ? "Accepting…" : `Accept${acceptModal.coins>0?` · 💰 ${acceptModal.coins}`:""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && setShowCreate(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">✨ New Exchange Request</div>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              {msg && <div style={{ color:"#f87171", marginBottom:12, fontSize:13, padding:"8px 12px", background:"rgba(239,68,68,0.1)", borderRadius:8 }}>⚠️ {msg}</div>}
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="dash-input" placeholder="e.g. Selling Physics textbook"
                  value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="dash-select" value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                    {["Sell","Buy","Lend","Borrow"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="dash-select" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                    {["books","electronics","notes","clothes","other"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Coin Price 💰 <span style={{ color:"rgba(255,255,255,0.3)", fontWeight:400 }}>(0 = free)</span></label>
                <input className="dash-input" type="number" min="0" placeholder="0"
                  value={form.coins} onChange={e => setForm({...form, coins:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="dash-textarea" placeholder="Describe your item or request..."
                  style={{ minHeight:80 }}
                  value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
              </div>
              {feed.myUniversity && (
                <div style={{ fontSize:12, color:"#60a5fa", padding:"8px 12px", background:"rgba(59,130,246,0.08)", borderRadius:8, border:"1px solid rgba(59,130,246,0.15)" }}>
                  🏫 Will be posted under <strong>{feed.myUniversity}</strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                {loading ? "Posting…" : "Post Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
