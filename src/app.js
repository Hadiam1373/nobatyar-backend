const express = require("express");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const dotenv = require("dotenv");
const cors = require("cors");
const panelRoutes = require("./routes/panelRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const workingHoursRoutes = require("./routes/workingHoursRoutes");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/book", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/panel", panelRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/working-hours", workingHoursRoutes);

module.exports = app;
