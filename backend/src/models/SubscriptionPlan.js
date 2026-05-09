import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    priceEtb: { type: Number, required: true },
    credits: { type: Number, required: true },
    highlight: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
