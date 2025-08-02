const mongoose = require("mongoose");
const Plan = require("../src/models/Plan");

// اتصال به دیتابیس
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const defaultPlans = [
  {
    name: "طرح پایه",
    description: "مناسب برای کسب‌وکارهای کوچک",
    price: 200000, // 50 هزار تومان
    duration: 30, // 30 روز
    features: [
      "حداکثر 50 نوبت در ماه",
      "حداکثر 3 سرویس",
      "مدیریت سرویس‌ها",
      "گزارش‌گیری پایه",
      "پشتیبانی ایمیلی",
    ],
    maxBookings: 50,
    maxServices: 3,
    maxApiCalls: 500,
    maxReports: 5,
    isActive: true,
  },
  {
    name: "طرح حرفه‌ای",
    description: "مناسب برای کسب‌وکارهای متوسط",
    price: 300000, // 150 هزار تومان
    duration: 30, // 30 روز
    features: [
      "حداکثر 200 نوبت در ماه",
      "حداکثر 10 سرویس",
      "مدیریت سرویس‌ها",
      "گزارش‌گیری پیشرفته",
      "پشتیبانی تلفنی",
      "ارسال پیامک خودکار",
    ],
    maxBookings: 200,
    maxServices: 10,
    maxApiCalls: 2000,
    maxReports: 20,
    isActive: true,
  },
  {
    name: "طرح ویژه",
    description: "مناسب برای کسب‌وکارهای بزرگ",
    price: 500000, // 500 هزار تومان
    duration: 30, // 30 روز
    features: [
      "نوبت نامحدود",
      "سرویس نامحدود",
      "مدیریت سرویس‌ها",
      "گزارش‌گیری کامل",
      "پشتیبانی 24/7",
      "ارسال پیامک خودکار",
      "API دسترسی",
      "پشتیبان شخصی",
    ],
    maxBookings: 999999, // نامحدود
    maxServices: 999999, // نامحدود
    maxApiCalls: 999999, // نامحدود
    maxReports: 999999, // نامحدود
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
