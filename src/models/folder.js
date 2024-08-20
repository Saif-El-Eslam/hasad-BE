import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
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
    num_of_books: {
      type: Number,
      default: 0,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Folder", folderSchema);
