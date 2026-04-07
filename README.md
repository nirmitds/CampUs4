# 🎓 CampUs — Student Campus Platform

> A full-stack, real-time campus platform connecting university students through academic tools, peer-to-peer exchange, social chat, emergency services, and a coin-based reward system.

---

## ✨ Features

### 🔐 Authentication
- Email OTP login via Gmail SMTP
- Password-based login
- 3-step registration with university ID card upload
- Admin portal with separate login at `/admin`

### 🔄 Exchange Marketplace
- Post Sell / Buy / Lend / Borrow requests
- University-first feed (your campus requests shown first)
- Coin-based pricing with bargain system
- One active request per user at a time
- Real-time accept flow with coin deduction

### 💬 Real-time Chat
- Exchange chat (private between request owner & acceptor)
- Social Chat — Instagram-style DMs with message requests
- Typing indicators, photo sharing, read receipts
- Live location sharing during exchange meetups
- Real-time via Socket.IO

### 💰 Wallet & Coins
- Campus coins system (start with 100 coins)
- 7-day login streak with increasing rewards (5→10→15→20→25→30→50🪙)
- Task-based earning (complete profile, post request, add friends, etc.)
- Coin transfer between students
- UPI/QR deposit system with admin approval
- Full transaction history

### 👤 Profile
- Avatar upload with crop/edit
- University, roll number, course, branch, year, semester
- University ID card upload for admin verification
- Profile completion tracker
- Delete account request flow

### 📚 Academic Tools
- Notes (create, pin, color-code, search by subject)
- Assignments tracker
- Weekly timetable
- Results & CGPA
- Doubts Q&A
- Study groups

### 🚨 Emergency
- Campus security contacts
- Medical center info
- Report issue to admin
- Support tickets

### 🌐 Social
- Find nearby students (same university)
- Friend requests (accept/reject)
- Public student profiles
- Message requests (like Instagram)

### 🛡️ Admin Portal (`/admin`)
- Overview stats dashboard
- User management (promote/revoke admin)
- ID card verification (approve/reject with reason)
- Coin deposit requests (approve → auto-credit coins)
- Account delete requests
- Exchange requests overview
- Transaction history (grouped by user)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + React Router v7 |
| Backend | Node.js + Express 5 |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT + bcrypt + Email OTP (Nodemailer) |
| File Storage | Base64 in MongoDB |
| Payments | UPI QR + Admin manual approval |
| Styling | Custom CSS-in-JS (injected styles) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account with App Password

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/campus.git
cd campus
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/campusapp
JWT_SECRET=your_super_secret_key_here
PORT=5000

# Gmail OTP
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_16_char_app_password

# UPI Deposit
UPI_ID=your_upi_id@bank
UPI_NAME=Your Name
QR_IMAGE_URL=https://your-hosted-qr-image.jpg
```

Start backend:
```bash
node server.js
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Create admin account
1. Register a normal account at `/register`
2. Open MongoDB Compass → find your user → change `role` from `"student"` to `"admin"`
3. Go to `/admin` and log in with your credentials

---

## 📁 Project Structure

```
campus/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Request.js
│   │   ├── Message.js
│   │   ├── Transaction.js
│   │   ├── CoinDeposit.js
│   │   ├── DeleteRequest.js
│   │   ├── DirectMessage.js
│   │   ├── Friendship.js
│   │   ├── ChatSeen.js
│   │   └── CoinOrder.js
│   ├── middleware/
│   │   └── Auth.js
│   ├── server.js
│   └── .env
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Auth.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Exchange.jsx
        │   ├── ExchangeChat.jsx
        │   ├── Messages.jsx
        │   ├── SocialChat.jsx
        │   ├── Wallet.jsx
        │   ├── StudentProfile.jsx
        │   ├── Admin.jsx
        │   ├── AdminLogin.jsx
        │   ├── Settings.jsx
        │   └── ... (20+ pages)
        ├── layout/
        │   └── StudentLayout.jsx
        ├── styles/
        │   ├── dashstyles.js
        │   └── authstyles.js
        └── App.jsx
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `PORT` | Backend port (default: 5000) |
| `MAIL_USER` | Gmail address for OTP emails |
| `MAIL_PASS` | Gmail App Password (16 chars) |
| `UPI_ID` | Your UPI ID for coin deposits |
| `UPI_NAME` | Your name shown on payment screen |
| `QR_IMAGE_URL` | URL to your UPI QR code image |

---

## 📱 Mobile Support

- Responsive design for all screen sizes (360px → 1440px+)
- Mobile drawer navigation (hamburger menu)
- Bottom navigation bar on mobile
- Touch-optimized interactions
- PWA-ready structure

---

## 🔒 Security

- JWT authentication with 7-day expiry
- bcrypt password hashing
- Admin-only routes with role verification
- ID card verification before full platform access
- Separate admin token (admins can't access student routes)

---

## 📸 Screenshots

> Add screenshots here after deployment

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Nirmit Dudeja**
- UPI: nirmitdudeja204@okicici
- Built with ❤️ for students

---

> ⭐ Star this repo if you find it useful!
