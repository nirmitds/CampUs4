const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name:     { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, default: null },   // null = OTP-only account
  phone:    { type: String, required: true },
  coins:    { type: Number, default: 100 },
  /* login streak */
  loginStreak:     { type: Number, default: 0 },   // current streak day (1-7)
  lastLoginDate:   { type: Date,   default: null }, // last date streak was claimed
  role:     { type: String, default: "student" },

  /* Profile */
  avatar: { type: String, default: null },

  /* Academic info */
  university: { type: String, default: "" },
  rollNo:     { type: String, default: "" },
  course:     { type: String, default: "" },
  branch:     { type: String, default: "" },
  year:       { type: String, default: "" },
  semester:   { type: String, default: "" },
  bio:        { type: String, default: "" },

  /* ID Verification */
  idCard:       { type: String, default: null },  // base64 image
  idVerified:   { type: String, enum: ["none","pending","verified","rejected"], default: "none" },
  idRejectedReason: { type: String, default: "" },

  /* OTP fields */
  otpCode:   { type: String, default: null },
  otpExpiry: { type: Date,   default: null },

  /* Email verification */
  emailVerified: { type: Boolean, default: false },

  /* Hidden chats password */
  hidePassword: { type: String, default: null },

  /* Active sessions — max 2 devices */
  activeSessions: [{
    sessionId: { type: String },
    token:     { type: String },
    device:    { type: String, default: "" },
    model:     { type: String, default: "" },
    browser:   { type: String, default: "" },
    os:        { type: String, default: "" },
    ip:        { type: String, default: "" },
    city:      { type: String, default: "" },
    country:   { type: String, default: "" },
    region:    { type: String, default: "" },
    lat:       { type: Number, default: null },
    lon:       { type: Number, default: null },
    loginAt:   { type: Date,   default: Date.now },
  }],

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);