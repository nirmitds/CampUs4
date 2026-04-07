require("dotenv").config();

/* ── Override DNS to use Google (8.8.8.8 / 8.8.4.4) ──
   Fixes: querySrv ECONNREFUSED on restricted networks
   Must be set BEFORE any network calls (mongoose, nodemailer, etc.) */
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const mongoose   = require("mongoose");
const cors       = require("cors");
const jwt        = require("jsonwebtoken");
const bcrypt     = require("bcryptjs");
const crypto     = require("crypto");
const nodemailer = require("nodemailer");
const multer     = require("multer");
const twilio     = require("twilio");
const https      = require("https");
const path       = require("path");

/* ─── FIREBASE TOKEN VERIFY (no service account needed) ─── */
async function verifyFirebaseToken(idToken) {
  return new Promise((resolve, reject) => {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`;
    const body = JSON.stringify({ idToken });
    const req = https.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const user = parsed.users?.[0];
          if (!user) return reject(new Error("User not found"));
          resolve({ phone: user.phoneNumber, uid: user.localId });
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const User     = require("./models/User");
const Request  = require("./models/Request");
const Message  = require("./models/Message");
const ChatSeen = require("./models/ChatSeen");
const Transaction  = require("./models/Transaction");
const CoinDeposit  = require("./models/CoinDeposit");
const DeleteRequest = require("./models/DeleteRequest");
const Faculty       = require("./models/Faculty");
const FacultyContent = require("./models/FacultyContent");
const { DirectConversation, DirectMessage } = require("./models/DirectMessage");
const Friendship = require("./models/Friendship");
const { verifyToken } = require("./middleware/Auth");

const app    = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? (process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, "https://campus44.onrender.com", /\.onrender\.com$/]
      : true)
  : ["http://localhost:5173", "http://localhost:5174"];

const io     = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
  maxHttpBufferSize: 6 * 1024 * 1024,
});

/* ─── TWILIO ─── */
const twilioReady = !!(process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_FROM);
const twilioClient = twilioReady
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
  : null;

async function sendSmsOtp(toPhone, otp) {
  let to = toPhone.replace(/\s/g, "");
  if (/^\d{10}$/.test(to)) to = `+91${to}`;
  if (!to.startsWith("+"))  to = `+${to}`;

  if (!twilioReady) {
    console.log("\n" + "═".repeat(44));
    console.log(`📱  SMS OTP  →  ${to}`);
    console.log(`🔑  CODE     →  ${otp}`);
    console.log("═".repeat(44) + "\n");
    return { sent: false, devMode: true };
  }

  try {
    await twilioClient.messages.create({
      body: `🎓 CampUs: Your verification code is ${otp}. Valid for 10 minutes. Never share this code.`,
      from: process.env.TWILIO_FROM,
      to,
    });
    return { sent: true, devMode: false };
  } catch (err) {
    /* Twilio trial: unverified number — fall back to console */
    console.warn(`⚠️  Twilio SMS failed (${err.code}): ${err.message}`);
    console.log("\n" + "═".repeat(44));
    console.log(`📱  SMS OTP (fallback)  →  ${to}`);
    console.log(`🔑  CODE               →  ${otp}`);
    console.log("═".repeat(44) + "\n");
    return { sent: false, devMode: true, twilioError: err.message };
  }
}

/* ─── COIN HELPER ─── */
async function addCoins(username, amount, description, category = "bonus", ref = null) {
  const user = await User.findOneAndUpdate(
    { username },
    { $inc: { coins: amount } },
    { new: true }
  );
  const tx = await Transaction.create({
    username, type: amount >= 0 ? "credit" : "debit",
    amount: Math.abs(amount), description, category, ref,
  });
  return { user, tx };
}

/* ─── TASK DEFINITIONS — only real campus actions ─── */
const DAILY_REWARDS = [5, 10, 15, 20, 25, 30, 50]; // Day 1→7 coins

const TASKS = [
  // 7-day streak tasks (handled specially)
  { id: "streak_day_1", title: "Day 1 Login",  coins: 5,  category: "bonus", cooldownHours: 0, icon: "🌅", desc: "Log in on Day 1",  action: "claim", actionUrl: null, streakDay: 1 },
  { id: "streak_day_2", title: "Day 2 Login",  coins: 10, category: "bonus", cooldownHours: 0, icon: "🌤️", desc: "Log in on Day 2",  action: "claim", actionUrl: null, streakDay: 2 },
  { id: "streak_day_3", title: "Day 3 Login",  coins: 15, category: "bonus", cooldownHours: 0, icon: "☀️", desc: "Log in on Day 3",  action: "claim", actionUrl: null, streakDay: 3 },
  { id: "streak_day_4", title: "Day 4 Login",  coins: 20, category: "bonus", cooldownHours: 0, icon: "⭐", desc: "Log in on Day 4",  action: "claim", actionUrl: null, streakDay: 4 },
  { id: "streak_day_5", title: "Day 5 Login",  coins: 25, category: "bonus", cooldownHours: 0, icon: "🌟", desc: "Log in on Day 5",  action: "claim", actionUrl: null, streakDay: 5 },
  { id: "streak_day_6", title: "Day 6 Login",  coins: 30, category: "bonus", cooldownHours: 0, icon: "💫", desc: "Log in on Day 6",  action: "claim", actionUrl: null, streakDay: 6 },
  { id: "streak_day_7", title: "Day 7 🎉 Bonus", coins: 50, category: "bonus", cooldownHours: 0, icon: "🏆", desc: "Complete 7-day streak!", action: "claim", actionUrl: null, streakDay: 7 },
  // other tasks
  { id: "complete_profile",  title: "Complete Your Profile",  coins: 20,  category: "bonus",  cooldownHours: 0,  icon: "👤", desc: "Add a profile photo",                       action: "redirect", actionUrl: "/student/profile" },
  { id: "first_exchange",    title: "Post First Request",     coins: 15,  category: "bonus",  cooldownHours: 0,  icon: "🔄", desc: "Post your first exchange request",           action: "redirect", actionUrl: "/student/exchange" },
  { id: "first_accept",      title: "Accept a Request",       coins: 10,  category: "bonus",  cooldownHours: 0,  icon: "✅", desc: "Accept someone's exchange request",          action: "redirect", actionUrl: "/student/exchange" },
  { id: "first_transfer",    title: "First Coin Transfer",    coins: 10,  category: "bonus",  cooldownHours: 0,  icon: "💸", desc: "Transfer coins to another student",          action: "redirect", actionUrl: "/student/wallet" },
  { id: "add_university",    title: "Add University Info",    coins: 15,  category: "bonus",  cooldownHours: 0,  icon: "🏫", desc: "Fill in your university and course details", action: "redirect", actionUrl: "/student/profile" },
  { id: "upload_id",         title: "Upload ID Card",         coins: 25,  category: "bonus",  cooldownHours: 0,  icon: "🪪", desc: "Upload your university ID for verification", action: "redirect", actionUrl: "/student/profile" },
  { id: "first_message",     title: "Send First Message",     coins: 10,  category: "bonus",  cooldownHours: 0,  icon: "💬", desc: "Send a message to another student",          action: "redirect", actionUrl: "/student/social" },
  { id: "add_friend",        title: "Add First Friend",       coins: 10,  category: "bonus",  cooldownHours: 0,  icon: "🤝", desc: "Connect with another student",               action: "redirect", actionUrl: "/student/social" },
  { id: "share_notes",       title: "Share Class Notes",      coins: 20,  category: "task",   cooldownHours: 48, icon: "📝", desc: "Upload notes to help classmates",            action: "redirect", actionUrl: "/student/notes" },
];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json({ limit: "6mb" }));

/* ── Static file serving removed — frontend deployed separately on Render ── */

/* ─── DATABASE ─── */
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not set. Add it in Render → Environment Variables.");
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected to Atlas"))
  .catch(err => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // crash so Render shows the real error
  });

/* ══════════════════════════════════════════
   EMAIL — Gmail SMTP
   MAIL_USER = your Gmail address
   MAIL_PASS = Gmail App Password (16 chars)
   Get it: myaccount.google.com → Security
           → 2-Step Verification → App Passwords
══════════════════════════════════════════ */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const emailReady = !!(
  process.env.MAIL_USER &&
  process.env.MAIL_PASS &&
  process.env.MAIL_USER !== "your_gmail@gmail.com"
);

transporter.verify((err) => {
  if (err) console.warn("⚠️  Gmail SMTP not ready — OTPs will print to console.\n   Fix: set MAIL_USER + MAIL_PASS in .env");
  else     console.log("📧  Gmail SMTP ready!");
});

/* ─── HELPERS ─── */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role, coins: user.coins },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function sendOtpEmail(toEmail, otp) {
  if (!emailReady) {
    console.log("\n" + "═".repeat(44));
    console.log(`📧  EMAIL OTP  →  ${toEmail}`);
    console.log(`🔑  CODE       →  ${otp}`);
    console.log("═".repeat(44) + "\n");
    return false; // not sent via email
  }

  await transporter.sendMail({
    from: `"CampUs 🎓" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `${otp} is your CampUs login code`,
    html: `
      <!DOCTYPE html><html><body style="margin:0;padding:0;background:#05050f;font-family:'Segoe UI',sans-serif;">
        <div style="max-width:480px;margin:40px auto;padding:40px 36px;
                    background:#0f0f23;border-radius:20px;
                    border:1px solid rgba(59,130,246,0.25);">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
            <div style="width:44px;height:44px;border-radius:12px;
                        background:linear-gradient(135deg,#3b82f6,#8b5cf6);
                        display:flex;align-items:center;justify-content:center;font-size:22px;">🎓</div>
            <div>
              <div style="font-size:18px;font-weight:800;color:#fff;">CampUs</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.35);">One-Time Password</div>
            </div>
          </div>
          <h2 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 10px;">Your login code</h2>
          <p style="color:rgba(255,255,255,0.45);font-size:14px;line-height:1.7;margin:0 0 28px;">
            Use the code below to sign in. It expires in <strong style="color:#fff;">10 minutes</strong>.
          </p>
          <div style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);
                      border-radius:16px;padding:30px;text-align:center;margin-bottom:28px;">
            <div style="font-size:50px;font-weight:900;letter-spacing:16px;color:#fff;
                        font-family:'Courier New',monospace;">${otp}</div>
          </div>
          <p style="color:rgba(255,255,255,0.28);font-size:12px;text-align:center;line-height:1.6;">
            If you didn't request this, ignore this email.<br/>Never share this code with anyone.
          </p>
        </div>
      </body></html>
    `,
  });
  return true; // sent via email
}

/* ══════════════════════════════════════════════════════
   ROUTES
══════════════════════════════════════════════════════ */

app.get("/", (req, res) => res.send("🚀 CampUs Backend Running"));

/* ── REGISTER ── */
app.post("/auth/register", async (req, res) => {
  try {
    const { name, username, email, password, phone, university, rollNo, course, idCard } = req.body;
    if (!name || !username || !email || !password || !phone)
      return res.status(400).json({ message: "All fields are required" });
    if (!university || !rollNo)
      return res.status(400).json({ message: "University name and roll number are required" });

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(400).json({ message: "Username or email already taken" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name, username, email, password: hashed, phone,
      university: university || "",
      rollNo:     rollNo     || "",
      course:     course     || "",
      idCard:     idCard     || null,
      idVerified: idCard ? "pending" : "none",
    });
    /* log welcome bonus */
    await addCoins(username, 100, "Welcome to CampUs! 🎓", "bonus");
    res.json({ message: "Account created successfully! Please sign in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ── SEND PHONE OTP FOR REGISTRATION ── */
app.post("/auth/send-register-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number required" });

    const trimmed = phone.replace(/\D/g, "");
    if (trimmed.length < 10) return res.status(400).json({ message: "Enter a valid phone number" });

    const otp    = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    /* store OTP temporarily keyed by phone — reuse User model's OTP fields */
    let temp = await User.findOne({ phone: trimmed, username: { $regex: /^__reg_/ } });
    if (temp) {
      temp.otpCode = otp; temp.otpExpiry = expiry;
      await temp.save();
    } else {
      await User.create({
        name: "pending", username: `__reg_${trimmed}_${Date.now()}`,
        email: `pending_${trimmed}@reg.tmp`, password: null,
        phone: trimmed, otpCode: otp, otpExpiry: expiry,
      });
    }

    const result = await sendSmsOtp(trimmed, otp);
    res.json({
      message: result.sent ? `OTP sent to ${trimmed}` : `OTP generated — check server console`,
      devMode: result.devMode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* ── VERIFY PHONE OTP FOR REGISTRATION ── */
app.post("/auth/verify-register-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP required" });

    const trimmed = phone.replace(/\D/g, "");
    const temp = await User.findOne({ phone: trimmed, username: { $regex: /^__reg_/ } });
    if (!temp || !temp.otpCode)
      return res.status(400).json({ message: "No OTP found. Request a new one." });

    if (new Date() > new Date(temp.otpExpiry)) {
      temp.otpCode = null; temp.otpExpiry = null;
      await temp.save();
      return res.status(400).json({ message: "OTP expired. Request a new one." });
    }

    if (temp.otpCode !== otp.trim())
      return res.status(400).json({ message: "Incorrect OTP" });

    /* mark verified — clean up temp record */
    await User.deleteOne({ _id: temp._id });
    res.json({ verified: true, message: "Phone verified!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification failed" });
  }
});

/* ── PASSWORD LOGIN ── */
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required" });

    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.password) return res.status(400).json({ message: "This account uses OTP login. Use the OTP tab." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    res.json({ token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ══════════════════════════════════════════════════════
   SEND OTP
   ─────────────────────────────────────────────────────
   Works for ANY email — no pre-registration needed.
   • If user exists → send OTP to their registered email
   • If email entered directly → send OTP to that email
     and find/create user by email match

   Phone: finds user by phone, sends SMS (Twilio stub)
══════════════════════════════════════════════════════ */
app.post("/auth/send-otp", async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: "Email or phone required" });

    const trimmed = identifier.trim().toLowerCase();
    const isPhone = /^\d{10,}$/.test(trimmed);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!isPhone && !isEmail) {
      return res.status(400).json({ message: "Enter a valid email address or 10-digit phone number" });
    }

    let targetEmail = null;
    let user = null;

    if (isEmail) {
      /*
        Email flow:
        • Find existing user by email (case-insensitive)
        • If not found — still send OTP to that email
          (they can log in if they registered with it,
           the verify step will catch it)
      */
      user = await User.findOne({ email: trimmed });
      targetEmail = trimmed; // always send to the entered email
    } else {
      /* Phone flow — user must already exist */
      user = await User.findOne({ phone: trimmed });
      if (!user) {
        return res.status(404).json({ message: "No account found with this phone number" });
      }
    }

    const otp    = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (user) {
      /* save OTP on existing user */
      user.otpCode   = otp;
      user.otpExpiry = expiry;
      await user.save();
    } else {
      /*
        No user with this email yet —
        store OTP in a temp record keyed by email
        so verify-otp can find it.
        We'll create a minimal placeholder user.
      */
      const placeholder = await User.create({
        name:     trimmed.split("@")[0],
        username: "user_" + Date.now(),
        email:    trimmed,
        password: null,
        phone:    "0000000000",
        otpCode:   otp,
        otpExpiry: expiry,
      });
      /* we don't expose this — verify will handle it */
    }

    /* send OTP */
    let sentViaEmail = false;
    if (isEmail) {
      sentViaEmail = await sendOtpEmail(targetEmail, otp);
    } else {
      const result = await sendSmsOtp(trimmed, otp);
      return res.json({
        message: result.sent
          ? `OTP sent via SMS to ${trimmed}`
          : `OTP generated — check the server console`,
        devMode: result.devMode,
      });
    }

    res.json({
      message: sentViaEmail
        ? `OTP sent to ${targetEmail} — check your inbox`
        : `OTP generated — check the server console (Gmail not configured yet)`,
      devMode: !sentViaEmail && isEmail,
    });

  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ message: "Failed to send OTP. " + err.message });
  }
});

/* ══════════════════════════════════════════════════════
   VERIFY OTP
   Works for any email — finds user by email/phone,
   checks OTP, returns JWT token
══════════════════════════════════════════════════════ */
app.post("/auth/verify-otp", async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp)
      return res.status(400).json({ message: "Identifier and OTP required" });

    const trimmed = identifier.trim().toLowerCase();
    const isPhone = /^\d{10,}$/.test(trimmed);
    const query   = isPhone ? { phone: trimmed } : { email: trimmed };

    const user = await User.findOne(query);
    if (!user)         return res.status(404).json({ message: "No account found. Please register first." });
    if (!user.otpCode) return res.status(400).json({ message: "No OTP found. Please request a new one." });

    if (new Date() > new Date(user.otpExpiry)) {
      user.otpCode = null; user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (user.otpCode !== otp.trim())
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });

    /* success */
    user.otpCode = null; user.otpExpiry = null;
    await user.save();

    res.json({ token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

/* ── VERIFY SESSION ── */
app.get("/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otpCode -otpExpiry");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ── GET USER BY USERNAME (for chat avatars) ── */
app.get("/auth/user/:username", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select("username name avatar");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ username: user.username, name: user.name, avatar: user.avatar });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ── FIREBASE PHONE LOGIN ── */
/* Called after Firebase verifies the OTP on the frontend */
app.post("/auth/firebase-login", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Firebase ID token required" });

    const { phone } = await verifyFirebaseToken(idToken);
    if (!phone) return res.status(400).json({ message: "No phone number in Firebase token" });

    /* strip country code to match stored 10-digit phone */
    const stripped = phone.replace(/^\+91/, "").replace(/\D/g, "");

    const user = await User.findOne({ $or: [{ phone: stripped }, { phone }] });
    if (!user) {
      return res.status(404).json({
        message: "No account found for this phone number. Please register first.",
        needsRegister: true,
        phone: stripped,
      });
    }

    res.json({ token: signToken(user) });
  } catch (err) {
    console.error("firebase-login error:", err.message);
    res.status(401).json({ message: "Firebase verification failed: " + err.message });
  }
});

/* ── UPLOAD AVATAR ── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/"))
      return cb(new Error("Only image files are allowed"));
    cb(null, true);
  },
});

app.post("/auth/upload-avatar", verifyToken, (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    await User.findByIdAndUpdate(req.user.id, { avatar: dataUrl });
    res.json({ avatar: dataUrl });
  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
});

/* ── DELETE AVATAR ── */
app.delete("/auth/avatar", verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { avatar: null });
    res.json({ message: "Avatar removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove avatar" });
  }
});

/* ── UPDATE PROFILE INFO ── */
app.put("/auth/profile", verifyToken, async (req, res) => {
  try {
    const allowed = ["university", "rollNo", "course", "branch", "year", "semester", "bio", "name", "phone"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .select("-password -otpCode -otpExpiry");
    res.json({ user });
  } catch (err) { res.status(500).json({ message: "Update failed" }); }
});

/* ── UPLOAD ID CARD ── */
app.post("/auth/upload-idcard", verifyToken, (req, res, next) => {
  upload.single("idCard")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { idCard: dataUrl, idVerified: "pending" },
      { new: true }
    ).select("-password -otpCode -otpExpiry");
    res.json({ idCard: dataUrl, idVerified: "pending", user });
  } catch (err) { res.status(500).json({ message: "Upload failed" }); }
});

/* ══════════════════════════════════════════════════════
   ADMIN MIDDLEWARE + ROUTES
══════════════════════════════════════════════════════ */
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
}

/* ── ADMIN LOGIN (no token needed) ── */
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required" });

    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user)                return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== "admin") return res.status(403).json({ message: "Access denied — not an admin account" });
    if (!user.password)       return res.status(401).json({ message: "No password set on this account" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    res.json({ token, name: user.name, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* stats overview */
app.get("/admin/stats", verifyToken, adminOnly, async (req, res) => {
  try {
    const [users, requests, messages, transactions, pendingId] = await Promise.all([
      User.countDocuments({ username: { $not: /^__reg_/ } }),
      Request.countDocuments(),
      Message.countDocuments(),
      Transaction.countDocuments(),
      User.countDocuments({ idVerified: "pending" }),
    ]);
    const openRequests     = await Request.countDocuments({ status: "Open" });
    const acceptedRequests = await Request.countDocuments({ status: "Accepted" });
    const totalCoins       = await User.aggregate([{ $group: { _id: null, total: { $sum: "$coins" } } }]);
    res.json({ users, requests, openRequests, acceptedRequests, messages, transactions, pendingId, totalCoins: totalCoins[0]?.total || 0 });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* all users */
app.get("/admin/users", verifyToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ username: { $not: /^__reg_/ } })
      .select("-password -otpCode -otpExpiry -idCard")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* get single user with idCard for verification */
app.get("/admin/users/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -otpCode -otpExpiry");
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* verify / reject ID */
app.put("/admin/users/:id/verify-id", verifyToken, adminOnly, async (req, res) => {
  try {
    const { action, reason } = req.body; // action: "verified" | "rejected"
    if (!["verified","rejected"].includes(action))
      return res.status(400).json({ message: "action must be verified or rejected" });
    const update = { idVerified: action };
    if (action === "rejected") update.idRejectedReason = reason || "ID not clear";
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select("-password -otpCode -otpExpiry -idCard");
    res.json(user);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* change user role */
app.put("/admin/users/:id/role", verifyToken, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student","admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
      .select("-password -otpCode -otpExpiry -idCard");
    res.json(user);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* all requests */
app.get("/admin/requests", verifyToken, adminOnly, async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 }).limit(200);
    res.json(requests);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* all transactions */
app.get("/admin/transactions", verifyToken, adminOnly, async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ createdAt: -1 }).limit(500);
    res.json(txs);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* pending ID verifications — include idCard */
app.get("/admin/pending-ids", verifyToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ idVerified: "pending" }).select("-password -otpCode -otpExpiry");
    res.json(users);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* all users for ID verify tab — include idCard */
app.get("/admin/users-with-id", verifyToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ username: { $not: /^__reg_/ } })
      .select("-password -otpCode -otpExpiry")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});
/* ══════════════════════════════════════════════════════
   EXCHANGE ROUTES
══════════════════════════════════════════════════════ */

app.post("/exchange/create", verifyToken, async (req, res) => {
  try {
    const { title, type, description, category, coins } = req.body;
    if (!title || !description) return res.status(400).json({ message: "Title and description required" });

    /* enforce: only one Open request per user at a time */
    const existing = await Request.findOne({ ownerUsername: req.user.username, status: "Open" });
    if (existing)
      return res.status(400).json({
        message: "You already have an open request. Close or delete it before posting a new one.",
        existingId: existing._id,
      });

    const owner = await User.findById(req.user.id).select("phone university");
    const r = await Request.create({
      title, type, description, category,
      coins: Math.max(0, parseInt(coins) || 0),
      ownerUsername:   req.user.username,
      ownerUniversity: owner?.university || "",
      ownerPhone:      owner?.phone || "",
    });
    res.json(r);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* get all requests — sorted: my university first, then nearby, then others */
app.get("/exchange/all", async (req, res) => {
  try {
    const all = await Request.find().sort({ createdAt: -1 });
    res.json(all);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* get all requests with university context for logged-in user */
app.get("/exchange/feed", async (req, res) => {
  try {
    /* get requester's university if token provided */
    let myUniversity = "";
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        const u = await User.findById(decoded.id).select("university");
        myUniversity = u?.university || "";
      } catch {}
    }

    const all = await Request.find().sort({ createdAt: -1 });

    if (!myUniversity) return res.json({ myUni: [], nearby: [], others: all, myUniversity: "" });

    const myUni  = all.filter(r => r.ownerUniversity && r.ownerUniversity.toLowerCase() === myUniversity.toLowerCase());
    const others = all.filter(r => !r.ownerUniversity || r.ownerUniversity.toLowerCase() !== myUniversity.toLowerCase());

    res.json({ myUni, nearby: [], others, myUniversity });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.get("/exchange/my-requests", verifyToken, async (req, res) => {
  try {
    const owned    = await Request.find({ ownerUsername: req.user.username }).sort({ createdAt: -1 });
    const accepted = await Request.find({ acceptedBy: req.user.username }).sort({ createdAt: -1 });
    res.json({ owned, accepted });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.get("/exchange/:id", async (req, res) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json(r);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* accept — deducts coins from acceptor */
app.put("/exchange/accept/:id", verifyToken, async (req, res) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r)                                    return res.status(404).json({ message: "Not found" });
    if (r.status !== "Open")                   return res.status(400).json({ message: "Request already accepted" });
    if (r.ownerUsername === req.user.username) return res.status(400).json({ message: "Cannot accept your own request" });

    const acceptor = await User.findById(req.user.id);
    if (acceptor.coins < r.coins)
      return res.status(400).json({ message: `Not enough coins. You need ${r.coins} 🪙` });

    r.status        = "Accepted";
    r.acceptedBy    = req.user.username;
    r.acceptorPhone = acceptor.phone || "";
    await r.save();

    /* deduct coins via addCoins so transaction is logged */
    let coinsLeft = acceptor.coins;
    if (r.coins > 0) {
      const { user: updated } = await addCoins(
        req.user.username, -r.coins,
        `Accepted request: ${r.title}`, "exchange", r._id.toString()
      );
      coinsLeft = updated.coins;
      io.to(`user:${req.user.username}`).emit("wallet_update", { coins: coinsLeft });
    }

    res.json({ request: r, coinsLeft });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.delete("/exchange/:id", verifyToken, async (req, res) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: "Not found" });
    if (r.ownerUsername !== req.user.username) return res.status(403).json({ message: "Not allowed" });
    await Request.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ requestId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ══════════════════════════════════════════════════════
   CHAT ROUTES  (only owner + acceptor can access)
══════════════════════════════════════════════════════ */

function chatGuard(req, r) {
  return r.ownerUsername === req.user.username || r.acceptedBy === req.user.username;
}

/* ── CHAT SUMMARY — must be BEFORE /:requestId to avoid param conflict ── */
app.get("/chat/summary", verifyToken, async (req, res) => {
  try {
    const me = req.user.username;

    const myRequests = await Request.find({
      status: "Accepted",
      $or: [{ ownerUsername: me }, { acceptedBy: me }],
    }).lean();

    const summary = await Promise.all(myRequests.map(async (r) => {
      const seen   = await ChatSeen.findOne({ requestId: r._id, username: me }).lean();
      const seenAt = seen?.seenAt || new Date(0);

      const unread = await Message.countDocuments({
        requestId: r._id,
        sender:    { $ne: me },
        createdAt: { $gt: seenAt },
      });

      const last = await Message.findOne({ requestId: r._id }).sort({ createdAt: -1 }).lean();

      return {
        requestId:   r._id,
        title:       r.title,
        otherUser:   r.ownerUsername === me ? r.acceptedBy : r.ownerUsername,
        unread,
        lastMessage: last ? { text: last.text, sender: last.sender, at: last.createdAt } : null,
        lastAt:      last?.createdAt || r.updatedAt,
      };
    }));

    const totalUnread = summary.reduce((a, s) => a + s.unread, 0);
    res.json({
      totalUnread,
      chats: summary.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt)),
    });
  } catch (err) {
    console.error("chat/summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/chat/:requestId", verifyToken, async (req, res) => {
  try {
    const r = await Request.findById(req.params.requestId);
    if (!r)                 return res.status(404).json({ message: "Request not found" });
    if (!chatGuard(req, r)) return res.status(403).json({ message: "Access denied" });
    const msgs = await Message.find({ requestId: r._id }).sort({ createdAt: 1 });
    res.json({ request: r, messages: msgs });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* mark messages as seen */
app.post("/chat/:requestId/seen", verifyToken, async (req, res) => {
  try {
    const r = await Request.findById(req.params.requestId);
    if (!r || !chatGuard(req, r)) return res.status(403).json({ message: "Access denied" });
    await ChatSeen.findOneAndUpdate(
      { requestId: r._id, username: req.user.username },
      { seenAt: new Date() },
      { upsert: true }
    );
    /* push updated summary so badge clears instantly */
    pushSummary(req.user.username);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.post("/chat/:requestId", verifyToken, async (req, res) => {
  try {
    const r = await Request.findById(req.params.requestId);
    if (!r)                      return res.status(404).json({ message: "Request not found" });
    if (r.status !== "Accepted") return res.status(400).json({ message: "Chat only available after request is accepted" });
    if (!chatGuard(req, r))      return res.status(403).json({ message: "Access denied" });

    const { text, type, image } = req.body;
    if (type === "image") {
      if (!image) return res.status(400).json({ message: "Image data required" });
      const msg = await Message.create({ requestId: r._id, sender: req.user.username, type: "image", text: "", image });
      io.to(`chat:${r._id}`).emit("message", msg);
      /* notify recipient */
      const recipient = r.ownerUsername === req.user.username ? r.acceptedBy : r.ownerUsername;
      pushSummary(recipient);
      return res.json(msg);
    }
    if (!text?.trim()) return res.status(400).json({ message: "Message cannot be empty" });
    const msg = await Message.create({ requestId: r._id, sender: req.user.username, type: "text", text: text.trim() });
    io.to(`chat:${r._id}`).emit("message", msg);
    /* notify recipient */
    const recipient = r.ownerUsername === req.user.username ? r.acceptedBy : r.ownerUsername;
    pushSummary(recipient);
    res.json(msg);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* push fresh summary to a user's personal socket room */
async function pushSummary(username) {
  try {
    const myRequests = await Request.find({
      status: "Accepted",
      $or: [{ ownerUsername: username }, { acceptedBy: username }],
    }).lean();

    const chats = await Promise.all(myRequests.map(async (r) => {
      const seen   = await ChatSeen.findOne({ requestId: r._id, username }).lean();
      const seenAt = seen?.seenAt || new Date(0);
      const unread = await Message.countDocuments({
        requestId: r._id, sender: { $ne: username }, createdAt: { $gt: seenAt },
      });
      const last = await Message.findOne({ requestId: r._id }).sort({ createdAt: -1 }).lean();
      return {
        requestId:   r._id,
        title:       r.title,
        otherUser:   r.ownerUsername === username ? r.acceptedBy : r.ownerUsername,
        unread,
        lastMessage: last ? { text: last.text, sender: last.sender, at: last.createdAt } : null,
        lastAt:      last?.createdAt || r.updatedAt,
      };
    }));

    const totalUnread = chats.reduce((a, c) => a + c.unread, 0);
    io.to(`user:${username}`).emit("summary_update", {
      totalUnread,
      chats: chats.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt)),
    });
  } catch {}
}
/* ══════════════════════════════════════════════════════
   BARGAIN ROUTES
══════════════════════════════════════════════════════ */

/* acceptor sends a bargain offer */
app.post("/exchange/:id/bargain", verifyToken, async (req, res) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r)                           return res.status(404).json({ message: "Not found" });
    if (r.status !== "Accepted")      return res.status(400).json({ message: "Request must be accepted first" });
    if (r.acceptedBy !== req.user.username)
      return res.status(403).json({ message: "Only the acceptor can make a bargain offer" });

    const coins = parseInt(req.body.coins);
    if (isNaN(coins) || coins < 0)    return res.status(400).json({ message: "Invalid coin amount" });

    r.bargain = { offeredBy: req.user.username, coins, status: "pending", createdAt: new Date() };
    await r.save();
    res.json(r);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* owner responds to bargain */
app.put("/exchange/:id/bargain", verifyToken, async (req, res) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r)                           return res.status(404).json({ message: "Not found" });
    if (r.ownerUsername !== req.user.username)
      return res.status(403).json({ message: "Only the owner can respond to a bargain" });
    if (!r.bargain?.offeredBy || r.bargain.status !== "pending")
      return res.status(400).json({ message: "No pending bargain offer" });

    const { action } = req.body; // "accept" | "reject"
    if (!["accept", "reject"].includes(action))
      return res.status(400).json({ message: "action must be accept or reject" });

    if (action === "accept") {
      const bargainCoins = r.bargain.coins;
      const acceptor = await User.findOne({ username: r.acceptedBy });
      const owner    = await User.findById(req.user.id);

      if (!acceptor) return res.status(404).json({ message: "Acceptor not found" });

      /* deduct from acceptor, add to owner — log both transactions */
      if (acceptor.coins < bargainCoins)
        return res.status(400).json({ message: `Acceptor doesn't have enough coins (needs ${bargainCoins} 🪙)` });

      await addCoins(r.acceptedBy, -bargainCoins, `Bargain deal: ${r.title}`, "exchange", r._id.toString());
      const { user: updatedOwner } = await addCoins(r.ownerUsername, bargainCoins, `Bargain received: ${r.title}`, "exchange", r._id.toString());

      r.bargain.status = "accepted";
      r.coins          = bargainCoins;
      await r.save();

      return res.json({ request: r, ownerCoins: updatedOwner.coins, message: `🪙 ${bargainCoins} coins transferred!` });
    }

    // reject
    r.bargain.status = "rejected";
    await r.save();
    res.json({ request: r, message: "Bargain rejected" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ══════════════════════════════════════════════════════
   LIVE LOCATION ROUTES
══════════════════════════════════════════════════════ */

/* both users update their location */
app.post("/exchange/:id/location", verifyToken, async (req, res) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: "Not found" });

    const isOwner    = r.ownerUsername === req.user.username;
    const isAcceptor = r.acceptedBy    === req.user.username;
    if (!isOwner && !isAcceptor)
      return res.status(403).json({ message: "Access denied" });

    const field = isOwner ? "ownerLocation" : "acceptorLocation";
    const { lat, lng, sharing } = req.body;

    if (sharing === false) {
      r[field] = { lat: null, lng: null, updatedAt: null, sharing: false };
    } else {
      if (typeof lat !== "number" || typeof lng !== "number")
        return res.status(400).json({ message: "lat and lng required" });
      r[field] = { lat, lng, updatedAt: new Date(), sharing: true };
    }
    await r.save();

    /* broadcast location update to the chat room */
    io.to(`chat:${r._id}`).emit("location_update", {
      field,
      location: r[field],
    });

    res.json({ ok: true, location: r[field] });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* get both locations */
app.get("/exchange/:id/location", verifyToken, async (req, res) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: "Not found" });
    if (r.ownerUsername !== req.user.username && r.acceptedBy !== req.user.username)
      return res.status(403).json({ message: "Access denied" });
    res.json({ ownerLocation: r.ownerLocation, acceptorLocation: r.acceptorLocation });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ══════════════════════════════════════════════════════
   SOCKET.IO — real-time chat
══════════════════════════════════════════════════════ */
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { next(new Error("Invalid token")); }
});

io.on("connection", (socket) => {
  /* join personal notification room */
  socket.join(`user:${socket.user.username}`);

  /* join a chat room */
  socket.on("join", async (requestId) => {
    try {
      const r = await Request.findById(requestId);
      if (!r) return;
      const allowed = r.ownerUsername === socket.user.username || r.acceptedBy === socket.user.username;
      if (!allowed) return;
      socket.join(`chat:${requestId}`);
    } catch {}
  });

  socket.on("leave", (requestId) => {
    socket.leave(`chat:${requestId}`);
  });

  /* typing indicator */
  socket.on("typing", ({ requestId, typing }) => {
    socket.to(`chat:${requestId}`).emit("typing", { username: socket.user.username, typing });
  });

  /* DM typing */
  socket.on("dm_typing", ({ to, typing }) => {
    io.to(`user:${to}`).emit("dm_typing", { from: socket.user.username, typing });
  });
});

/* ══════════════════════════════════════════════════════
   COIN DEPOSIT — QR / UPI Manual Flow
══════════════════════════════════════════════════════ */
const COIN_PACKAGES = [
  { id: "pack_10",  inr: 10,  coins: 100, label: "Starter 🎉", badge: "NEW USER OFFER", oneTime: true  },
  { id: "pack_50",  inr: 50,  coins: 65,  label: "Basic",       badge: null,             oneTime: false },
  { id: "pack_100", inr: 100, coins: 140, label: "Popular",     badge: "BEST VALUE",     oneTime: false },
  { id: "pack_250", inr: 250, coins: 360, label: "Pro",         badge: null,             oneTime: false },
  { id: "pack_500", inr: 500, coins: 750, label: "Premium",     badge: null,             oneTime: false },
];

const UPI_ID   = process.env.UPI_ID   || "nirmitdudeja204@okicici";
const UPI_NAME = process.env.UPI_NAME || "Nirmit Dudeja";
const QR_IMAGE = process.env.QR_IMAGE_URL || null;

app.get("/wallet/packages", verifyToken, async (req, res) => {
  try {
    const me = req.user.username;
    const usedFirst = await CoinDeposit.findOne({ username: me, packageId: "pack_10", status: "approved" });
    const packages = COIN_PACKAGES.map(p => ({ ...p, available: p.oneTime ? !usedFirst : true }));
    res.json({ packages, upiId: UPI_ID, upiName: UPI_NAME, qrImage: QR_IMAGE });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* create deposit request — 5 min expiry */
app.post("/wallet/deposit", verifyToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = COIN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ message: "Invalid package" });
    if (pkg.oneTime) {
      const used = await CoinDeposit.findOne({ username: req.user.username, packageId, status: "approved" });
      if (used) return res.status(400).json({ message: "This offer has already been used" });
    }
    await CoinDeposit.updateMany({ username: req.user.username, status: "pending" }, { status: "expired" });
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const deposit = await CoinDeposit.create({ username: req.user.username, packageId, inr: pkg.inr, coins: pkg.coins, expiresAt });
    res.json({ deposit, upiId: UPI_ID, upiName: UPI_NAME, qrImage: QR_IMAGE, expiresAt });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* user submits UTR */
app.put("/wallet/deposit/:id/utr", verifyToken, async (req, res) => {
  try {
    const { utr } = req.body;
    if (!utr?.trim()) return res.status(400).json({ message: "UTR number required" });
    const deposit = await CoinDeposit.findOne({ _id: req.params.id, username: req.user.username });
    if (!deposit) return res.status(404).json({ message: "Deposit not found" });
    if (deposit.status === "expired" || new Date() > deposit.expiresAt)
      return res.status(400).json({ message: "This deposit request has expired. Please start again." });
    if (deposit.status !== "pending") return res.status(400).json({ message: `Deposit already ${deposit.status}` });
    deposit.utr = utr.trim();
    await deposit.save();
    res.json({ deposit, message: "UTR submitted! Admin will verify and credit coins shortly." });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* user deposit history */
app.get("/wallet/deposits", verifyToken, async (req, res) => {
  try {
    await CoinDeposit.updateMany({ username: req.user.username, status: "pending", expiresAt: { $lt: new Date() } }, { status: "expired" });
    const deposits = await CoinDeposit.find({ username: req.user.username }).sort({ createdAt: -1 }).limit(20);
    res.json(deposits);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* admin — all deposits */
app.get("/admin/deposits", verifyToken, adminOnly, async (req, res) => {
  try {
    await CoinDeposit.updateMany({ status: "pending", expiresAt: { $lt: new Date() } }, { status: "expired" });
    const deposits = await CoinDeposit.find().sort({ createdAt: -1 }).limit(200);
    res.json(deposits);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* admin approve */
app.put("/admin/deposits/:id/approve", verifyToken, adminOnly, async (req, res) => {
  try {
    const deposit = await CoinDeposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: "Not found" });
    if (deposit.status !== "pending") return res.status(400).json({ message: `Already ${deposit.status}` });
    if (new Date() > deposit.expiresAt) { deposit.status = "expired"; await deposit.save(); return res.status(400).json({ message: "Deposit expired" }); }
    deposit.status = "approved"; await deposit.save();
    const { user, tx } = await addCoins(deposit.username, deposit.coins, `Coin deposit approved — ${deposit.coins} coins (₹${deposit.inr})`, "bonus", `deposit:${deposit._id}`);
    io.to(`user:${deposit.username}`).emit("wallet_update", { coins: user.coins, tx });
    io.to(`user:${deposit.username}`).emit("deposit_approved", { deposit, coins: user.coins });
    res.json({ deposit, message: `✅ ${deposit.coins} coins credited to @${deposit.username}` });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* admin reject */
app.put("/admin/deposits/:id/reject", verifyToken, adminOnly, async (req, res) => {
  try {
    const deposit = await CoinDeposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: "Not found" });
    if (deposit.status !== "pending") return res.status(400).json({ message: `Already ${deposit.status}` });
    deposit.status = "rejected"; deposit.adminNote = req.body.note || ""; await deposit.save();
    io.to(`user:${deposit.username}`).emit("deposit_rejected", { deposit });
    res.json({ deposit, message: `❌ Deposit rejected for @${deposit.username}` });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ── WALLET ROUTES ── */

/* get balance + recent transactions */
app.get("/wallet", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("coins username name");
    const txs  = await Transaction.find({ username: req.user.username })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ coins: user.coins, transactions: txs });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* get available tasks + completion status */
app.get("/wallet/tasks", verifyToken, async (req, res) => {
  try {
    const me   = req.user.username;
    const user = await User.findById(req.user.id).select("avatar university course idCard loginStreak lastLoginDate");

    /* ── streak logic ── */
    const now       = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    const lastDay   = lastLogin ? new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate()) : null;
    const daysDiff  = lastDay ? Math.floor((today - lastDay) / 86400000) : null;

    let currentStreak = user.loginStreak || 0;
    // if last claim was yesterday, streak continues; if >1 day ago, reset
    if (daysDiff === null || daysDiff > 1) currentStreak = 0;
    // next claimable day
    const nextStreakDay = currentStreak + 1; // 1-7, resets after 7

    const taskList = await Promise.all(TASKS.map(async (t) => {
      let canDo = true;
      let nextAvailableAt = null;
      let autoCompleted = false;

      /* ── streak day tasks ── */
      if (t.streakDay !== undefined) {
        if (t.streakDay < nextStreakDay) {
          // already claimed in a previous day this cycle ✅
          canDo = false; autoCompleted = true;
        } else if (t.streakDay === nextStreakDay) {
          if (daysDiff === 0) {
            // claimed today — show as done (not autoCompleted so it shows different icon)
            canDo = false; autoCompleted = false;
          } else {
            canDo = true; // available to claim now
          }
        } else {
          // future day — locked 🔒
          canDo = false; autoCompleted = false;
        }
        const claimedToday = (t.streakDay === nextStreakDay && daysDiff === 0);
        return { ...t, canDo, nextAvailableAt, autoCompleted, currentStreak, nextStreakDay, claimedToday };
      }

      /* ── regular tasks ── */
      if (t.cooldownHours > 0) {
        const last = await Transaction.findOne({ username: me, ref: `task:${t.id}` }).sort({ createdAt: -1 });
        if (last) {
          const elapsed = (Date.now() - new Date(last.createdAt).getTime()) / 3600000;
          if (elapsed < t.cooldownHours) {
            canDo = false;
            nextAvailableAt = new Date(new Date(last.createdAt).getTime() + t.cooldownHours * 3600000);
          }
        }
      } else {
        const done = await Transaction.findOne({ username: me, ref: `task:${t.id}` });
        if (done) { canDo = false; }
        else {
          if (t.id === "complete_profile" && user?.avatar) { canDo = false; autoCompleted = true; }
          if (t.id === "add_university" && user?.university && user?.course) { canDo = false; autoCompleted = true; }
          if (t.id === "upload_id" && user?.idCard) { canDo = false; autoCompleted = true; }
          if (t.id === "first_exchange") {
            const has = await Request.findOne({ ownerUsername: me });
            if (has) { canDo = false; autoCompleted = true; }
          }
          if (t.id === "first_accept") {
            const has = await Request.findOne({ acceptedBy: me });
            if (has) { canDo = false; autoCompleted = true; }
          }
          if (t.id === "first_transfer") {
            const has = await Transaction.findOne({ username: me, category: "transfer", type: "debit" });
            if (has) { canDo = false; autoCompleted = true; }
          }
          if (t.id === "first_message") {
            const { DirectMessage } = require("./models/DirectMessage");
            const has = await DirectMessage.findOne({ sender: me });
            if (has) { canDo = false; autoCompleted = true; }
          }
          if (t.id === "add_friend") {
            const Friendship = require("./models/Friendship");
            const has = await Friendship.findOne({ $or: [{ from: me }, { to: me }], status: "accepted" });
            if (has) { canDo = false; autoCompleted = true; }
          }
        }
      }

      return { ...t, canDo, nextAvailableAt, autoCompleted };
    }));
    res.json({ tasks: taskList, currentStreak, nextStreakDay });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* complete a task and earn coins */
app.post("/wallet/task/:taskId", verifyToken, async (req, res) => {
  try {
    const task = TASKS.find(t => t.id === req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const me = req.user.username;

    /* ── streak task ── */
    if (task.streakDay !== undefined) {
      const user = await User.findById(req.user.id);
      const now     = new Date();
      const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastDay = user.lastLoginDate
        ? new Date(new Date(user.lastLoginDate).getFullYear(), new Date(user.lastLoginDate).getMonth(), new Date(user.lastLoginDate).getDate())
        : null;
      const daysDiff = lastDay ? Math.floor((today - lastDay) / 86400000) : null;

      let currentStreak = user.loginStreak || 0;
      if (daysDiff === null || daysDiff > 1) currentStreak = 0;

      const nextDay = currentStreak + 1;
      if (task.streakDay !== nextDay) return res.status(400).json({ message: `Complete Day ${nextDay} first` });
      if (daysDiff === 0) return res.status(400).json({ message: "Already claimed today" });

      const newStreak = nextDay >= 7 ? 0 : nextDay; // reset after day 7
      user.loginStreak   = newStreak;
      user.lastLoginDate = now;
      await user.save();

      const { user: updated, tx } = await addCoins(me, task.coins, `Day ${task.streakDay} Login Streak`, "bonus", `streak:day${task.streakDay}:${today.toISOString().slice(0,10)}`);
      io.to(`user:${me}`).emit("wallet_update", { coins: updated.coins, tx });
      return res.json({ coins: updated.coins, tx, message: `+${task.coins} 🪙 Day ${task.streakDay} claimed!`, newStreak });
    }

    /* ── regular task ── */
    if (task.cooldownHours > 0) {
      const last = await Transaction.findOne({ username: me, ref: `task:${task.id}` }).sort({ createdAt: -1 });
      if (last) {
        const elapsed = (Date.now() - new Date(last.createdAt).getTime()) / 3600000;
        if (elapsed < task.cooldownHours) {
          const next = new Date(new Date(last.createdAt).getTime() + task.cooldownHours * 3600000);
          return res.status(400).json({ message: `Task available again at ${next.toLocaleTimeString()}` });
        }
      }
    } else {
      const done = await Transaction.findOne({ username: me, ref: `task:${task.id}` });
      if (done) return res.status(400).json({ message: "Task already completed" });
    }

    const { user, tx } = await addCoins(me, task.coins, task.title, task.category, `task:${task.id}`);
    io.to(`user:${me}`).emit("wallet_update", { coins: user.coins, tx });
    res.json({ coins: user.coins, tx, message: `+${task.coins} 🪙 earned!` });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* transfer coins to another user */
app.post("/wallet/transfer", verifyToken, async (req, res) => {
  try {
    const { toUsername, amount, note } = req.body;
    const coins = parseInt(amount);
    if (!toUsername || isNaN(coins) || coins <= 0)
      return res.status(400).json({ message: "Invalid transfer details" });

    const sender   = await User.findById(req.user.id);
    const receiver = await User.findOne({ username: toUsername });
    if (!receiver) return res.status(404).json({ message: "User not found" });
    if (sender.coins < coins) return res.status(400).json({ message: "Insufficient coins" });

    const desc = note ? `Transfer to @${toUsername}: ${note}` : `Transfer to @${toUsername}`;
    await addCoins(req.user.username, -coins, desc, "transfer");
    const { user: recv, tx: recvTx } = await addCoins(toUsername, coins, `Transfer from @${req.user.username}`, "transfer");

    const updatedSender = await User.findById(req.user.id);
    io.to(`user:${toUsername}`).emit("wallet_update", { coins: recv.coins, tx: recvTx });

    res.json({ coins: updatedSender.coins, message: `Sent ${coins} 🪙 to @${toUsername}` });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ══════════════════════════════════════════════════════
   SOCIAL / DIRECT CHAT ROUTES
══════════════════════════════════════════════════════ */

/* search users */
app.get("/social/search", verifyToken, async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json([]);
    const users = await User.find({
      username: { $not: /^__reg_/ },
      $or: [
        { username: { $regex: q, $options: "i" } },
        { name:     { $regex: q, $options: "i" } },
      ],
      username: { $ne: req.user.username },
    }).select("username name avatar university course year idVerified").limit(20);
    res.json(users);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* nearby users — same university */
app.get("/social/nearby", verifyToken, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("university");
    if (!me.university) return res.json([]);
    const users = await User.find({
      university: me.university,
      username: { $ne: req.user.username, $not: /^__reg_/ },
    }).select("username name avatar university course year idVerified").limit(30);
    res.json(users);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* public profile of any user */
app.get("/social/user/:username", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("username name avatar university course branch year semester bio role idVerified coins createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ── FRIENDSHIP ── */
app.post("/social/friend-request/:username", verifyToken, async (req, res) => {
  try {
    const to = req.params.username;
    if (to === req.user.username) return res.status(400).json({ message: "Cannot add yourself" });
    const exists = await Friendship.findOne({ from: req.user.username, to });
    if (exists) return res.status(400).json({ message: "Request already sent" });
    await Friendship.create({ from: req.user.username, to });
    res.json({ message: "Friend request sent" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.put("/social/friend-request/:from/:action", verifyToken, async (req, res) => {
  try {
    const { from, action } = req.params;
    if (!["accepted","rejected"].includes(action)) return res.status(400).json({ message: "Invalid action" });
    const req2 = await Friendship.findOneAndUpdate(
      { from, to: req.user.username, status: "pending" },
      { status: action }, { new: true }
    );
    if (!req2) return res.status(404).json({ message: "Request not found" });
    res.json(req2);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.get("/social/friends", verifyToken, async (req, res) => {
  try {
    const me = req.user.username;
    const accepted = await Friendship.find({
      status: "accepted",
      $or: [{ from: me }, { to: me }],
    });
    const usernames = accepted.map(f => f.from === me ? f.to : f.from);
    const users = await User.find({ username: { $in: usernames } })
      .select("username name avatar university course idVerified");
    const pending = await Friendship.find({ to: me, status: "pending" });
    const pendingUsers = await User.find({ username: { $in: pending.map(p => p.from) } })
      .select("username name avatar university");
    res.json({ friends: users, pendingRequests: pendingUsers });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* friendship status with a specific user */
app.get("/social/friend-status/:username", verifyToken, async (req, res) => {
  try {
    const me = req.user.username;
    const other = req.params.username;
    const f = await Friendship.findOne({
      $or: [{ from: me, to: other }, { from: other, to: me }],
    });
    res.json({ status: f?.status || "none", direction: f?.from === me ? "sent" : "received" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ── DIRECT MESSAGES ── */
function convKey(a, b) { return [a, b].sort().join("::"); }

async function getOrCreateConv(u1, u2) {
  const participants = [u1, u2].sort();
  let conv = await DirectConversation.findOne({ participants });
  if (!conv) conv = await DirectConversation.create({ participants, unread: { [u1]: 0, [u2]: 0 } });
  return conv;
}

/* get all DM conversations */
app.get("/dm/conversations", verifyToken, async (req, res) => {
  try {
    const me = req.user.username;
    const convs = await DirectConversation.find({ participants: me }).sort({ lastAt: -1 });
    const result = await Promise.all(convs.map(async c => {
      const other = c.participants.find(p => p !== me);
      const user  = await User.findOne({ username: other }).select("username name avatar university");
      const unread = c.unread?.get ? (c.unread.get(me) || 0) : (c.unread?.[me] || 0);
      return { convId: c._id, other, user, lastMessage: c.lastMessage, lastAt: c.lastAt, unread };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* get messages in a DM conversation */
app.get("/dm/:username", verifyToken, async (req, res) => {
  try {
    const conv = await getOrCreateConv(req.user.username, req.params.username);
    const msgs = await DirectMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 });
    /* mark as read */
    conv.unread.set(req.user.username, 0);
    await conv.save();
    const otherUser = await User.findOne({ username: req.params.username })
      .select("username name avatar university course year bio idVerified");
    res.json({ conv, messages: msgs, otherUser });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* send a DM — requires accepted friendship OR sender initiating (goes to requests) */
app.post("/dm/:username", verifyToken, async (req, res) => {
  try {
    const { text, type, image } = req.body;
    const other = req.params.username;
    const me    = req.user.username;

    /* check friendship */
    const friendship = await Friendship.findOne({
      $or: [{ from: me, to: other }, { from: other, to: me }],
    });
    const isAccepted = friendship?.status === "accepted";
    const isPending  = friendship?.status === "pending";

    /* if no friendship at all, auto-create a pending request when first message is sent */
    if (!friendship) {
      await Friendship.create({ from: me, to: other });
    }

    const conv = await getOrCreateConv(me, other);

    let msg;
    if (type === "image") {
      if (!image) return res.status(400).json({ message: "Image required" });
      msg = await DirectMessage.create({ conversationId: conv._id, sender: me, type: "image", image, isRequest: !isAccepted });
    } else {
      if (!text?.trim()) return res.status(400).json({ message: "Message required" });
      msg = await DirectMessage.create({ conversationId: conv._id, sender: me, type: "text", text: text.trim(), isRequest: !isAccepted });
    }

    conv.lastMessage = type === "image" ? "📷 Photo" : text?.trim() || "";
    conv.lastAt = new Date();
    const otherUnread = (conv.unread.get ? (conv.unread.get(other) || 0) : (conv.unread?.[other] || 0)) + 1;
    conv.unread.set(other, otherUnread);
    conv.isRequest = !isAccepted; // mark conv as request if not friends
    await conv.save();

    io.to(`user:${me}`).emit("dm_message", { msg, convId: conv._id, other });
    io.to(`user:${other}`).emit("dm_message", { msg, convId: conv._id, other: me });
    io.to(`user:${other}`).emit("dm_unread_update", { from: me, count: otherUnread });

    res.json({ msg, isRequest: !isAccepted });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* accept message request — marks friendship as accepted + conv as not request */
app.post("/dm/:username/accept", verifyToken, async (req, res) => {
  try {
    const me = req.user.username;
    const other = req.params.username;
    await Friendship.findOneAndUpdate(
      { from: other, to: me, status: "pending" },
      { status: "accepted" }
    );
    const conv = await getOrCreateConv(me, other);
    conv.isRequest = false;
    await conv.save();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* decline message request */
app.post("/dm/:username/decline", verifyToken, async (req, res) => {
  try {
    const me = req.user.username;
    const other = req.params.username;
    await Friendship.findOneAndUpdate(
      { from: other, to: me, status: "pending" },
      { status: "rejected" }
    );
    const conv = await DirectConversation.findOne({ participants: [me, other].sort() });
    if (conv) { await DirectMessage.deleteMany({ conversationId: conv._id }); await conv.deleteOne(); }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});
app.get("/dm/unread/count", verifyToken, async (req, res) => {
  try {
    const me = req.user.username;
    const convs = await DirectConversation.find({ participants: me });
    const total = convs.reduce((a, c) => {
      const n = c.unread?.get ? (c.unread.get(me) || 0) : (c.unread?.[me] || 0);
      return a + n;
    }, 0);
    res.json({ total });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ══════════════════════════════════════════════════════
   ACCOUNT DELETE ROUTES
══════════════════════════════════════════════════════ */

/* student requests account deletion */
app.post("/auth/delete-request", verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const existing = await DeleteRequest.findOne({ username: req.user.username });
    if (existing && existing.status === "pending")
      return res.status(400).json({ message: "You already have a pending delete request." });

    await DeleteRequest.findOneAndUpdate(
      { username: req.user.username },
      { username: req.user.username, reason: reason || "", status: "pending", adminNote: "" },
      { upsert: true, new: true }
    );
    res.json({ message: "Delete request submitted. Admin will review within 24 hours." });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* student cancels their delete request */
app.delete("/auth/delete-request", verifyToken, async (req, res) => {
  try {
    await DeleteRequest.deleteOne({ username: req.user.username, status: "pending" });
    res.json({ message: "Delete request cancelled." });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* get own delete request status */
app.get("/auth/delete-request", verifyToken, async (req, res) => {
  try {
    const req2 = await DeleteRequest.findOne({ username: req.user.username });
    res.json(req2 || null);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* admin — all delete requests */
app.get("/admin/delete-requests", verifyToken, adminOnly, async (req, res) => {
  try {
    const reqs = await DeleteRequest.find().sort({ createdAt: -1 });
    res.json(reqs);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* admin approves — actually deletes the account */
app.put("/admin/delete-requests/:username/approve", verifyToken, adminOnly, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    /* delete all user data */
    await Promise.all([
      User.deleteOne({ username }),
      Request.deleteMany({ ownerUsername: username }),
      Transaction.deleteMany({ username }),
      CoinDeposit.deleteMany({ username }),
      DeleteRequest.deleteOne({ username }),
      Friendship.deleteMany({ $or: [{ from: username }, { to: username }] }),
      DirectConversation.deleteMany({ participants: username }),
    ]);

    res.json({ message: `Account @${username} deleted successfully.` });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* admin rejects */
app.put("/admin/delete-requests/:username/reject", verifyToken, adminOnly, async (req, res) => {
  try {
    const { username } = req.params;
    const { note } = req.body;
    await DeleteRequest.findOneAndUpdate({ username }, { status: "rejected", adminNote: note || "" });
    res.json({ message: `Delete request for @${username} rejected.` });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ══════════════════════════════════════════════════════
   FACULTY ROUTES
══════════════════════════════════════════════════════ */

/* faculty JWT middleware */
function verifyFaculty(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    if (decoded.role !== "faculty") return res.status(403).json({ message: "Faculty only" });
    req.faculty = decoded;
    next();
  } catch { res.status(401).json({ message: "Invalid token" }); }
}

/* admin creates a faculty account — sends welcome email with credentials */
app.post("/admin/faculty", verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, facultyId, password, email, department, university, subjects, classes } = req.body;
    if (!name || !facultyId || !password) return res.status(400).json({ message: "Name, ID and password required" });
    if (!email) return res.status(400).json({ message: "Faculty email required" });

    const existsId    = await Faculty.findOne({ facultyId });
    if (existsId)    return res.status(400).json({ message: "Faculty ID already exists" });
    const existsEmail = await Faculty.findOne({ email });
    if (existsEmail) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const faculty = await Faculty.create({
      name, facultyId, password: hashed, email,
      department, university,
      subjects: subjects || [],
      classes:  classes  || [],
    });

    // send welcome email with login credentials
    if (emailReady) {
      const classLines = (classes || []).map(c =>
        [c.course, c.branch, c.year && `Year ${c.year}`, c.semester && `Sem ${c.semester}`, c.section && `Sec ${c.section}`]
          .filter(Boolean).join(" · ")
      );
      const classHtml = classLines.length
        ? `<div style="margin-top:10px"><span style="color:rgba(255,255,255,0.4);font-size:12px;text-transform:uppercase">Assigned Classes</span><br>${classLines.map(l => `<span style="font-size:13px">• ${l}</span>`).join("<br>")}</div>`
        : "";
      await transporter.sendMail({
        from: `"CampUs 🎓" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Your CampUs Faculty Account is Ready",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a1a;color:#fff;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.1)">
            <div style="font-size:32px;margin-bottom:8px">👨‍🏫</div>
            <h2 style="margin:0 0 4px;color:#22d3ee">Welcome to CampUs, ${name}!</h2>
            <p style="color:rgba(255,255,255,0.5);margin:0 0 24px;font-size:14px">Your faculty account has been created. Use the credentials below to log in.</p>
            <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:20px">
              <div style="margin-bottom:14px">
                <span style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px">Faculty ID</span><br>
                <strong style="font-size:22px;letter-spacing:3px;color:#22d3ee">${facultyId}</strong>
              </div>
              <div style="margin-bottom:14px">
                <span style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:1px">Password</span><br>
                <strong style="font-size:16px;font-family:monospace;background:rgba(255,255,255,0.08);padding:4px 10px;border-radius:6px">${password}</strong>
              </div>
              ${department ? `<div style="margin-bottom:8px"><span style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase">Department</span><br><span>${department}</span></div>` : ""}
              ${university ? `<div style="margin-bottom:8px"><span style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase">University</span><br><span>${university}</span></div>` : ""}
              ${classHtml}
            </div>
            <a href="${process.env.APP_URL || "http://localhost:5173"}/faculty" style="display:block;text-align:center;background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#fff;text-decoration:none;padding:13px;border-radius:10px;font-weight:700;font-size:15px">Login to Faculty Portal →</a>
            <p style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:16px;text-align:center">Please keep these credentials safe. Contact your admin to reset your password.</p>
          </div>
        `
      });
    }

    res.json({ ...faculty.toObject(), password: undefined });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* admin lists all faculty */
app.get("/admin/faculty", verifyToken, adminOnly, async (req, res) => {
  try {
    const list = await Faculty.find().select("-password").sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* admin updates faculty (including classes) */
app.put("/admin/faculty/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, email, department, university, subjects, active, password, classes, emailVerified } = req.body;
    const update = {};
    if (name        !== undefined) update.name        = name;
    if (email       !== undefined) update.email       = email;
    if (department  !== undefined) update.department  = department;
    if (university  !== undefined) update.university  = university;
    if (subjects    !== undefined) update.subjects    = subjects;
    if (active      !== undefined) update.active      = active;
    if (classes     !== undefined) update.classes     = classes;
    if (emailVerified !== undefined) update.emailVerified = emailVerified;
    if (password) update.password = await bcrypt.hash(password, 10);
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    res.json(faculty);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* admin deletes faculty */
app.delete("/admin/faculty/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ message: "Faculty deleted" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* faculty login */
app.post("/faculty/login", async (req, res) => {
  try {
    const { facultyId, password } = req.body;
    if (!facultyId || !password) return res.status(400).json({ message: "ID/Email and password required" });
    // allow login with either facultyId OR email
    const faculty = await Faculty.findOne({
      $or: [{ facultyId }, { email: facultyId }]
    });
    if (!faculty) return res.status(401).json({ message: "Invalid credentials" });
    if (!faculty.active) return res.status(403).json({ message: "Account disabled. Contact admin." });
    const match = await bcrypt.compare(password, faculty.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: faculty._id, facultyId: faculty.facultyId, name: faculty.name, role: "faculty",
        university: faculty.university, department: faculty.department, classes: faculty.classes },
      process.env.JWT_SECRET, { expiresIn: "12h" }
    );
    res.json({ token, faculty: { ...faculty.toObject(), password: undefined } });
  } catch (err) { res.status(500).json({ message: "Login failed" }); }
});

/* faculty — get own profile */
app.get("/faculty/me", verifyFaculty, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id).select("-password");
    res.json(faculty);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* faculty — send OTP to own email for verification */
app.post("/faculty/send-verify-otp", verifyFaculty, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (faculty.emailVerified) return res.status(400).json({ message: "Email already verified" });
    if (!faculty.email) return res.status(400).json({ message: "No email on file. Contact admin." });

    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    faculty.otpCode   = otp;
    faculty.otpExpiry = expiry;
    await faculty.save();

    const sent = await sendOtpEmail(faculty.email, otp);
    if (!sent) return res.status(500).json({ message: "Failed to send OTP. Check email config." });
    res.json({ message: `OTP sent to ${faculty.email}` });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* faculty — verify OTP and mark email as verified */
app.post("/faculty/verify-email", verifyFaculty, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP required" });
    const faculty = await Faculty.findById(req.faculty.id);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (faculty.emailVerified) return res.status(400).json({ message: "Already verified" });
    if (!faculty.otpCode) return res.status(400).json({ message: "No OTP sent. Request one first." });
    if (new Date() > faculty.otpExpiry) {
      faculty.otpCode = null; faculty.otpExpiry = null; await faculty.save();
      return res.status(400).json({ message: "OTP expired. Request a new one." });
    }
    if (faculty.otpCode !== otp.trim()) return res.status(400).json({ message: "Incorrect OTP" });

    faculty.emailVerified = true;
    faculty.otpCode   = null;
    faculty.otpExpiry = null;
    await faculty.save();
    res.json({ message: "Email verified successfully" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* faculty — get students in their assigned classes */
app.get("/faculty/students", verifyFaculty, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id).select("university classes");
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    const filter = { university: faculty.university };
    if (faculty.classes?.length > 0) {
      // match students in any of the faculty's assigned classes
      filter.$or = faculty.classes.map(cls => {
        const cond = {};
        if (cls.course)   cond.course   = cls.course;
        if (cls.branch)   cond.branch   = cls.branch;
        if (cls.year)     cond.year     = cls.year;
        if (cls.semester) cond.semester = cls.semester;
        return cond;
      });
    }

    const students = await User.find(filter)
      .select("name username email rollNo course branch year semester avatar idVerified")
      .sort({ name: 1 })
      .limit(500);
    res.json(students);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* faculty — post content (assignment, timetable, notice, result, material) */
app.post("/faculty/content", verifyFaculty, async (req, res) => {
  try {
    const { type, subject, title, description, dueDate, data, fileUrl, course, branch, year, semester, section } = req.body;
    if (!type || !title) return res.status(400).json({ message: "Type and title required" });
    const content = await FacultyContent.create({
      type, subject, title, description, dueDate, data, fileUrl,
      facultyId:   req.faculty.facultyId,
      facultyName: req.faculty.name,
      university:  req.faculty.university,
      department:  req.faculty.department,
      course:   course   || "",
      branch:   branch   || "",
      year:     year     || "",
      semester: semester || "",
      section:  section  || "",
    });
    res.json(content);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* faculty — get own content */
app.get("/faculty/content", verifyFaculty, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { facultyId: req.faculty.facultyId };
    if (type) filter.type = type;
    const content = await FacultyContent.find(filter).sort({ createdAt: -1 });
    res.json(content);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* faculty — update content */
app.put("/faculty/content/:id", verifyFaculty, async (req, res) => {
  try {
    const item = await FacultyContent.findOne({ _id: req.params.id, facultyId: req.faculty.facultyId });
    if (!item) return res.status(404).json({ message: "Not found" });
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* faculty — delete content */
app.delete("/faculty/content/:id", verifyFaculty, async (req, res) => {
  try {
    await FacultyContent.findOneAndDelete({ _id: req.params.id, facultyId: req.faculty.facultyId });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* students — get faculty content matching their class profile */
app.get("/student/faculty-content", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("university course branch year semester");
    const { type } = req.query;
    const filter = { visible: true };

    // must match university
    if (user?.university) filter.university = user.university;

    // class-level matching: if content has class fields set, student must match
    // if content fields are empty ("") it means broadcast to whole university
    const classConditions = [];

    // content with no class targeting (broadcast) — all empty fields
    classConditions.push({ course: "", branch: "", year: "", semester: "" });

    // content targeted to student's exact class
    if (user?.course || user?.branch || user?.year || user?.semester) {
      const exact = {};
      if (user.course)   exact.course   = user.course;
      if (user.branch)   exact.branch   = user.branch;
      if (user.year)     exact.year     = user.year;
      if (user.semester) exact.semester = user.semester;
      classConditions.push(exact);
    }

    filter.$or = classConditions;
    if (type) filter.type = type;

    const content = await FacultyContent.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(content);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

/* ─── START ─── */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`\n🚀 CampUs running → http://localhost:${PORT}\n`));