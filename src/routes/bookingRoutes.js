const express = require("express");
const Booking = require("../models/Booking");
const User = require("../models/User");
const router = express.Router();
const Service = require("../models/Service");

router.post("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, phone, serviceId, date } = req.body;

    // پیدا کردن سرویس از روی serviceId
    const service = await Service.findOne({ _id: serviceId, userId: user._id });
    if (!service) return res.status(404).json({ error: "Service not found" });

    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + service.duration * 60000);

    // چک تداخل زمانی
    const conflict = await Booking.findOne({
      userId: user._id,
      date: { $lt: endDate },
      $expr: {
        $gt: [
          { $add: ["$date", { $multiply: ["$duration", 60000] }] },
          startDate,
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({ error: "Time slot is already booked." });
    }

    const booking = await Booking.create({
      userId: user._id,
      name,
      phone,
      service: service.name,
      date: startDate,
      duration: service.duration,
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: "Booking creation failed" });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { date } = req.query;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    let query = { userId: user._id };

    if (date) {
      // تاریخ شروع روز (00:00)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      // تاریخ پایان روز (23:59:59)
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const bookings = await Booking.find(query).sort({ date: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.delete("/:username/:bookingId", async (req, res) => {
  try {
    const { username, bookingId } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const booking = await Booking.findOneAndDelete({
      _id: bookingId,
      userId: user._id,
    });

    if (!booking) {
      return res
        .status(404)
        .json({ error: "Booking not found or unauthorized" });
    }

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

router.put("/:username/:bookingId", async (req, res) => {
  try {
    const { username, bookingId } = req.params;
    const { name, phone, service, date, duration } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + (duration || 60) * 60000);

    // بررسی تداخل
    const conflict = await Booking.findOne({
      _id: { $ne: bookingId }, // نوبت خودش حساب نشه
      userId: user._id,
      date: { $lt: endDate },
      $expr: {
        $gt: [
          { $add: ["$date", { $multiply: ["$duration", 60000] }] },
          startDate,
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({ error: "Time slot is already booked." });
    }

    const updated = await Booking.findOneAndUpdate(
      { _id: bookingId, userId: user._id },
      {
        name,
        phone,
        service,
        date: startDate,
        duration: duration || 60,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Booking not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update booking" });
  }
});

module.exports = router;
