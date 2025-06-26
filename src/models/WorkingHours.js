const mongoose = require("mongoose");

const workingHoursSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  workingDays: [{
    day: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      required: true
    },
    isActive: { type: Boolean, default: true },
    startTime: { type: String, required: true }, // "08:00"
    endTime: { type: String, required: true },   // "18:00"
    breakTimes: [{
      startTime: { type: String, required: true }, // "12:00"
      endTime: { type: String, required: true }    // "13:00"
    }]
  }],
  slotDuration: { type: Number, default: 30 }, // فاصله بین نوبت‌ها (دقیقه)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WorkingHours", workingHoursSchema);