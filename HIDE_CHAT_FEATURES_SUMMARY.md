# 🔒 Hidden Chats Feature - Complete Implementation

## Overview
A comprehensive hidden chats system with password protection and OTP-based password recovery.

---

## Features Implemented

### 1. Hide Chats
- Click "Hide" button on any chat in Messages
- Chat is removed from normal list
- Only accessible with password

### 2. View Hidden Chats
- Enter hide password in Messages search bar
- Click "🔓 Unlock" button
- New "🔒 Hidden" tab appears
- Shows all hidden chats

### 3. Unhide Chats
- Click "Unhide" button on any hidden chat
- Chat returns to normal list

### 4. Password Management (Settings → Privacy)

#### A. Initial Setup
- Set hide password (minimum 4 characters)
- Password is required to access hidden chats

#### B. Update Password
- Click "Update Password"
- Enter old password
- Enter new password
- Click "Update"

#### C. Forgot Password (OTP Reset)
- Click "Forgot Password?"
- Click "Send OTP"
- Check email for 6-digit code
- Enter OTP
- Enter new password
- Click "Reset Password"

---

## How to Use

### Step 1: Set Hide Password
1. Login to your account
2. Go to **Settings** (gear icon in sidebar)
3. Click **Privacy** tab
4. Find "🔐 Hidden Chats Password" section
5. Enter a password (min 4 characters)
6. Click "Set Password"

### Step 2: Hide a Chat
1. Go to **Messages** (💬 in sidebar)
2. Hover over any chat
3. Click the "Hide" button that appears
4. Confirm the action
5. Chat disappears from list

### Step 3: Access Hidden Chats
1. Go to **Messages**
2. In the search bar, enter your hide password
3. Click "🔓 Unlock" or press Enter
4. A new "🔒 Hidden" tab appears
5. Click on any hidden chat to open it

### Step 4: Unhide a Chat
1. Access hidden chats (Step 3)
2. Click "Unhide" button on any chat
3. Chat returns to normal list

### Step 5: Reset Password (If Forgotten)
1. Go to **Settings → Privacy**
2. Click "Forgot Password?"
3. Click "Send OTP"
4. Check your email for 6-digit code
5. Enter the OTP
6. Enter new password
7. Click "Reset Password"

---

## API Endpoints

### Backend Routes

```javascript
// Set/Update hide password
PUT /auth/hide-password
Body: { hidePassword, oldPassword? }

// Send OTP for password reset
POST /auth/hide-password/send-otp
Headers: Authorization: Bearer <token>

// Reset password with OTP
POST /auth/hide-password/reset
Body: { otp, newPassword }

// Hide a chat
PUT /dm/:username/hide
Headers: Authorization: Bearer <token>

// Unhide a chat
PUT /dm/:username/unhide
Headers: Authorization: Bearer <token>

// Verify password and get hidden chats
POST /dm/hidden/verify
Body: { password }
```

---

## Database Schema

### User Model
```javascript
{
  hidePassword: String,  // Hide chats password
  otpCode: String,       // Temporary OTP for reset
  otpExpiry: Date        // OTP expiration time
}
```

### DirectConversation Model
```javascript
{
  participants: [String],
  hiddenFor: [String],   // Array of usernames who hid this chat
  lastMessage: Mixed,
  lastAt: Date,
  unread: Map,
  isRequest: Boolean
}
```

---

## Security Features

- ✅ Password required to access hidden chats
- ✅ OTP expires in 10 minutes
- ✅ Old password required to update
- ✅ Email verification for password reset
- ✅ Hidden chats filtered server-side
- ✅ JWT authentication required for all operations

---

## Troubleshooting

### OTP Not Received?
1. Check spam/junk folder
2. Check backend console for OTP (development mode)
3. Check browser console (shows OTP if email fails)
4. Verify email configuration in `.env`:
   - MAIL_HOST=smtp.gmail.com
   - MAIL_PORT=587
   - MAIL_USER=your_email@gmail.com
   - MAIL_PASS=your_app_password

### Can't Hide Chat?
1. Ensure conversation exists (send at least one message)
2. Check browser console for errors
3. Verify backend is running

### Hidden Chats Not Showing?
1. Ensure you entered correct password
2. Check if you actually hid any chats
3. Try refreshing the page

---

## Development Notes

### Email Configuration
The system uses Gmail SMTP. For production:
1. Enable 2FA on Gmail account
2. Generate App Password
3. Add to `.env` file

### OTP Development Mode
If email fails, OTP is shown in:
- Backend console logs
- Frontend browser console
- Error message (development only)

### Testing
1. Set hide password in Settings
2. Hide a chat in Messages
3. Verify chat disappears
4. Enter password to view hidden chats
5. Test OTP reset flow

---

## Future Enhancements

- [ ] Biometric authentication option
- [ ] Auto-hide after inactivity
- [ ] Hide password strength indicator
- [ ] Multiple hide password profiles
- [ ] Scheduled auto-unhide
- [ ] Hide password hints

---

## Support

For issues or questions:
1. Check backend console logs
2. Check browser console
3. Verify email configuration
4. Ensure all dependencies are installed

---

**Built with ❤️ for CampUs**
