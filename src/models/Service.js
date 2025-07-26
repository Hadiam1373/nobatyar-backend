const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true }, // مدت زمان به دقیقه
  price: { type: Number, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: false },
  neighborhood: { type: String, required: false },
  allNeighborhoods: { type: Boolean, default: false },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Service", serviceSchema);
