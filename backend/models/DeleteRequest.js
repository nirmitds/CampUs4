const mongoose = require("mongoose");

const deleteRequestSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  reason:   { type: String, default: "" },
  status:   { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  adminNote:{ type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("DeleteRequest", deleteRequestSchema);
