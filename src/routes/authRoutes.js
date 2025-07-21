// src/routes/authRoutes.js
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
  message: { error: "تعداد تلاش بیش از حد مجاز. لطفاً بعداً دوباره تلاش کنید." }
});

router.post("/register", authLimiter,
  [
    body("username").isLength({ min: 3, max: 32 }).withMessage("نام کاربری باید حداقل ۳ و حداکثر ۳۲ کاراکتر باشد."),
    body("name").notEmpty().withMessage("نام الزامی است."),
    body("email").isEmail().withMessage("ایمیل معتبر وارد کنید."),
    body("phone").isMobilePhone("fa-IR").withMessage("شماره موبایل معتبر وارد کنید."),
    body("password").isLength({ min: 6 }).withMessage("رمز عبور باید حداقل ۶ کاراکتر باشد."),
    body("businessName").optional().isLength({ max: 64 }).withMessage("نام کسب‌وکار حداکثر ۶۴ کاراکتر باشد.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { username, name, email, phone, password, businessName } = req.body;

      // چک username تکراری
      if (await User.findOne({ username })) {
        return res.status(400).json({ error: "ثبت‌نام ناموفق بود. لطفاً اطلاعات را بررسی کنید." });
      }

      // چک ایمیل تکراری
      if (await User.findOne({ email })) {
        return res.status(400).json({ error: "ثبت‌نام ناموفق بود. لطفاً اطلاعات را بررسی کنید." });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        name,
        email,
        phone,
        passwordHash,
        businessName,
      });

      res.status(201).json({ message: "ساخت کاربر با موفقیت انجام شد" });
    } catch (err) {
      res.status(500).json({ error: "ثبت نام کاربر با خطا مواجه شد" });
    }
});

router.post("/login", authLimiter,
  [
    body("email").isEmail().withMessage("ایمیل معتبر وارد کنید."),
    body("password").isLength({ min: 6 }).withMessage("رمز عبور باید حداقل ۶ کاراکتر باشد.")
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
        return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.json({
        token,
        user: {
          userId: user._id,
          username: user.username,
          name: user.name,
          businessName: user.businessName,
        },
      });
    } catch (err) {
      res.status(500).json({ error: "عملیات ورود با خطا مواجه شد" });
    }
});

module.exports = router;
