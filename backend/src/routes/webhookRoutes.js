import express from "express";
import { processWebhookByTxRef } from "../controllers/billingController.js";

const router = express.Router();

router.all("/chapa", async (req, res) => {
  let txRef = null;
  if (req.method === "GET") {
    txRef = req.query.tx_ref || req.query.trx_ref || null;
  } else {
    txRef = req.body?.tx_ref || req.body?.trx_ref || null;
  }
  if (!txRef) return res.status(400).send("missing tx_ref");
  await processWebhookByTxRef(String(txRef));
  return res.status(200).send("ok");
});

export default router;
