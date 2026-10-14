import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password_hash: {
      type: String,
      required: true,
      select: false,
    },
    profile_pic_url: {
      type: String,
      required: false,
    },
    color: {
      type: String,
      enum: ["#DBE9FE", "#D7F6E5", "#F7DEE4", "#EFE9F5", "#F7F7D3"],
      default: "#DBE9FE",
      required: false,
    },
    token: {
      select: false,
      type: String,
      required: false,
    },
    verified: {
      type: Boolean,
      default: false,
      required: false,
    },
    verify_otp: {
      select: false,
      type: String,
      required: false,
    },
    session_version: { type: Number, default: 0, select: false },
    img_url: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.set("toJSON", {
  transform: (_doc, user) => {
    for (const key of [
      "password_hash",
      "verify_otp",
      "token",
      "session_version",
    ])
      delete user[key];
    return user;
  },
});

export default mongoose.model("User", userSchema);
