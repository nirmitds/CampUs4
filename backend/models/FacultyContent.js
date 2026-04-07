const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  type:       { type: String, enum: ["timetable","assignment","notice","result","material"], required: true },
  facultyId:  { type: String, required: true },
  facultyName:{ type: String, default: "" },
  university: { type: String, default: "" },
  department: { type: String, default: "" },
  // class targeting — empty means visible to all in university
  course:     { type: String, default: "" }, // e.g. B.Tech
  branch:     { type: String, default: "" }, // e.g. CSE
  year:       { type: String, default: "" }, // e.g. 2
  semester:   { type: String, default: "" }, // e.g. 3
  section:    { type: String, default: "" }, // e.g. A (optional)
  subject:    { type: String, default: "" },
  title:      { type: String, required: true },
  description:{ type: String, default: "" },
  dueDate:    { type: Date,   default: null },
  data:       { type: mongoose.Schema.Types.Mixed, default: {} },
  fileUrl:    { type: String, default: null },
  visible:    { type: Boolean, default: true },
}, { timestamps: true });

contentSchema.index({ type: 1, university: 1, course: 1, branch: 1, year: 1, semester: 1 });

module.exports = mongoose.model("FacultyContent", contentSchema);
