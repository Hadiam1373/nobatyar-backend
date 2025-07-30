const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  checkSubscriptionStatus,
  checkServiceLimit,
} = require("../middlewares/subscriptionMiddleware");

// ایجاد سرویس جدید
router.post(
  "/:username",
  authMiddleware,
  checkSubscriptionStatus,
  checkServiceLimit,
  async (req, res) => {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "کاربر پیدا نشد" });

      const {
        name,
        duration,
        price,
        address,
        phone,
        city,
        neighborhood,
        allNeighborhoods,
      } = req.body;

      const service = await Service.create({
        userId: user._id,
        name,
        duration,
        price,
        address,
        phone,
        city: city || undefined,
        neighborhood: neighborhood || undefined,
        allNeighborhoods: !!allNeighborhoods,
      });

      res.status(201).json(service);
    } catch (err) {
      res.status(500).json({ error: "ایجاد سرویس با خطا مواجه شد" });
    }
  }
);

// جستجوی سرویس‌ها بر اساس شهر و محله
router.get("/search/location", async (req, res) => {
  try {
    const { city, neighborhood } = req.query;

    let query = {};
    if (city) {
      query.city = { $regex: city, $options: "i" }; // جستجوی case-insensitive
    }
    if (neighborhood) {
      query.$or = [
        { neighborhood: { $regex: neighborhood, $options: "i" } },
        { allNeighborhoods: true },
      ];
    }

    const services = await Service.find(query)
      .populate("userId", "username name phone") // اطلاعات کاربر صاحب سرویس
      .sort({ createdAt: -1 });

    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "جستجوی سرویس‌ها با خطا مواجه شد" });
  }
});

// دریافت لیست شهرها
router.get("/cities/list", async (req, res) => {
  try {
    const cities = await Service.distinct("city");
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: "دریافت شهرها با خطا مواجه شد" });
  }
});

// تست - دریافت همه سرویس‌ها
router.get("/test/all", async (req, res) => {
  try {
    const services = await Service.find({}).populate(
      "userId",
      "username name phone"
    );
    res.json({
      count: services.length,
      services: services,
    });
  } catch (err) {
    res.status(500).json({ error: "دریافت همه سرویس‌ها با خطا مواجه شد" });
  }
});

// دریافت لیست محلات یک شهر
router.get("/neighborhoods/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const neighborhoods = await Service.distinct("neighborhood", {
      city: { $regex: city, $options: "i" },
    });
    res.json(neighborhoods);
  } catch (err) {
    res.status(500).json({ error: "دریافت محله‌ها با خطا مواجه شد" });
  }
});

// دریافت لیست سرویس‌ها
router.get(
  "/:username",
  authMiddleware,
  checkSubscriptionStatus,
  async (req, res) => {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "کاربر پیدا نشد" });

      const services = await Service.find({ userId: user._id });
      res.json(services);
    } catch (err) {
      res.status(500).json({ error: "دریافت سرویس‌ها با خطا مواجه شد" });
    }
  }
);

router.delete(
  "/:username/:serviceId",
  authMiddleware,
  checkSubscriptionStatus,
  async (req, res) => {
    try {
      const { username, serviceId } = req.params;
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "کاربر پیدا نشد" });

      const service = await Service.findOneAndDelete({
        _id: serviceId,
        userId: user._id,
      });
      if (!service) return res.status(404).json({ error: "سرویس پیدا نشد" });

      res.json({ message: "Service deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: "حذف سرویس با خطا مواجه شد" });
    }
  }
);

// API مخصوص سایت - دریافت همه سرویس‌های عمومی
router.get("/site/public", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      city,
      neighborhood,
      search,
      sort = "newest", // newest, oldest, name
    } = req.query;

    let query = {};

    // فیلتر بر اساس شهر
    if (city) {
      query.city = { $regex: city, $options: "i" };
    }

    // فیلتر بر اساس محله
    if (neighborhood) {
      query.$or = [
        { neighborhood: { $regex: neighborhood, $options: "i" } },
        { allNeighborhoods: true },
      ];
    }

    // جستجو در نام سرویس
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // محاسبه skip برای pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // تعیین sort
    let sortOption = {};
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "name":
        sortOption = { name: 1 };
        break;
      default: // newest
        sortOption = { createdAt: -1 };
    }

    // دریافت سرویس‌ها با pagination
    const services = await Service.find(query)
      .populate("userId", "username name phone businessName")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    // تعداد کل سرویس‌ها برای pagination
    const total = await Service.countDocuments(query);

    res.json({
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Error fetching public services:", err);
    res.status(500).json({ error: "دریافت سرویس‌ها با خطا مواجه شد" });
  }
});

// دریافت جزئیات یک سرویس خاص
router.get("/site/service/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId).populate(
      "userId",
      "username name phone businessName"
    );

    if (!service) {
      return res.status(404).json({ error: "سرویس پیدا نشد" });
    }

    res.json(service);
  } catch (err) {
    console.error("Error fetching service details:", err);
    res.status(500).json({ error: "دریافت جزئیات سرویس با خطا مواجه شد" });
  }
});

module.exports = router;
