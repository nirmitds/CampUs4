import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
injectDashStyles();

const API   = "http://localhost:5000";
const MAX_MB = 5;

/* ── inject menu + profile styles ── */
const PROF_STYLE = "campus-profile-v2";
if (!document.getElementById(PROF_STYLE)) {
  const s = document.createElement("style");
  s.id = PROF_STYLE;
  s.textContent = `
    .prof-menu-btn { width:100%; padding:11px 16px; text-align:left; background:none; border:none; color:rgba(255,255,255,0.75); font-family:Outfit,sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:background 0.15s,color 0.15s; display:block; }
    .prof-menu-btn:hover { background:rgba(255,255,255,0.07); color:#fff; }
    .prof-menu-btn.danger:hover { background:rgba(239,68,68,0.12); color:#f87171; }
    .prof-field { display:flex; align-items:flex-start; gap:14px; padding:12px 16px; background:rgba(255,255,255,0.04); border-radius:11px; border:1px solid rgba(255,255,255,0.07); }
    .prof-field-icon { font-size:18px; margin-top:2px; flex-shrink:0; }
    .prof-field-body { flex:1; min-width:0; }
    .prof-field-label { font-size:11px; color:rgba(255,255,255,0.35); margin-bottom:2px; }
    .prof-field-val { font-size:14px; font-weight:600; word-break:break-word; }
    .prof-field-empty { font-size:13px; color:rgba(255,255,255,0.25); font-style:italic; }
    .prof-edit-input {
      width:100%; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
      border-radius:9px; padding:9px 12px; color:#fff; font-family:Outfit,sans-serif;
      font-size:13px; outline:none; transition:border-color 0.2s; box-sizing:border-box;
    }
    .prof-edit-input:focus { border-color:rgba(59,130,246,0.5); }
    .prof-edit-input::placeholder { color:rgba(255,255,255,0.25); }
    .prof-section-title { font-size:12px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; color:rgba(255,255,255,0.3); margin:20px 0 10px; }
    .prof-complete-bar { height:6px; border-radius:3px; background:rgba(255,255,255,0.08); overflow:hidden; margin-bottom:4px; }
    .prof-complete-fill { height:100%; border-radius:3px; transition:width 0.5s ease; background:linear-gradient(90deg,#3b82f6,#8b5cf6); }
  `;
  document.head.appendChild(s);
}

/* ── crop helpers ── */
function createImage(url) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.addEventListener("load", () => res(img));
    img.addEventListener("error", rej);
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}
async function getCroppedBlob(src, crop) {
  const image = await createImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width; canvas.height = crop.height;
  canvas.getContext("2d").drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise(res => canvas.toBlob(res, "image/jpeg", 0.92));
}

function CropModal({ src, onDone, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState(null);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#0f0f23", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:24, width:"100%", maxWidth:440, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:16, fontWeight:700 }}>✂️ Crop Photo</div>
        <div style={{ position:"relative", width:"100%", height:280, borderRadius:12, overflow:"hidden", background:"#000" }}>
          <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
            onCropChange={setCrop} onZoomChange={setZoom}
            onCropComplete={useCallback((_, p) => setPixels(p), [])} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>Zoom</span>
          <input type="range" min={1} max={3} step={0.05} value={zoom}
            onChange={e => setZoom(Number(e.target.value))} style={{ flex:1, accentColor:"#3b82f6" }} />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"11px 0", borderRadius:11, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={async () => { if (pixels) onDone(await getCroppedBlob(src, pixels)); }} style={{ flex:1, padding:"11px 0", borderRadius:11, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", border:"none", color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:14, fontWeight:700, cursor:"pointer" }}>Save Photo</button>
        </div>
      </div>
    </div>
  );
}

/* ── completion % ── */
function calcCompletion(user) {
  const fields = ["name","email","phone","avatar","university","rollNo","course","branch","year","semester","bio"];
  const filled = fields.filter(f => user[f] && user[f] !== "").length;
  return Math.round((filled / fields.length) * 100);
}

export default function StudentProfile() {
  const [user,      setUser]      = useState(null);
  const [avatar,    setAvatar]    = useState(null);
  const [editing,   setEditing]   = useState(false);
  const [form,      setForm]      = useState({});
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [msg,       setMsg]       = useState("");
  const [msgType,   setMsgType]   = useState("");
  const [cropSrc,   setCropSrc]   = useState(null);
  const [showMenu,  setShowMenu]  = useState(false);
  const fileRef = useRef();
  const menuRef = useRef();

  const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => {
    axios.get(`${API}/auth/me`, { headers: authHdr() })
      .then(r => { setUser(r.data.user); setAvatar(r.data.user.avatar || null); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const startEdit = () => {
    setForm({
      name: user.name || "", phone: user.phone || "",
      university: user.university || "", rollNo: user.rollNo || "",
      course: user.course || "", branch: user.branch || "",
      year: user.year || "", semester: user.semester || "",
      bio: user.bio || "",
    });
    setEditing(true); setMsg("");
  };

  const handleSave = async () => {
    setSaving(true); setMsg("");
    try {
      const { data } = await axios.put(`${API}/auth/profile`, form, { headers: authHdr() });
      setUser(data.user); setEditing(false);
      setMsg("Profile updated!"); setMsgType("ok");
    } catch (e) {
      setMsg(e.response?.data?.message || "Save failed."); setMsgType("err");
    } finally { setSaving(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg("Only images allowed."); setMsgType("err"); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setMsg(`Max ${MAX_MB}MB.`); setMsgType("err"); return; }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = ""; setShowMenu(false);
  };

  const handleCropDone = async (blob) => {
    setCropSrc(null); setMsg(""); setUploading(true);
    const form = new FormData(); form.append("avatar", blob, "avatar.jpg");
    try {
      const { data } = await axios.post(`${API}/auth/upload-avatar`, form,
        { headers: { ...authHdr(), "Content-Type": "multipart/form-data" } });
      setAvatar(data.avatar); setMsg("Photo updated!"); setMsgType("ok");
    } catch (e) { setMsg(e.response?.data?.message || "Upload failed."); setMsgType("err"); }
    finally { setUploading(false); }
  };

  const handleDeleteAvatar = async () => {
    setShowMenu(false);
    if (!window.confirm("Remove profile photo?")) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/auth/avatar`, { headers: authHdr() });
      setAvatar(null); setMsg("Photo removed."); setMsgType("ok");
    } catch (e) { setMsg(e.response?.data?.message || "Failed."); setMsgType("err"); }
    finally { setDeleting(false); }
  };

  const busy = uploading || deleting;
  const completion = user ? calcCompletion({ ...user, avatar }) : 0;

  const Field = ({ icon, label, value, empty = "Not set" }) => (
    <div className="prof-field">
      <span className="prof-field-icon">{icon}</span>
      <div className="prof-field-body">
        <div className="prof-field-label">{label}</div>
        {value ? <div className="prof-field-val">{value}</div>
                : <div className="prof-field-empty">{empty}</div>}
      </div>
    </div>
  );

  const EditField = ({ label, field, placeholder, type = "text" }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === "textarea"
        ? <textarea className="prof-edit-input dash-textarea" rows={3} placeholder={placeholder}
            value={form[field] || ""} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
        : <input className="prof-edit-input" type={type} placeholder={placeholder}
            value={form[field] || ""} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
      }
    </div>
  );

  return (
    <div className="dash-page">
      {cropSrc && <CropModal src={cropSrc} onDone={handleCropDone} onCancel={() => setCropSrc(null)} />}

      <div className="row-between page-header">
        <div>
          <h1 className="page-title">👤 Profile</h1>
          <p className="page-sub">Your campus identity</p>
        </div>
        {!editing && user && (
          <button className="btn btn-primary" onClick={startEdit}>✏️ Edit Profile</button>
        )}
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* completion bar */}
        {user && (
          <div className="glass-card" style={{ marginBottom: 16, padding: "14px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
              <span style={{ fontWeight:600 }}>Profile Completion</span>
              <span style={{ color: completion === 100 ? "#4ade80" : "#fbbf24", fontWeight:700 }}>{completion}%</span>
            </div>
            <div className="prof-complete-bar">
              <div className="prof-complete-fill" style={{ width: `${completion}%` }} />
            </div>
            {completion < 100 && (
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:6 }}>
                Complete your profile to earn the <strong style={{ color:"#fbbf24" }}>+20 🪙 bonus</strong>
              </div>
            )}
          </div>
        )}

        <div className="glass-card">
          {/* avatar row */}
          <div style={{ display:"flex", gap:20, alignItems:"center", marginBottom:16 }}>
            <div style={{ position:"relative", flexShrink:0 }} ref={menuRef}>
              <div style={{ width:88, height:88, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, fontWeight:800, overflow:"hidden", border:"3px solid rgba(59,130,246,0.4)", boxShadow:"0 0 24px rgba(59,130,246,0.3)" }}>
                {avatar ? <img src={avatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <button onClick={() => !busy && setShowMenu(m => !m)} disabled={busy}
                style={{ position:"absolute", bottom:0, right:0, width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", border:"2px solid #05050f", display:"flex", alignItems:"center", justifyContent:"center", cursor:busy?"not-allowed":"pointer", fontSize:13, opacity:busy?0.5:1 }}>
                {busy ? "⏳" : "✏️"}
              </button>
              {showMenu && (
                <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, background:"#111128", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, overflow:"hidden", zIndex:100, minWidth:170, boxShadow:"0 12px 40px rgba(0,0,0,0.6)" }}>
                  <button className="prof-menu-btn" onClick={() => { fileRef.current.click(); setShowMenu(false); }}>
                    📷 {avatar ? "Change Photo" : "Upload Photo"}
                  </button>
                  {avatar && <button className="prof-menu-btn" onClick={() => { setCropSrc(avatar); setShowMenu(false); }}>✂️ Crop / Edit</button>}
                  {avatar && <button className="prof-menu-btn danger" onClick={handleDeleteAvatar}>🗑️ Remove Photo</button>}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFileChange} />
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:800 }}>{user?.name ?? "Loading…"}</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.4)" }}>@{user?.username}</div>
              <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                <span className="badge badge-blue">{user?.role}</span>
                {user?.university && <span className="badge badge-purple">{user.university}</span>}
                {user?.course && <span className="badge badge-green">{user.course}</span>}
              </div>
            </div>
          </div>

          <div style={{ fontSize:12, color:"rgba(255,255,255,0.22)", marginBottom:18 }}>
            Click ✏️ to change photo · Max {MAX_MB}MB
          </div>

          {/* status message */}
          {msg && (
            <div style={{ padding:"9px 14px", borderRadius:10, marginBottom:16, fontSize:13, fontWeight:500,
              background: msgType==="ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border:     msgType==="ok" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
              color:      msgType==="ok" ? "#86efac" : "#fca5a5",
            }}>
              {msgType==="ok" ? "✅" : "⚠️"} {msg}
            </div>
          )}

          {/* ── VIEW MODE ── */}
          {!editing && user && (
            <>
              <div className="prof-section-title">Basic Info</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <Field icon="📧" label="Email"  value={user.email} />
                <Field icon="📱" label="Phone"  value={user.phone} />
                <Field icon="🪙" label="Coins"  value={`${user.coins} Coins`} />
                <Field icon="🎓" label="Role"   value={user.role} />
                {user.bio && <Field icon="💬" label="Bio" value={user.bio} />}
              </div>

              <div className="prof-section-title">Academic Details</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <Field icon="🏫" label="University"  value={user.university} empty="Add your university" />
                <Field icon="🪪" label="Roll Number" value={user.rollNo}     empty="Add your roll number" />
                <Field icon="📚" label="Course"      value={user.course}     empty="Add your course" />
                <Field icon="🔬" label="Branch"      value={user.branch}     empty="Add your branch/specialization" />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <Field icon="📅" label="Year"     value={user.year}     empty="Year" />
                  <Field icon="📆" label="Semester" value={user.semester} empty="Semester" />
                </div>
              </div>

              <button className="btn btn-primary" style={{ width:"100%", marginTop:20 }} onClick={startEdit}>
                ✏️ Edit Profile
              </button>

              {/* ── ID Card Section ── */}
              <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                <div className="prof-section-title">🪪 University ID Card</div>
                <IdCardSection user={user} onUpdate={setUser} authHdr={authHdr} />
              </div>

              {/* ── Delete Account ── */}
              <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid rgba(239,68,68,0.15)" }}>
                <div className="prof-section-title" style={{ color:"rgba(239,68,68,0.7)" }}>⚠️ Danger Zone</div>
                <DeleteAccountSection username={user?.username} authHdr={authHdr} />
              </div>
            </>
          )}

          {/* ── EDIT MODE ── */}
          {editing && (
            <>
              <div className="prof-section-title">Basic Info</div>
              <EditField label="Full Name"    field="name"  placeholder="Your full name" />
              <EditField label="Phone"        field="phone" placeholder="10-digit phone" type="tel" />
              <EditField label="Bio"          field="bio"   placeholder="Tell others about yourself…" type="textarea" />

              <div className="prof-section-title">Academic Details</div>
              <EditField label="University"   field="university" placeholder="e.g. IIT Delhi, VIT Vellore" />
              <EditField label="Roll Number"  field="rollNo"     placeholder="e.g. 21BCE1234" />
              <div className="grid-2">
                <EditField label="Course"     field="course"   placeholder="e.g. B.Tech, MBA" />
                <EditField label="Branch"     field="branch"   placeholder="e.g. CSE, ECE" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select className="dash-select" value={form.year || ""}
                    onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
                    <option value="">Select year</option>
                    {["1st Year","2nd Year","3rd Year","4th Year","5th Year"].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="dash-select" value={form.semester || ""}
                    onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}>
                    <option value="">Select sem</option>
                    {["Sem 1","Sem 2","Sem 3","Sem 4","Sem 5","Sem 6","Sem 7","Sem 8"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display:"flex", gap:10, marginTop:8 }}>
                <button className="btn btn-ghost" onClick={() => { setEditing(false); setMsg(""); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ID Card Upload Component ── */
function IdCardSection({ user, onUpdate, authHdr }) {
  const [uploading, setUploading] = useState(false);
  const [msg,       setMsg]       = useState("");
  const [msgType,   setMsgType]   = useState("");
  const [preview,   setPreview]   = useState(null);
  const fileRef = useRef();

  const statusColors = { none:"rgba(255,255,255,0.3)", pending:"#fbbf24", verified:"#4ade80", rejected:"#f87171" };
  const statusLabels = { none:"Not uploaded", pending:"⏳ Pending verification", verified:"✅ Verified", rejected:"❌ Rejected" };
  const status = user?.idVerified || "none";

  const handlePick = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg("Only images allowed."); setMsgType("err"); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg("Max 5MB."); setMsgType("err"); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true); setMsg("");
    const form = new FormData();
    const blob = await fetch(preview).then(r => r.blob());
    form.append("idCard", blob, "idcard.jpg");
    try {
      const { data } = await axios.post(`${API}/auth/upload-idcard`, form,
        { headers: { ...authHdr(), "Content-Type": "multipart/form-data" } });
      onUpdate(data.user); setPreview(null);
      setMsg("ID card submitted for verification!"); setMsgType("ok");
    } catch (e) { setMsg(e.response?.data?.message || "Upload failed."); setMsgType("err"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{
          padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600,
          background: status==="verified" ? "rgba(34,197,94,0.12)" : status==="pending" ? "rgba(251,191,36,0.12)" : status==="rejected" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${statusColors[status]}55`, color: statusColors[status],
        }}>{statusLabels[status]}</div>
      </div>
      {status === "rejected" && user.idRejectedReason && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#fca5a5", marginBottom:14 }}>
          ❌ Reason: {user.idRejectedReason}
        </div>
      )}
      {user?.idCard && !preview && (
        <img src={user.idCard} alt="ID Card" style={{ width:"100%", maxHeight:200, objectFit:"contain", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(0,0,0,0.3)", marginBottom:14, display:"block" }} />
      )}
      {preview && (
        <img src={preview} alt="Preview" style={{ width:"100%", maxHeight:200, objectFit:"contain", borderRadius:12, border:"2px solid rgba(59,130,246,0.4)", background:"rgba(0,0,0,0.3)", marginBottom:14, display:"block" }} />
      )}
      {msg && (
        <div style={{ padding:"9px 14px", borderRadius:10, marginBottom:12, fontSize:13,
          background: msgType==="ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: msgType==="ok" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
          color: msgType==="ok" ? "#86efac" : "#fca5a5",
        }}>{msgType==="ok" ? "✅" : "⚠️"} {msg}</div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePick} />
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => fileRef.current.click()}>
          📷 {user?.idCard ? "Replace ID Card" : "Upload ID Card"}
        </button>
        {preview && (
          <>
            <button className="btn btn-primary" style={{ fontSize:13 }} onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading…" : "Submit for Verification"}
            </button>
            <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => setPreview(null)}>Cancel</button>
          </>
        )}
      </div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:8 }}>
        Upload a clear photo of your university ID card. Admin will verify within 24 hours.
      </div>
    </div>
  );
}

/* ── Delete Account Component ── */
function DeleteAccountSection({ username, authHdr }) {
  const [deleteReq,  setDeleteReq]  = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [reason,     setReason]     = useState("");
  const [busy,       setBusy]       = useState(false);
  const [msg,        setMsg]        = useState("");
  const [msgType,    setMsgType]    = useState("ok");

  useEffect(() => {
    axios.get(`${API}/auth/delete-request`, { headers: authHdr() })
      .then(r => setDeleteReq(r.data)).catch(() => {});
  }, []);

  const showMsg = (text, type = "ok") => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 4000); };

  const handleSubmit = async () => {
    if (!reason.trim()) return showMsg("Please provide a reason.", "err");
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/auth/delete-request`, { reason }, { headers: authHdr() });
      setDeleteReq({ status:"pending", reason });
      setShowForm(false); setReason("");
      showMsg(data.message);
    } catch (e) { showMsg(e.response?.data?.message || "Failed.", "err"); }
    finally { setBusy(false); }
  };

  const handleCancel = async () => {
    try {
      await axios.delete(`${API}/auth/delete-request`, { headers: authHdr() });
      setDeleteReq(null);
      showMsg("Delete request cancelled.");
    } catch (e) { showMsg(e.response?.data?.message || "Failed.", "err"); }
  };

  return (
    <div>
      {msg && (
        <div style={{ padding:"9px 14px", borderRadius:10, marginBottom:12, fontSize:13,
          background: msgType==="ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: msgType==="ok" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
          color: msgType==="ok" ? "#86efac" : "#fca5a5",
        }}>{msgType==="ok" ? "✅" : "⚠️"} {msg}</div>
      )}

      {deleteReq?.status === "pending" ? (
        <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:12, padding:"14px 16px" }}>
          <div style={{ fontWeight:700, color:"#fbbf24", marginBottom:4 }}>⏳ Delete Request Pending</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>
            Your account deletion request is under admin review. You'll be notified once processed.
          </div>
          {deleteReq.reason && <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:10 }}>Reason: {deleteReq.reason}</div>}
          <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={handleCancel}>Cancel Request</button>
        </div>
      ) : deleteReq?.status === "rejected" ? (
        <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"14px 16px", marginBottom:12 }}>
          <div style={{ fontWeight:700, color:"#f87171", marginBottom:4 }}>❌ Request Rejected</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{deleteReq.adminNote || "Your delete request was rejected."}</div>
        </div>
      ) : null}

      {(!deleteReq || deleteReq.status === "rejected") && !showForm && (
        <div style={{ padding:"14px 16px", background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:12 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Delete Account</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:12, lineHeight:1.6 }}>
            Once approved by admin, your account and all data will be permanently deleted.
          </div>
          <button
            style={{ padding:"8px 16px", borderRadius:9, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:600, cursor:"pointer" }}
            onClick={() => setShowForm(true)}>
            🗑️ Request Account Deletion
          </button>
        </div>
      )}

      {showForm && (
        <div style={{ padding:"14px 16px", background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:8, color:"#f87171" }}>Why do you want to delete your account?</div>
          <textarea className="dash-textarea" placeholder="Please explain your reason…"
            value={reason} onChange={e => setReason(e.target.value)}
            style={{ marginBottom:10 }} />
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setReason(""); }}>Cancel</button>
            <button
              style={{ flex:1, padding:"10px", borderRadius:10, background:"linear-gradient(135deg,#ef4444,#b91c1c)", border:"none", color:"#fff", fontFamily:"Outfit,sans-serif", fontSize:13, fontWeight:700, cursor: busy?"not-allowed":"pointer", opacity: busy?0.6:1 }}
              onClick={handleSubmit} disabled={busy}>
              {busy ? "Submitting…" : "Submit Delete Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
