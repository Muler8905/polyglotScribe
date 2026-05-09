import express from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listPlans, listMyPayments, initiatePayment, verifyPayment } from "../controllers/billingController.js";

const router = express.Router();

router.get("/plans", listPlans);
router.get("/payments", protect, listMyPayments);
router.post("/payments/initiate", protect, body("planSlug").isString().notEmpty(), validate, initiatePayment);
router.post("/payments/verify", protect, body("txRef").isString().notEmpty(), validate, verifyPayment);

export default router;
