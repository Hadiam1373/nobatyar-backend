const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/:username/summary", reportController.getUserSummary);

module.exports = router;
