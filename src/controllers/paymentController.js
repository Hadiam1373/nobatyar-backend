require("dotenv").config();
const ZarinpalCheckout = require("zarinpal-checkout");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const Plan = require("../models/Plan");

console.log("ZarinpalCheckout:", ZarinpalCheckout);
// تنظیمات زرین‌پال
const zarinpal = ZarinpalCheckout.create(
  "123e4567-e89b-12d3-a456-426614174000",
  true
); // true برای sandbox

console.log("MerchantID:", "123e4567-e89b-12d3-a456-426614174000");
console.log("Zarinpal instance:", zarinpal);
console.log(
  "Available methods:",
  Object.getOwnPropertyNames(Object.getPrototypeOf(zarinpal))
);

// ایجاد درخواست پرداخت
exports.createPayment = async (req, res) => {
  try {
    const { planId } = req.body;

    // بررسی وجود طرح
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "طرح یافت نشد" });
    }

    // بررسی وجود اشتراک فعال
    const existingSubscription = await Subscription.findOne({
      userId: req.user.id,
      status: "active",
      paymentStatus: "completed",
    });

    if (existingSubscription) {
      return res.status(400).json({ message: "شما قبلاً اشتراک فعال دارید" });
    }

    // دریافت اطلاعات کاربر
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    // ایجاد درخواست پرداخت
    console.log("Creating payment request for amount:", plan.price);

    // استفاده از متد صحیح زرین‌پال
    const response = await zarinpal.PaymentRequest({
      Amount: plan.price,
      CallbackURL: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/payment/verify`,
      Description: `خرید اشتراک ${plan.name} - ${
        user.businessName || user.name
      }`,
      Email: user.email,
      Mobile: user.phone,
    });

    if (response.status === 100) {
      // محاسبه تاریخ شروع و پایان اشتراک
      const startDate = new Date();
      const endDate = new Date(
        startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000
      );

      // ذخیره اطلاعات پرداخت در دیتابیس
      const subscription = new Subscription({
        userId: req.user.id,
        planId,
        paymentId: response.authority,
        amount: plan.price,
        paymentStatus: "pending",
        startDate,
        endDate,
      });

      await subscription.save();

      res.json({
        success: true,
        paymentUrl: response.url,
        authority: response.authority,
        subscriptionId: subscription._id,
      });
    } else {
      res.status(400).json({
        message: "خطا در ایجاد درخواست پرداخت",
        error: response.error,
      });
    }
  } catch (error) {
    console.error("خطا در ایجاد پرداخت:", error);
    res.status(500).json({ message: "خطا در ایجاد درخواست پرداخت" });
  }
};

// تایید پرداخت
exports.verifyPayment = async (req, res) => {
  try {
    const { authority, status } = req.query;

    if (status !== "OK") {
      return res.status(400).json({ message: "پرداخت ناموفق بود" });
    }

    // پیدا کردن اشتراک
    const subscription = await Subscription.findOne({
      paymentId: authority,
      paymentStatus: "pending",
    }).populate("planId");

    if (!subscription) {
      return res.status(404).json({ message: "اشتراک یافت نشد" });
    }

    // تایید پرداخت در زرین‌پال
    const verification = await zarinpal.PaymentVerification({
      Amount: subscription.amount,
      Authority: authority,
    });

    if (verification.status === 100) {
      // بروزرسانی وضعیت اشتراک
      const startDate = new Date();
      const endDate = new Date(
        startDate.getTime() + subscription.planId.duration * 24 * 60 * 60 * 1000
      );

      subscription.status = "active";
      subscription.paymentStatus = "completed";
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.refId = verification.ref_id;

      await subscription.save();

      // بروزرسانی وضعیت کاربر
      await User.findByIdAndUpdate(subscription.userId, {
        subscriptionStatus: "active",
        currentSubscriptionId: subscription._id,
      });

      res.json({
        success: true,
        message: "پرداخت با موفقیت انجام شد",
        subscription: subscription,
      });
    } else {
      // بروزرسانی وضعیت به failed
      subscription.paymentStatus = "failed";
      await subscription.save();

      res.status(400).json({
        message: "تایید پرداخت ناموفق بود",
        error: verification.error,
      });
    }
  } catch (error) {
    console.error("خطا در تایید پرداخت:", error);
    res.status(500).json({ message: "خطا در تایید پرداخت" });
  }
};

// بررسی وضعیت پرداخت
exports.getPaymentStatus = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId: req.user.id,
    }).populate("planId");

    if (!subscription) {
      return res.status(404).json({ message: "اشتراک یافت نشد" });
    }

    res.json({
      subscription,
      isActive: subscription.status === "active",
      isPending: subscription.paymentStatus === "pending",
    });
  } catch (error) {
    console.error("خطا در بررسی وضعیت پرداخت:", error);
    res.status(500).json({ message: "خطا در بررسی وضعیت پرداخت" });
  }
};
