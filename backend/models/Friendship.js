const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema({
  from:   { type: String, required: true }, // username who sent request
  to:     { type: String, required: true }, // username who received
  status: { type: String, enum: ["pending","accepted","rejected"], default: "pending" },
}, { timestamps: true });

friendSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model("Friendship", friendSchema);
