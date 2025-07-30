const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 10, // حداکثر 10 درخواست در بازه
  message: {
    error: "تعداد تلاش بیش از حد مجاز. لطفاً بعداً دوباره تلاش کنید.",
  },
});

// ثبت‌نام برای سایت نوبت‌یار (کاربران عادی)
router.post(
  "/register",
  authLimiter,
  [
    body("name").notEmpty().withMessage("نام الزامی است."),
    body("email").isEmail().withMessage("ایمیل معتبر وارد کنید."),
    body("phone")
      .isMobilePhone("fa-IR")
      .withMessage("شماره موبایل معتبر وارد کنید."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("رمز عبور باید حداقل ۶ کاراکتر باشد."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, email, phone, password } = req.body;

      // چک ایمیل تکراری
      if (await User.findOne({ email })) {
        return res
          .status(400)
          .json({ error: "کاربری با این ایمیل قبلاً ثبت شده است." });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // ایجاد username منحصر به فرد
      const baseUsername = name.replace(/\s+/g, "").toLowerCase();
      let username = baseUsername;
      let counter = 1;

      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      const user = await User.create({
        username,
        name,
        email,
        phone,
        passwordHash,
        role: "site_user", // نقش مخصوص سایت
        subscriptionStatus: "trial",
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 روز
      });

      res.status(201).json({
        message: "ثبت‌نام با موفقیت انجام شد",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "خطا در ثبت‌نام" });
    }
  }
);

// ورود برای سایت نوبت‌یار
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("ایمیل معتبر وارد کنید."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("رمز عبور باید حداقل ۶ کاراکتر باشد."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است." });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role || "site_user",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      res.json({
        message: "ورود موفقیت‌آمیز بود",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          subscriptionStatus: user.subscriptionStatus,
          trialEndDate: user.trialEndDate,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "خطا در ورود" });
    }
  }
);

// بررسی وضعیت کاربر
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "توکن احراز هویت یافت نشد" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subscriptionStatus: user.subscriptionStatus,
        trialEndDate: user.trialEndDate,
      },
    });
  } catch (err) {
    console.error("Auth check error:", err);
    res.status(401).json({ error: "توکن نامعتبر است" });
  }
});

module.exports = router;
