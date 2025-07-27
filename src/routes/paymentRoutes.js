const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middlewares/authMiddleware");

// ایجاد درخواست پرداخت (نیاز به احراز هویت)
router.post("/create", authMiddleware, paymentController.createPayment);

// تایید پرداخت (بدون نیاز به احراز هویت - callback از زرین‌پال)
router.get("/verify", paymentController.verifyPayment);

// بررسی وضعیت پرداخت (نیاز به احراز هویت)
router.get(
  "/status/:subscriptionId",
  authMiddleware,
  paymentController.getPaymentStatus
);

module.exports = router;
