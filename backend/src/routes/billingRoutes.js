import express from "express";
import { body, param } from "express-validator";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listPlans, listMyPayments, initiatePayment, verifyPayment, initiateEbirrPayment, verifyEbirrPayment, deletePaymentHistory } from "../controllers/billingController.js";

const router = express.Router();

router.get("/plans", listPlans);
router.get("/payments", protect, listMyPayments);
router.post("/payments/initiate", protect, body("planSlug").isString().notEmpty(), validate, initiatePayment);
router.post("/payments/verify", protect, body("txRef").isString().notEmpty(), validate, verifyPayment);
router.post("/payments/initiate-ebirr", protect, body("planSlug").isString().notEmpty(), body("mobile").isString().notEmpty(), validate, initiateEbirrPayment);
router.post("/payments/verify-ebirr", protect, body("txRef").isString().notEmpty(), validate, verifyEbirrPayment);
router.delete("/payments/:id", protect, param("id").isMongoId(), validate, deletePaymentHistory);

export default router;
