const express = require("express");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const siteAuthRoutes = require("./routes/siteAuthRoutes");
const dotenv = require("dotenv");
const cors = require("cors");
const panelRoutes = require("./routes/panelRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const workingHoursRoutes = require("./routes/workingHoursRoutes");
const planRoutes = require("./routes/planRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const helmet = require("helmet");

dotenv.config();

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://yourdomain.com",
      "http://localhost:5000",
      "http: //localhost:3001",
      "http://localhost:5173", // این خط را اضافه کن
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/book", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/site/auth", siteAuthRoutes);
app.use("/api/panel", panelRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/working-hours", workingHoursRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payment", paymentRoutes);

// ریدایرکت اجباری به https فقط در production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect("https://" + req.headers.host + req.url);
    }
    next();
  });
}

module.exports = app;
