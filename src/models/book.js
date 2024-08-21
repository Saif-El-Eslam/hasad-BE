import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      required: false,
    },
    num_of_benefits: {
      type: Number,
      default: 0,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
