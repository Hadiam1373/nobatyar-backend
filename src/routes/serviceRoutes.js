const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const User = require("../models/User");

// ایجاد سرویس جدید
router.post("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, duration, price } = req.body;

    const service = await Service.create({
      userId: user._id,
      name,
      duration,
      price,
    });

    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: "Failed to create service" });
  }
});

// دریافت لیست سرویس‌ها
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const services = await Service.find({ userId: user._id });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

module.exports = router;
