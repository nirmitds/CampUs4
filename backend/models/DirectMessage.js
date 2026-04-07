const mongoose = require("mongoose");

const dmSchema = new mongoose.Schema({
  participants: [{ type: String }],
  lastMessage:  { type: String, default: "" },
  lastAt:       { type: Date, default: Date.now },
  unread:       { type: Map, of: Number, default: {} },
  isRequest:    { type: Boolean, default: false }, // true = pending friend request
}, { timestamps: true });

dmSchema.index({ participants: 1 });

const dmMsgSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "DirectConversation", required: true },
  sender:    { type: String, required: true },
  type:      { type: String, enum: ["text","image"], default: "text" },
  text:      { type: String, default: "" },
  image:     { type: String, default: null },
  isRequest: { type: Boolean, default: false },
}, { timestamps: true });

dmMsgSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = {
  DirectConversation: mongoose.model("DirectConversation", dmSchema),
  DirectMessage:      mongoose.model("DirectMessage",      dmMsgSchema),
};
