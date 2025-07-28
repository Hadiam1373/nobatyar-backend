const Subscription = require("../models/Subscription");
const User = require("../models/User");
const Plan = require("../models/Plan");

// دریافت اشتراک کاربر
exports.getUserSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    // اگر کاربر در حالت trial است
    if (user.subscriptionStatus === "trial") {
      const trialEndDate = new Date(user.trialEndDate);
      const now = new Date();

      if (now > trialEndDate) {
        // trial منقضی شده
        return res.json({
          status: "expired",
          message: "دوره آزمایشی شما منقضی شده است",
          trialEndDate: user.trialEndDate,
        });
      } else {
        // trial هنوز فعال است
        return res.json({
          status: "trial",
          message: "دوره آزمایشی فعال",
          trialEndDate: user.trialEndDate,
          daysRemaining: Math.ceil(
            (trialEndDate - now) / (1000 * 60 * 60 * 24)
          ),
        });
      }
    }

    // اگر کاربر اشتراک فعال دارد
    if (user.subscriptionStatus === "active" && user.currentSubscriptionId) {
      const subscription = await Subscription.findById(
        user.currentSubscriptionId
      ).populate("planId");

      if (!subscription) {
        return res.json({
          status: "expired",
          message: "اشتراک یافت نشد",
        });
      }

      if (subscription.status === "active") {
        return res.json(subscription);
      } else {
        return res.json({
          status: "expired",
          message: "اشتراک شما منقضی شده است",
          subscription: subscription,
        });
      }
    }

    // کاربر هیچ اشتراکی ندارد
    return res.json({
      status: "none",
      message: "هیچ اشتراکی یافت نشد",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطا در دریافت اشتراک", error: error.message });
  }
};

// ایجاد اشتراک جدید
exports.createSubscription = async (req, res) => {
  try {
    const { planId, paymentId } = req.body;

    // بررسی وجود طرح
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "طرح یافت نشد" });
    }

    // بررسی وجود اشتراک فعال
    const existingSubscription = await Subscription.findOne({
      userId: req.user.id,
      status: { $in: ["active", "pending"] },
    });

    if (existingSubscription) {
      return res.status(400).json({ message: "شما قبلاً اشتراک فعال دارید" });
    }

    // محاسبه تاریخ شروع و پایان
    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000
    );

    const subscription = new Subscription({
      userId: req.user.id,
      planId,
      startDate,
      endDate,
      paymentId,
      amount: plan.price,
    });

    await subscription.save();

    // بروزرسانی وضعیت کاربر
    await User.findByIdAndUpdate(req.user.id, {
      subscriptionStatus: "active",
      currentSubscriptionId: subscription._id,
    });

    res.status(201).json(subscription);
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطا در ایجاد اشتراک", error: error.message });
  }
};

// تمدید اشتراک
exports.renewSubscription = async (req, res) => {
  try {
    const { planId, paymentId } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "طرح یافت نشد" });
    }

    // بستن اشتراک قبلی
    await Subscription.updateMany(
      { userId: req.user.id, status: "active" },
      { status: "expired" }
    );

    // ایجاد اشتراک جدید
    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000
    );

    const subscription = new Subscription({
      userId: req.user.id,
      planId,
      startDate,
      endDate,
      paymentId,
      amount: plan.price,
    });

    await subscription.save();

    // بروزرسانی وضعیت کاربر
    await User.findByIdAndUpdate(req.user.id, {
      subscriptionStatus: "active",
      currentSubscriptionId: subscription._id,
    });

    res.json(subscription);
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطا در تمدید اشتراک", error: error.message });
  }
};

// لغو اشتراک
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.user.id, status: "active" },
      { status: "cancelled" },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: "اشتراک فعال یافت نشد" });
    }

    // بروزرسانی وضعیت کاربر
    await User.findByIdAndUpdate(req.user.id, {
      subscriptionStatus: "expired",
    });

    res.json({ message: "اشتراک با موفقیت لغو شد" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطا در لغو اشتراک", error: error.message });
  }
};

// دریافت تاریخچه اشتراک‌ها
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user.id })
      .populate("planId")
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطا در دریافت تاریخچه", error: error.message });
  }
};
