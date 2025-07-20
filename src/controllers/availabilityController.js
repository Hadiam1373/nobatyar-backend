 const Booking = require("../models/Booking");
const WorkingHours = require("../models/WorkingHours");
const Service = require("../models/Service");
const mongoose = require("mongoose");

// Helper: تبدیل hh:mm به دقیقه از 00:00
function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Helper: تولید بازه‌های زمانی بین دو زمان با slotDuration
function generateSlots(start, end, slotDuration) {
  const slots = [];
  for (let t = start; t + slotDuration <= end; t += slotDuration) {
    slots.push(t);
  }
  return slots;
}

exports.getAvailability = async (req, res) => {
  try {
    const { userId, date, serviceId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    if (!date) return res.status(400).json({ error: "date is required" });
    if (!serviceId) return res.status(400).json({ error: "serviceId is required" });

    const objectUserId = new mongoose.Types.ObjectId(userId);
    const workingHours = await WorkingHours.findOne({ userId: objectUserId });
    if (!workingHours) return res.status(404).json({ error: "Working hours not found" });

    // دریافت مدت زمان سرویس
    const service = await Service.findOne({ _id: serviceId, userId: objectUserId });
    if (!service) return res.status(404).json({ error: "Service not found" });
    const serviceDuration = Number(service.duration) || 60;

    let disabledHours = [];
    let hasAvailableTime = false;
    const d = new Date(date);
    const weekDay = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][d.getDay()];
    const dayObj = workingHours.workingDays.find(wd => wd.day === weekDay);
    if (!dayObj || !dayObj.isActive) {
      disabledHours = "all";
      hasAvailableTime = false;
    } else {
      const start = timeToMinutes(dayObj.startTime);
      const end = timeToMinutes(dayObj.endTime);
      // دریافت رزروهای آن روز
      const startOfDay = new Date(date);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23,59,59,999);
      const bookings = await Booking.find({
        userId: objectUserId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: "cancelled" }
      });
      // slotها را با گام 10 دقیقه‌ای بساز (کل روز)
      const slotStep = 10; // دقیقه
      const allDaySlots = generateSlots(0, 24*60, slotStep);
      let availableSlots = [];
      for (const t of allDaySlots) {
        // فقط slotهایی که تا پایان سرویس در بازه کاری جا می‌شوند
        if (t < start || t + serviceDuration > end) continue;
        // تداخل با استراحت
        let inBreak = false;
        for (const brk of dayObj.breakTimes) {
          const brkStart = timeToMinutes(brk.startTime);
          const brkEnd = timeToMinutes(brk.endTime);
          if (t < brkEnd && (t + serviceDuration) > brkStart) {
            inBreak = true;
            break;
          }
        }
        if (inBreak) continue;
        // تداخل با رزروها
        let inBooking = false;
        for (const booking of bookings) {
          const bookingStart = booking.date.getHours() * 60 + booking.date.getMinutes();
          const bookingEnd = bookingStart + (booking.duration || 60);
          if (t < bookingEnd && (t + serviceDuration) > bookingStart) {
            inBooking = true;
            break;
          }
        }
        if (inBooking) continue;
        availableSlots.push(t);
      }
      // disabledHours: همه slotهای شروع روز منهای availableSlots
      disabledHours = allDaySlots.filter(t => !availableSlots.includes(t)).map(t => {
        const h = Math.floor(t/60).toString().padStart(2,'0');
        const m = (t%60).toString().padStart(2,'0');
        return `${h}:${m}`;
      });
      hasAvailableTime = availableSlots.length > 0;
    }
    res.json({
      disabledHours,
      hasAvailableTime
    });
  } catch (err) {
    console.error("Error in getAvailability:", err);
    res.status(500).json({ error: "Failed to get availability" });
  }
};
