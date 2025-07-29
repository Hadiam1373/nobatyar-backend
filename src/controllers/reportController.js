const Booking = require("../models/Booking");
const User = require("../models/User");
const Service = require("../models/Service");

exports.getUserSummary = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "کاربر پیدا نشد" });

    const totalBookings = await Booking.countDocuments({ userId: user._id });

    // آمار ماه جاری
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyBookings = await Booking.countDocuments({
      userId: user._id,
      date: { $gte: startOfMonth, $lte: now },
    });

    // آمار ماه قبل
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevMonthlyBookings = await Booking.countDocuments({
      userId: user._id,
      date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
    });

    // درصد رشد نسبت به ماه قبل
    let monthlyGrowth = 0;
    if (prevMonthlyBookings > 0) {
      monthlyGrowth =
        ((monthlyBookings - prevMonthlyBookings) / prevMonthlyBookings) * 100;
    } else if (monthlyBookings > 0) {
      monthlyGrowth = 100;
    }

    // همه سرویس‌ها
    const allServices = await Service.find({ userId: user._id });

    // تعداد رزرو هر سرویس
    const bookingsByService = await Booking.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: "$service", count: { $sum: 1 } } },
    ]);
    const bookingsMap = new Map(bookingsByService.map((s) => [s._id, s.count]));

    // سرویس‌ها با تعداد رزرو
    const servicesWithCount = allServices.map((service) => ({
      _id: service._id,
      name: service.name,
      count: bookingsMap.get(service.name) || 0,
      price: service.price,
    }));

    // سرویس‌های بدون رزرو
    let noBookingServices;
    if (totalBookings === 0) {
      // اگر هیچ رزروی وجود ندارد، همه سرویس‌ها بدون رزرو هستند
      noBookingServices = allServices.map((service) => ({
        _id: service._id,
        name: service.name,
      }));
    } else {
      // اگر رزرو وجود دارد، فقط سرویس‌هایی که رزرو ندارند را نشان بده
      noBookingServices = servicesWithCount.filter((s) => s.count === 0);
    }

    // بیشترین روز رزرو شده (پیک کاری)
    const peakDayAgg = await Booking.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const peakDay = peakDayAgg[0] || null;

    // تعداد مشتریان یکتا
    const uniqueCustomers = await Booking.distinct("phone", {
      userId: user._id,
    });

    // آمار هفتگی
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    const weeklyAgg = await Booking.aggregate([
      { $match: { userId: user._id, date: { $gte: startOfWeek, $lte: now } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // درآمد کل و درآمد ماه جاری
    let totalIncome = 0;
    let monthlyIncome = 0;
    for (const service of allServices) {
      const count = bookingsMap.get(service.name) || 0;
      totalIncome += count * service.price;
    }
    for (const booking of await Booking.find({
      userId: user._id,
      date: { $gte: startOfMonth, $lte: now },
    })) {
      const service = allServices.find((s) => s.name === booking.service);
      if (service) monthlyIncome += service.price;
    }

    res.json({
      totalBookings,
      monthlyBookings,
      monthlyGrowth: Math.round(monthlyGrowth),
      services: servicesWithCount,
      noBookingServices,
      peakDay,
      uniqueCustomers: uniqueCustomers.length,
      weeklyBookings: weeklyAgg,
      totalIncome,
      monthlyIncome,
    });
  } catch (err) {
    res.status(500).json({ error: "گزارش‌گیری با خطا مواجه شد" });
  }
};
