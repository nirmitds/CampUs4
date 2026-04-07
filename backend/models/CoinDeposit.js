const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  username:  { type: String, required: true },
  packageId: { type: String, required: true },
  inr:       { type: Number, required: true },
  coins:     { type: Number, required: true },
  utr:       { type: String, default: "" },        // user enters UTR after paying
  status:    { type: String, enum: ["pending","expired","approved","rejected"], default: "pending" },
  expiresAt: { type: Date,   required: true },      // 5 min from creation
  adminNote: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("CoinDeposit", depositSchema);
