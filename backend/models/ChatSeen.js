const mongoose = require("mongoose");

// tracks the last time a user "saw" messages in a specific chat
const chatSeenSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
  username:  { type: String, required: true },
  seenAt:    { type: Date, default: () => new Date() },
}, { timestamps: false });

chatSeenSchema.index({ requestId: 1, username: 1 }, { unique: true });

module.exports = mongoose.model("ChatSeen", chatSeenSchema);
