const Booking = require("../models/Booking");
const User = require("../models/User");

exports.getUserSummary = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const totalBookings = await Booking.countDocuments({ userId: user._id });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyBookings = await Booking.countDocuments({
      userId: user._id,
      date: { $gte: startOfMonth, $lte: now },
    });

    const services = await Booking.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalBookings,
      monthlyBookings,
      topServices: services,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate report" });
  }
};
