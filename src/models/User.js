const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  name: String,
  email: { type: String, unique: true, required: true },
  phone: String,
  passwordHash: String,
  businessName: String,
  role: {
    type: String,
    enum: ["admin", "business_owner", "site_user"],
    default: "business_owner",
  },
  subscriptionStatus: {
    type: String,
    enum: ["trial", "active", "expired"],
    default: "trial",
  },
  trialEndDate: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }, // 30 روز
  currentSubscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
