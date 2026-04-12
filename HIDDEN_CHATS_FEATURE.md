# 🔒 Hidden Chats Feature

## Overview
Users can now hide sensitive chats and access them only by entering a password in the Messages search bar.

## How It Works

### 1. Set Hide Password
- Go to **Settings → Privacy**
- Enter a password (minimum 4 characters) in the "Hidden Chats Password" section
- Click "Set Password"

### 2. Hide a Chat
- In the Messages list, hover over any chat
- Click the "Hide" button that appears
- The chat will be removed from your main chat list

### 3. Access Hidden Chats
- Go to Messages page
- In the search bar (on Chats or Requests tab), enter your hide password
- Click "🔓 Unlock" or press Enter
- A new "🔒 Hidden" tab will appear showing all your hidden chats
- You can click on any hidden chat to open it
- Click "Unhide" to restore it to your main chat list

## Features
- ✅ Password-protected hidden chats
- ✅ Hidden chats are completely invisible until password is entered
- ✅ Each user has their own unique hide password
- ✅ Easy unhide functionality
- ✅ Hidden chats maintain unread counts
- ✅ Works for both Social Chat and Exchange Chat

## Backend Changes
- Added `hidePassword` field to User model
- Added `/auth/hide-password` PUT route to set password
- Added `/dm/hidden/verify` POST route to verify password and get hidden chats
- Added `/dm/:username/unhide` PUT route to unhide chats
- Existing `/dm/:username/hide` route already supported hiding

## Frontend Changes
- Updated `SocialChat.jsx` with hidden chats UI
- Updated `Settings.jsx` with hide password setting
- Added password input in Messages search bar
- Added "Hidden" tab that appears after password verification
- Added unhide button for each hidden chat

## Security
- Password is stored in plain text (consider bcrypt hashing for production)
- Hidden chats are filtered server-side
- Only the user who hid the chat can see it after entering password
