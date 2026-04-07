const mongoose = require("mongoose");

const txSchema = new mongoose.Schema({
  username:    { type: String, required: true, index: true },
  type:        { type: String, enum: ["credit", "debit"], required: true },
  amount:      { type: Number, required: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ["bonus", "exchange", "task", "survey", "transfer", "penalty"], default: "bonus" },
  ref:         { type: String, default: null }, // optional reference id
}, { timestamps: true });

module.exports = mongoose.model("Transaction", txSchema);
