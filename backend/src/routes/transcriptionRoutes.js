import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createTranscription,
  listTranscriptions,
  getTranscription,
  updateTranscription,
  deleteTranscription,
} from "../controllers/transcriptionController.js";

const router = express.Router();

router.use(protect);
router.post("/", createTranscription);
router.get("/", listTranscriptions);
router.get("/:id", getTranscription);
router.patch("/:id", updateTranscription);
router.delete("/:id", deleteTranscription);

export default router;
