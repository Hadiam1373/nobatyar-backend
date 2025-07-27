const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const authMiddleware = require("../middlewares/authMiddleware");

// همه مسیرها نیاز به احراز هویت دارند
router.use(authMiddleware);

// تست route برای debug
router.get("/test", (req, res) => {
  res.json({
    message: "Auth working",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// دریافت اشتراک فعلی کاربر
router.get("/current", subscriptionController.getUserSubscription);

// ایجاد اشتراک جدید
router.post("/", subscriptionController.createSubscription);

// تمدید اشتراک
router.post("/renew", subscriptionController.renewSubscription);

// لغو اشتراک
router.post("/cancel", subscriptionController.cancelSubscription);

// دریافت تاریخچه اشتراک‌ها
router.get("/history", subscriptionController.getSubscriptionHistory);

module.exports = router;
