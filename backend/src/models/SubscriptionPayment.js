import mongoose from "mongoose";

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    txRef: { type: String, required: true, unique: true, index: true },
    amountEtb: { type: Number, required: true },
    checkoutUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },
    creditsAwarded: { type: Number, default: 0 },
    chapaRef: { type: String, default: null },
  },
  { timestamps: true },
);

const SubscriptionPayment = mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);

export default SubscriptionPayment;
