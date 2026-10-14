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
    img_url: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

folderSchema.index({ user: 1, createdAt: -1 });
folderSchema.index({ user: 1, name: 1 });

export default mongoose.model("Folder", folderSchema);
