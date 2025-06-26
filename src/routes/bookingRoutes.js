const express = require("express");
const Booking = require("../models/Booking");
const User = require("../models/User");
const router = express.Router();
const Service = require("../models/Service");

// ایجاد نوبت جدید
router.post("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, phone, serviceId, date, time } = req.body; // تاریخ و ساعت جداگانه

    const service = await Service.findOne({ _id: serviceId, userId: user._id });
    if (!service) return res.status(404).json({ error: "Service not found" });

    // ترکیب تاریخ و ساعت
    const [hours, minutes] = time.split(':');
    const startDate = new Date(date);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const endDate = new Date(startDate.getTime() + service.duration * 60000);

    // چک تداخل زمانی
    const conflict = await Booking.findOne({
      userId: user._id,
      date: { $lt: endDate },
      status: { $ne: "cancelled" },
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
    console.error("Error creating booking:", err);
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

const WorkingHours = require("../models/WorkingHours");

// دریافت ساعات خالی با در نظر گیری ساعات کاری
router.get("/:username/available-slots", async (req, res) => {
  try {
    const { username } = req.params;
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({ error: "Date and serviceId are required" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const service = await Service.findOne({ _id: serviceId, userId: user._id });
    if (!service) return res.status(404).json({ error: "Service not found" });

    // دریافت ساعات کاری کاربر
    const workingHours = await WorkingHours.findOne({ userId: user._id });
    if (!workingHours) {
      return res.status(400).json({ error: "Working hours not set. Please set your working hours first." });
    }

    // تشخیص روز هفته
    const targetDate = new Date(date);
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[targetDate.getDay()];

    // پیدا کردن تنظیمات روز مورد نظر
    const daySettings = workingHours.workingDays.find(d => d.day === dayName && d.isActive);
    
    if (!daySettings) {
      return res.json({
        date,
        serviceName: service.name,
        serviceDuration: service.duration,
        availableSlots: [],
        message: "This day is not available for booking"
      });
    }

    // تاریخ شروع و پایان روز
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // دریافت نوبت‌های رزرو شده
    const bookedSlots = await Booking.find({
      userId: user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" }
    }).select('date duration');

    // تولید ساعات کاری بر اساس تنظیمات کاربر
    const workingSlots = generateWorkingSlotsForDay(
      daySettings.startTime,
      daySettings.endTime,
      daySettings.breakTimes,
      workingHours.slotDuration
    );
    
    // فیلتر ساعات خالی
    const availableSlots = workingSlots.filter(timeSlot => {
      const [hours, minutes] = timeSlot.split(':');
      const slotStart = new Date(date);
      slotStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const slotEnd = new Date(slotStart.getTime() + service.duration * 60000);
      
      return !bookedSlots.some(booking => {
        const bookingStart = new Date(booking.date);
        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
        
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });
    });

    res.json({
      date,
      dayName,
      serviceName: service.name,
      serviceDuration: service.duration,
      workingHours: {
        startTime: daySettings.startTime,
        endTime: daySettings.endTime,
        breakTimes: daySettings.breakTimes
      },
      availableSlots
    });

  } catch (err) {
    console.error("Error fetching available slots:", err);
    res.status(500).json({ error: "Failed to fetch available slots" });
  }
});

// تابع تولید ساعات کاری با در نظر گیری استراحت
function generateWorkingSlotsForDay(startTime, endTime, breakTimes, slotDuration) {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    // چک کردن اینکه در زمان استراحت نباشد
    const isInBreakTime = breakTimes.some(breakTime => {
      const [breakStartHour, breakStartMin] = breakTime.startTime.split(':').map(Number);
      const [breakEndHour, breakEndMin] = breakTime.endTime.split(':').map(Number);
      
      const breakStartMinutes = breakStartHour * 60 + breakStartMin;
      const breakEndMinutes = breakEndHour * 60 + breakEndMin;
      
      return minutes >= breakStartMinutes && minutes < breakEndMinutes;
    });
    
    if (!isInBreakTime) {
      slots.push(timeString);
    }
  }
  
  return slots;
}

module.exports = router;
