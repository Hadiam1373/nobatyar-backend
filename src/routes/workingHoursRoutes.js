const express = require("express");
const router = express.Router();
const WorkingHours = require("../models/WorkingHours");
const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  checkSubscriptionStatus,
} = require("../middlewares/subscriptionMiddleware");

// تنظیم ساعات کاری
router.post(
  "/:username",
  authMiddleware,
  checkSubscriptionStatus,
  async (req, res) => {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "کاربر پیدا نشد" });

      const { workingDays, slotDuration = 30 } = req.body;

      console.log("Received data:", { workingDays, slotDuration }); // Debug log

      // اعتبارسنجی داده‌های ورودی
      if (!workingDays || !Array.isArray(workingDays)) {
        return res
          .status(400)
          .json({ error: "workingDays باید یک آرایه باشد" });
      }

      // اطمینان از آرایه بودن breakTimes برای هر روز
      if (Array.isArray(workingDays)) {
        workingDays.forEach((day) => {
          if (!Array.isArray(day.breakTimes)) {
            day.breakTimes = [];
          }
        });
      }

      const workingHours = await WorkingHours.findOneAndUpdate(
        { userId: user._id },
        {
          workingDays,
          slotDuration,
          updatedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
          runValidators: true, // اجرای validation
        }
      );

      console.log("Saved working hours:", workingHours); // Debug log

      res.json(workingHours);
    } catch (err) {
      console.error("Error setting working hours:", err);
      res.status(500).json({
        error: "خطا در تنظیم ساعات کاری",
        details: err.message,
      });
    }
  }
);

// دریافت ساعات کاری
router.get(
  "/:username",
  authMiddleware,
  checkSubscriptionStatus,
  async (req, res) => {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "کاربر پیدا نشد" });

      console.log("Looking for userId:", user._id); // Debug log

      const workingHours = await WorkingHours.findOne({ userId: user._id });

      console.log("Found working hours:", workingHours); // Debug log

      if (!workingHours) {
        return res.status(404).json({ error: "ساعات کاری تنظیم نشده است" });
      }

      res.json(workingHours);
    } catch (err) {
      console.error("Error fetching working hours:", err);
      res.status(500).json({ error: "دریافت ساعات کاری با خطا مواجه شد" });
    }
  }
);

module.exports = router;
