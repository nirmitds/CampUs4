const mongoose = require("mongoose");

// A "class" assignment — faculty can teach multiple classes
const classSchema = new mongoose.Schema({
  course:   { type: String, default: "" }, // e.g. B.Tech
  branch:   { type: String, default: "" }, // e.g. CSE
  year:     { type: String, default: "" }, // e.g. 2
  semester: { type: String, default: "" }, // e.g. 3
  section:  { type: String, default: "" }, // e.g. A
}, { _id: false });

const facultySchema = new mongoose.Schema({
  name:       { type: String, required: true },
  facultyId:  { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  email:      { type: String, default: "", unique: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  otpCode:    { type: String, default: null },
  otpExpiry:  { type: Date,   default: null },
  department: { type: String, default: "" },
  university: { type: String, default: "" },
  subjects:   [{ type: String }],
  classes:    [classSchema],
  active:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Faculty", facultySchema);
