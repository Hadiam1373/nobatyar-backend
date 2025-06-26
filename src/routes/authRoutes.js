// src/routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, name, email, phone, password, businessName } = req.body;

    // چک username تکراری
    if (await User.findOne({ username })) {
      return res.status(400).json({ error: "نام کاربری از قبل  وجود دارد" });
    }

    // چک ایمیل تکراری
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "ایمیل از قبل  وجود دارد" });
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

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res
        .status(401)
        .json({ error: "نام کاربری یا رمز عبور اشتباه است" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res
        .status(401)
        .json({ error: "نام کاربری یا رمز عبور اشتباه است" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
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
