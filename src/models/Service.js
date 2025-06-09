const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  duration: { type: Number, default: 60 },
  price: { type: Number, default: 0 },
});

module.exports = mongoose.model("Service", serviceSchema);
