const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  type:          { type: String, enum: ["Sell", "Buy", "Lend", "Borrow"], default: "Sell" },
  description:   { type: String, required: true },
  category:      { type: String, default: "General" },
  coins:         { type: Number, default: 0 },
  ownerUsername: { type: String, required: true },
  ownerUniversity: { type: String, default: "" },  // for university-based sorting
  ownerPhone:    { type: String, default: "" },
  status:        { type: String, enum: ["Open", "Accepted", "Closed"], default: "Open" },
  visibility:    { type: String, enum: ["university", "nearby", "all"], default: "university" }, // scope
  acceptedBy:    { type: String, default: null },
  acceptorPhone: { type: String, default: "" },

  /* bargain offer — one active offer at a time */
  bargain: {
    offeredBy: { type: String, default: null },   // username who made the offer
    coins:     { type: Number, default: 0 },
    status:    { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    createdAt: { type: Date },
  },

  /* live location — both users share */
  ownerLocation: {
    lat:       { type: Number, default: null },
    lng:       { type: Number, default: null },
    updatedAt: { type: Date,   default: null },
    sharing:   { type: Boolean, default: false },
  },
  acceptorLocation: {
    lat:       { type: Number, default: null },
    lng:       { type: Number, default: null },
    updatedAt: { type: Date,   default: null },
    sharing:   { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
