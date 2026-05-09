import mongoose from "mongoose";

const heroImageSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    caption: { type: String, default: null },
    sortOrder: { type: Number, default: 1, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const HeroImage = mongoose.model("HeroImage", heroImageSchema);

export default HeroImage;
