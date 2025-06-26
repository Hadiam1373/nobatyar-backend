const express = require("express");
const router = express.Router();
const WorkingHours = require("../models/WorkingHours");
const User = require("../models/User");

// تنظیم ساعات کاری
router.post("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { workingDays, slotDuration = 30 } = req.body;

    const workingHours = await WorkingHours.findOneAndUpdate(
      { userId: user._id },
      { 
        workingDays, 
        slotDuration,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json(workingHours);
  } catch (err) {
    console.error("Error setting working hours:", err);
    res.status(500).json({ error: "Failed to set working hours" });
  }
});

// دریافت ساعات کاری
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const workingHours = await WorkingHours.findOne({ userId: user._id });
    
    if (!workingHours) {
      return res.status(404).json({ error: "Working hours not set" });
    }

    res.json(workingHours);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch working hours" });
  }
});

module.exports = router;