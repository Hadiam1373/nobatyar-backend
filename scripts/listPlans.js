const mongoose = require("mongoose");
const Plan = require("../src/models/Plan");

// اتصال به دیتابیس
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function listPlans() {
  try {
    console.log("=== لیست تمام طرح‌ها ===\n");

    const plans = await Plan.find({}).sort({ price: 1 });

    if (plans.length === 0) {
      console.log("هیچ طرحی در دیتابیس یافت نشد.");
      return;
    }

    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   قیمت: ${plan.price.toLocaleString()} تومان`);
      console.log(`   مدت: ${plan.duration} روز`);
      console.log(`   وضعیت: ${plan.isActive ? "فعال" : "غیرفعال"}`);
      console.log(`   حداکثر نوبت: ${plan.maxBookings}`);
      console.log(`   حداکثر سرویس: ${plan.maxServices}`);
      console.log(`   توضیحات: ${plan.description || "بدون توضیحات"}`);

      if (plan.features && plan.features.length > 0) {
        console.log("   ویژگی‌ها:");
        plan.features.forEach((feature) => {
          console.log(`     - ${feature}`);
        });
      }

      console.log(
        `   تاریخ ایجاد: ${plan.createdAt.toLocaleDateString("fa-IR")}`
      );
      console.log("   " + "=".repeat(50));
    });

    console.log(`\nمجموع ${plans.length} طرح یافت شد.`);
  } catch (error) {
    console.error("❌ خطا در دریافت لیست طرح‌ها:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

// اجرای اسکریپت
listPlans();
