const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  name: { type: String, required: true }, // نام طرح
  description: String, // توضیحات
  price: { type: Number, required: true }, // قیمت
  duration: { type: Number, required: true }, // مدت زمان به روز
  features: [String], // ویژگی‌های طرح
  isActive: { type: Boolean, default: true }, // فعال بودن طرح
  maxBookings: { type: Number, default: 100 }, // حداکثر تعداد نوبت
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Plan", planSchema);
