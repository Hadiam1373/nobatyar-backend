const express = require("express");
const Booking = require("../models/Booking");
const User = require("../models/User");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  checkSubscriptionStatus,
} = require("../middlewares/subscriptionMiddleware");

router.get(
  "/:username",
  authMiddleware,
  checkSubscriptionStatus,
  async (req, res) => {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "کاربر پیدا نشد" });

      const bookings = await Booking.find({ userId: user._id }).sort({
        date: 1,
      });

      res.json({
        user: { username: user.username, businessName: user.businessName },
        bookings,
      });
    } catch (err) {
      res.status(500).json({ error: "دریافت اطلاعات پنل با خطا مواجه شد" });
    }
  }
);

module.exports = router;
