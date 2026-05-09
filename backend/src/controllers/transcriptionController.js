import Transcription from "../models/Transcription.js";

export const createTranscription = async (req, res, next) => {
  try {
    const row = await Transcription.create({
      userId: req.user._id,
      type: req.body.type,
      title: req.body.title,
      transcript: req.body.transcript,
      sourceLang: req.body.sourceLang ?? null,
      targetLang: req.body.targetLang ?? null,
      translation: req.body.translation ?? null,
      sourceUrl: req.body.sourceUrl ?? null,
      status: req.body.status ?? "completed",
      durationSeconds: req.body.durationSeconds ?? null,
      metadata: req.body.metadata ?? {},
    });
    res.status(201).json({ success: true, data: { id: String(row._id), item: row } });
  } catch (error) {
    next(error);
  }
};

export const listTranscriptions = async (req, res, next) => {
  try {
    const items = await Transcription.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
};

export const getTranscription = async (req, res, next) => {
  try {
    const item = await Transcription.findOne({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
};

export const updateTranscription = async (req, res, next) => {
  try {
    const patch = { ...req.body };
    const item = await Transcription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: patch },
      { new: true },
    );
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
};

export const deleteTranscription = async (req, res, next) => {
  try {
    await Transcription.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
