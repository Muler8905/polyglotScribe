import mongoose from "mongoose";

const userTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    credits: { type: Number, default: 0 },
    suspended: { type: Boolean, default: false },
    featureLive: { type: Boolean, default: true },
    featureFile: { type: Boolean, default: true },
    featureYoutube: { type: Boolean, default: true },
    featureTranslate: { type: Boolean, default: true },
    featureTts: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const UserToken = mongoose.model("UserToken", userTokenSchema);

export default UserToken;
