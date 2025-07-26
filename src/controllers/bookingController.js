const Booking = require("../models/Booking");
const User = require("../models/User");
const Service = require("../models/Service");
// const sendSMS = require("../utils/sms");

exports.createBooking = async (req, res) => {
  try {
    const { name, phone, serviceId, date } = req.body;
    
    // پیدا کردن سرویس از روی serviceId
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "سرویس پیدا نشد" });
    }

    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + service.duration * 60000); // استفاده از duration سرویس

    // جستجوی نوبت‌هایی که با بازه جدید تداخل دارند
    const conflict = await Booking.findOne({
      userId: service.userId, // چک تداخل برای همان کاربر صاحب سرویس
      date: { $lt: endDate },
      $expr: {
        $gt: [
          { $add: ["$date", { $multiply: ["$duration", 60000] }] },
          startDate,
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({ error: "این زمان قبلاً رزرو شده است." });
    }

    const booking = await Booking.create({
      userId: service.userId, // استفاده از userId سرویس
      name,
      phone,
      service: service.name, // استفاده از نام سرویس
      date: startDate,
      duration: service.duration, // استفاده از duration سرویس
    });
    
    res.status(201).json(booking);
    // await sendSMS(
    //   phone,
    //   name,
    //   startDate.toLocaleDateString("fa-IR"),
    //   startDate.toLocaleTimeString("fa-IR", {
    //     hour: "2-digit",
    //     minute: "2-digit",
    //   })
    // );
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "ایجاد نوبت با خطا مواجه شد" });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId }).sort({
      date: 1,
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "دریافت نوبت‌ها با خطا مواجه شد" });
  }
};

exports.getBookingsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "تاریخ الزامی است" });

    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const bookings = await Booking.find({
      userId: req.userId,
      date: { $gte: start, $lt: end }
    }).sort({ date: 1 });
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "دریافت نوبت‌ها با خطا مواجه شد" });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "نوبت پیدا نشد" });
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ error: "حذف نوبت با خطا مواجه شد" });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "وضعیت نامعتبر است" });
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "نوبت پیدا نشد" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "بروزرسانی وضعیت با خطا مواجه شد" });
  }
};
