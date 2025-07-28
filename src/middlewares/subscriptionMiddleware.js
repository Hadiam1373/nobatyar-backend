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
    const user = await User.findById(req.user.id).populate({
      path: "currentSubscriptionId",
      populate: {
        path: "planId",
        model: "Plan",
      },
    });

    if (!user || !user.currentSubscriptionId) {
      return res.status(403).json({ message: "اشتراک فعال یافت نشد" });
    }

    const subscription = user.currentSubscriptionId;
    const plan = subscription.planId;

    if (!plan) {
      return res.status(403).json({ message: "طرح اشتراک یافت نشد" });
    }

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

// بررسی محدودیت تعداد سرویس‌ها
exports.checkServiceLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "currentSubscriptionId",
      populate: {
        path: "planId",
        model: "Plan",
      },
    });

    if (!user || !user.currentSubscriptionId) {
      return res.status(403).json({ message: "اشتراک فعال یافت نشد" });
    }

    const subscription = user.currentSubscriptionId;
    const plan = subscription.planId;

    if (!plan) {
      return res.status(403).json({ message: "طرح اشتراک یافت نشد" });
    }

    // شمارش سرویس‌های موجود
    const serviceCount = await require("../models/Service").countDocuments({
      userId: user._id,
    });

    // محدودیت تعداد سرویس‌ها بر اساس طرح
    const maxServices = plan.maxServices || 5; // پیش‌فرض 5 سرویس

    if (serviceCount >= maxServices) {
      return res.status(403).json({
        message: `شما حداکثر تعداد سرویس مجاز (${maxServices}) را استفاده کرده‌اید.`,
      });
    }

    next();
  } catch (error) {
    console.error("خطا در بررسی محدودیت سرویس:", error);
    return res.status(500).json({ message: "خطا در بررسی محدودیت سرویس" });
  }
};

// بررسی محدودیت تعداد API calls
exports.checkApiCallLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "currentSubscriptionId",
      populate: {
        path: "planId",
        model: "Plan",
      },
    });

    if (!user || !user.currentSubscriptionId) {
      return res.status(403).json({ message: "اشتراک فعال یافت نشد" });
    }

    const subscription = user.currentSubscriptionId;
    const plan = subscription.planId;

    if (!plan) {
      return res.status(403).json({ message: "طرح اشتراک یافت نشد" });
    }

    // شمارش API calls امروز (می‌توانید از Redis یا دیتابیس استفاده کنید)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // اینجا می‌توانید از یک سیستم tracking استفاده کنید
    // فعلاً یک محدودیت ساده اعمال می‌کنیم
    const maxApiCalls = plan.maxApiCalls || 1000; // پیش‌فرض 1000 درخواست در روز

    // برای سادگی، فعلاً این محدودیت را غیرفعال می‌کنیم
    // در آینده می‌توانید از Redis برای tracking استفاده کنید
    next();
  } catch (error) {
    console.error("خطا در بررسی محدودیت API calls:", error);
    return res.status(500).json({ message: "خطا در بررسی محدودیت API calls" });
  }
};

// بررسی محدودیت تعداد گزارش‌ها
exports.checkReportLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "currentSubscriptionId",
      populate: {
        path: "planId",
        model: "Plan",
      },
    });

    if (!user || !user.currentSubscriptionId) {
      return res.status(403).json({ message: "اشتراک فعال یافت نشد" });
    }

    const subscription = user.currentSubscriptionId;
    const plan = subscription.planId;

    if (!plan) {
      return res.status(403).json({ message: "طرح اشتراک یافت نشد" });
    }

    // شمارش گزارش‌های امروز
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // اینجا می‌توانید از یک سیستم tracking برای گزارش‌ها استفاده کنید
    // فعلاً یک محدودیت ساده اعمال می‌کنیم
    const maxReports = plan.maxReports || 10; // پیش‌فرض 10 گزارش در روز

    // برای سادگی، فعلاً این محدودیت را غیرفعال می‌کنیم
    // در آینده می‌توانید از دیتابیس برای tracking استفاده کنید
    next();
  } catch (error) {
    console.error("خطا در بررسی محدودیت گزارش:", error);
    return res.status(500).json({ message: "خطا در بررسی محدودیت گزارش" });
  }
};
