const mongoose = require("mongoose");

const breakTimeSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false }); // _id برای subdocument نیاز نیست

const workingDaySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"],
    required: true
  },
  isActive: { type: Boolean, default: true },
  startTime: { 
    type: String, 
    required: function() { return this.isActive; } // فقط وقتی فعال است الزامی
  },
  endTime: { 
    type: String, 
    required: function() { return this.isActive; }
  },
  breakTimes: [breakTimeSchema]
}, { _id: false });

const workingHoursSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  workingDays: [workingDaySchema],
  slotDuration: { type: Number, default: 30 }, // فاصله بین نوبت‌ها (دقیقه)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WorkingHours", workingHoursSchema);