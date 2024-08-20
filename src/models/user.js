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
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
