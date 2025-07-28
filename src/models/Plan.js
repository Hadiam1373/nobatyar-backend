const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  name: { type: String, required: true }, // نام طرح
  description: String, // توضیحات
  price: { type: Number, required: true }, // قیمت
  duration: { type: Number, required: true }, // مدت زمان به روز
  features: [String], // ویژگی‌های طرح
  isActive: { type: Boolean, default: true }, // فعال بودن طرح
  maxBookings: { type: Number, default: 100 }, // حداکثر تعداد نوبت
  maxServices: { type: Number, default: 5 }, // حداکثر تعداد سرویس
  maxApiCalls: { type: Number, default: 1000 }, // حداکثر تعداد API calls در روز
  maxReports: { type: Number, default: 10 }, // حداکثر تعداد گزارش در روز
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Plan", planSchema);
