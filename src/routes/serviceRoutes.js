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

    const { name, duration, price, city, neighborhood } = req.body;

    const service = await Service.create({
      userId: user._id,
      name,
      duration,
      price,
      city,
      neighborhood,
    });

    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: "Failed to create service" });
  }
});

// جستجوی سرویس‌ها بر اساس شهر و محله
router.get("/search/location", async (req, res) => {
  try {
    const { city, neighborhood } = req.query;
    
    let query = {};
    if (city) {
      query.city = { $regex: city, $options: 'i' }; // جستجوی case-insensitive
    }
    if (neighborhood) {
      query.neighborhood = { $regex: neighborhood, $options: 'i' };
    }

    const services = await Service.find(query)
      .populate('userId', 'username name phone') // اطلاعات کاربر صاحب سرویس
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to search services" });
  }
});

// دریافت لیست شهرها
router.get("/cities/list", async (req, res) => {
  try {
    const cities = await Service.distinct('city');
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

// تست - دریافت همه سرویس‌ها
router.get("/test/all", async (req, res) => {
  try {
    const services = await Service.find({}).populate('userId', 'username name phone');
    res.json({
      count: services.length,
      services: services
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all services" });
  }
});

// دریافت لیست محلات یک شهر
router.get("/neighborhoods/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const neighborhoods = await Service.distinct('neighborhood', { city: { $regex: city, $options: 'i' } });
    res.json(neighborhoods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch neighborhoods" });
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

router.delete("/:username/:serviceId", async (req, res) => {
  try {
    const { username, serviceId } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const service = await Service.findOneAndDelete({
      _id: serviceId,
      userId: user._id,
    });
    if (!service) return res.status(404).json({ error: "Service not found" });

    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete service" });
  }
});

module.exports = router;
