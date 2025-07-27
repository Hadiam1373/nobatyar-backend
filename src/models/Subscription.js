const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paymentId: String, // شناسه پرداخت
  refId: String, // شناسه مرجع زرین‌پال
  amount: { type: Number, required: true }, // مبلغ پرداختی
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
