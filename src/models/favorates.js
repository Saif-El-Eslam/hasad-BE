import mongoose from "mongoose";

const favorateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    benefit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Benefit",
      required: true,
    },
  },
  { timestamps: true }
);
