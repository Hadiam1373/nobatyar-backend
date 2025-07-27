const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");
const authMiddleware = require("../middlewares/authMiddleware");

// مسیرهای عمومی (بدون نیاز به احراز هویت)
router.get("/", planController.getAllPlans);
router.get("/:id", planController.getPlanById);

// مسیرهای ادمین (نیاز به احراز هویت)
router.post("/", authMiddleware, planController.createPlan);
router.put("/:id", authMiddleware, planController.updatePlan);
router.delete("/:id", authMiddleware, planController.deletePlan);

module.exports = router;
