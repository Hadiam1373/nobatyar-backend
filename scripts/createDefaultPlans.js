const mongoose = require("mongoose");
const Plan = require("../src/models/Plan");

// اتصال به دیتابیس
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/nobatchi",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const defaultPlans = [
  {
    name: "طرح پایه",
    description: "مناسب برای کسب‌وکارهای کوچک",
    price: 200000, // 50 هزار تومان
    duration: 30, // 30 روز
    features: [
      "حداکثر 50 نوبت در ماه",
      "مدیریت سرویس‌ها",
      "گزارش‌گیری پایه",
      "پشتیبانی ایمیلی",
    ],
    maxBookings: 50,
    isActive: true,
  },
  {
    name: "طرح حرفه‌ای",
    description: "مناسب برای کسب‌وکارهای متوسط",
    price: 300000, // 150 هزار تومان
    duration: 30, // 30 روز
    features: [
      "حداکثر 200 نوبت در ماه",
      "مدیریت سرویس‌ها",
      "گزارش‌گیری پیشرفته",
      "پشتیبانی تلفنی",
      "ارسال پیامک خودکار",
    ],
    maxBookings: 200,
    isActive: true,
  },
  {
    name: "طرح ویژه",
    description: "مناسب برای کسب‌وکارهای بزرگ",
    price: 500000, // 500 هزار تومان
    duration: 30, // 30 روز
    features: [
      "نوبت نامحدود",
      "مدیریت سرویس‌ها",
      "گزارش‌گیری کامل",
      "پشتیبانی 24/7",
      "ارسال پیامک خودکار",
      "API دسترسی",
      "پشتیبان شخصی",
    ],
    maxBookings: 999999, // نامحدود
    isActive: true,
  },
];

async function createDefaultPlans() {
  try {
    console.log("شروع ایجاد طرح‌های پیش‌فرض...");

    // حذف طرح‌های موجود
    await Plan.deleteMany({});
    console.log("طرح‌های قبلی حذف شدند.");

    // ایجاد طرح‌های جدید
    const createdPlans = await Plan.insertMany(defaultPlans);
    console.log(`${createdPlans.length} طرح با موفقیت ایجاد شدند:`);

    createdPlans.forEach((plan) => {
      console.log(`- ${plan.name}: ${plan.price.toLocaleString()} تومان`);
    });

    console.log("عملیات با موفقیت انجام شد.");
  } catch (error) {
    console.error("خطا در ایجاد طرح‌ها:", error);
  } finally {
    mongoose.connection.close();
  }
}

// اجرای اسکریپت
createDefaultPlans();
