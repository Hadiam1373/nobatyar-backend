const Plan = require("../models/Plan");

// دریافت همه طرح‌ها
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطا در دریافت طرح‌ها", error: error.message });
  }
};

// دریافت یک طرح خاص
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: "طرح یافت نشد" });
    }
    res.json(plan);
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطا در دریافت طرح", error: error.message });
  }
};

// ایجاد طرح جدید (فقط ادمین)
exports.createPlan = async (req, res) => {
  try {
    const { name, description, price, duration, features, maxBookings } =
      req.body;

    const plan = new Plan({
      name,
      description,
      price,
      duration,
      features,
      maxBookings,
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: "خطا در ایجاد طرح", error: error.message });
  }
};

// بروزرسانی طرح (فقط ادمین)
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!plan) {
      return res.status(404).json({ message: "طرح یافت نشد" });
    }

    res.json(plan);
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطا در بروزرسانی طرح", error: error.message });
  }
};

// حذف طرح (فقط ادمین)
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "طرح یافت نشد" });
    }

    res.json({ message: "طرح با موفقیت حذف شد" });
  } catch (error) {
    res.status(500).json({ message: "خطا در حذف طرح", error: error.message });
  }
};
