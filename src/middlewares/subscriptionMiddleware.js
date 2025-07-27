const User = require("../models/User");
const Subscription = require("../models/Subscription");

// بررسی وضعیت اشتراک کاربر
exports.checkSubscriptionStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    // اگر کاربر در حالت trial است
    if (user.subscriptionStatus === "trial") {
      // بررسی انقضای trial
      if (new Date() > user.trialEndDate) {
        // trial منقضی شده
        await User.findByIdAndUpdate(user._id, {
          subscriptionStatus: "expired",
        });
        return res.status(403).json({
          message: "دوره آزمایشی شما منقضی شده است. لطفاً اشتراک تهیه کنید.",
          subscriptionRequired: true,
        });
      }
      // trial هنوز فعال است
      return next();
    }

    // اگر کاربر اشتراک فعال دارد
    if (user.subscriptionStatus === "active" && user.currentSubscriptionId) {
      const subscription = await Subscription.findById(
        user.currentSubscriptionId
      );

      if (!subscription || subscription.status !== "active") {
        // اشتراک منقضی شده
        await User.findByIdAndUpdate(user._id, {
          subscriptionStatus: "expired",
        });
        return res.status(403).json({
          message: "اشتراک شما منقضی شده است. لطفاً تمدید کنید.",
          subscriptionRequired: true,
        });
      }

      // بررسی تاریخ انقضا
      if (new Date() > subscription.endDate) {
        await Subscription.findByIdAndUpdate(subscription._id, {
          status: "expired",
        });
        await User.findByIdAndUpdate(user._id, {
          subscriptionStatus: "expired",
        });
        return res.status(403).json({
          message: "اشتراک شما منقضی شده است. لطفاً تمدید کنید.",
          subscriptionRequired: true,
        });
      }

      return next();
    }

    // کاربر اشتراک ندارد
    return res.status(403).json({
      message: "برای استفاده از این سرویس نیاز به اشتراک دارید.",
      subscriptionRequired: true,
    });
  } catch (error) {
    console.error("خطا در بررسی وضعیت اشتراک:", error);
    return res.status(500).json({ message: "خطا در بررسی وضعیت اشتراک" });
  }
};

// بررسی محدودیت تعداد نوبت‌ها
exports.checkBookingLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "currentSubscriptionId"
    );

    if (!user || !user.currentSubscriptionId) {
      return res.status(403).json({ message: "اشتراک فعال یافت نشد" });
    }

    const subscription = user.currentSubscriptionId;
    const plan = subscription.planId;

    // شمارش نوبت‌های امروز
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBookings = await require("../models/Booking").countDocuments({
      userId: user._id,
      createdAt: { $gte: today },
    });

    if (todayBookings >= plan.maxBookings) {
      return res.status(403).json({
        message: `شما امروز حداکثر تعداد نوبت مجاز (${plan.maxBookings}) را استفاده کرده‌اید.`,
      });
    }

    next();
  } catch (error) {
    console.error("خطا در بررسی محدودیت نوبت:", error);
    return res.status(500).json({ message: "خطا در بررسی محدودیت نوبت" });
  }
};
