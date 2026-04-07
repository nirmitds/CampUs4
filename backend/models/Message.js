const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
  sender:    { type: String, required: true },
  type:      { type: String, enum: ["text", "image"], default: "text" },
  text:      { type: String, default: "" },
  image:     { type: String, default: null }, // base64 data URL
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
