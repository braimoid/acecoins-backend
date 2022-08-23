const mongoose = require("mongoose");

const AcademySchema = new mongoose.Schema({
  subtitle: String,
  tutor: String,
  title: String,
  content: String,
  plan: Array,
  createdAt: { type: Date, default: Date.now() },
});

mongoose.models = {};
module.exports = mongoose.model("Academy", AcademySchema);