const mongoose = require("mongoose");
const Subscription = require("../src/models/Subscription");
const User = require("../src/models/User");

// اتصال به دیتابیس
mongoose.connect(
  process.env.MONGODB_URI ,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

async function cleanupSubscriptions() {
  try {
    console.log("شروع بررسی و پاکسازی اشتراک‌ها...");

    // 1. نمایش همه اشتراک‌ها
    const allSubscriptions = await Subscription.find({}).populate(
      "userId",
      "username email"
    );
    console.log(`\nتعداد کل اشتراک‌ها: ${allSubscriptions.length}`);

    allSubscriptions.forEach((sub) => {
      console.log(`- ID: ${sub._id}`);
      console.log(`  کاربر: ${sub.userId?.username || "نامشخص"}`);
      console.log(`  وضعیت: ${sub.status}`);
      console.log(`  وضعیت پرداخت: ${sub.paymentStatus}`);
      console.log(`  تاریخ ایجاد: ${sub.createdAt}`);
      console.log("---");
    });

    // 2. پاکسازی اشتراک‌های مشکل‌دار
    // اشتراک‌های active با paymentStatus pending
    const problematicSubscriptions = await Subscription.find({
      $or: [
        { status: "active", paymentStatus: "pending" },
        {
          paymentStatus: "pending",
          createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) },
        },
      ],
    });

    if (problematicSubscriptions.length > 0) {
      console.log(
        `\nپاکسازی ${problematicSubscriptions.length} اشتراک مشکل‌دار...`
      );
      await Subscription.deleteMany({
        _id: { $in: problematicSubscriptions.map((s) => s._id) },
      });
    }

    // 3. بررسی و اصلاح وضعیت کاربران
    const users = await User.find({});
    console.log(`\nبررسی ${users.length} کاربر...`);

    for (const user of users) {
      console.log(`\nکاربر: ${user.username}`);
      console.log(`وضعیت اشتراک: ${user.subscriptionStatus}`);
      console.log(`اشتراک فعلی: ${user.currentSubscriptionId}`);

      // اگر کاربر اشتراک فعال دارد ولی اشتراک وجود ندارد
      if (user.subscriptionStatus === "active" && user.currentSubscriptionId) {
        const subscription = await Subscription.findById(
          user.currentSubscriptionId
        );
        if (!subscription) {
          console.log(
            `  ❌ اشتراک ${user.currentSubscriptionId} وجود ندارد - اصلاح وضعیت کاربر`
          );
          await User.findByIdAndUpdate(user._id, {
            subscriptionStatus: "expired",
            currentSubscriptionId: null,
          });
        } else if (
          subscription.status !== "active" ||
          subscription.paymentStatus !== "completed"
        ) {
          console.log(
            `  ❌ اشتراک ${user.currentSubscriptionId} فعال نیست - اصلاح وضعیت کاربر`
          );
          await User.findByIdAndUpdate(user._id, {
            subscriptionStatus: "expired",
            currentSubscriptionId: null,
          });
        } else {
          console.log(`  ✅ اشتراک فعال است`);
        }
      }
    }

    console.log("\nعملیات پاکسازی با موفقیت انجام شد.");
  } catch (error) {
    console.error("خطا در پاکسازی:", error);
  } finally {
    mongoose.connection.close();
  }
}

// اجرای اسکریپت
cleanupSubscriptions();
