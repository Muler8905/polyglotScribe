import mongoose from "mongoose";

const userRoleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
  },
  { timestamps: true },
);

userRoleSchema.index({ userId: 1, role: 1 }, { unique: true });

const UserRole = mongoose.model("UserRole", userRoleSchema);

export default UserRole;
