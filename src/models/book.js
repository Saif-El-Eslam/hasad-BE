import mongoose from "mongoose";
import { deleteFilesFromCloudinary } from "../middlewares/imageUploaderMiddleware.js";
import Benefit from "./benefit.js";
import foldersService from "../services/folders_service.js";

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
    img_url: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

bookSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function (doc) {
    await deleteCallback(doc);
  }
);

const deleteCallback = async (book) => {
  try {
    await Benefit.deleteMany({ book: book._id });

    // Optionally, delete file from Cloudinary if the img_url exists
    if (book.img_url) await deleteFilesFromCloudinary([book.img_url]);

    // If there is a folder, update the number of books in the folder
    if (book.folder) await foldersService.changeNumOfBooks(book.folder, -1);
  } catch (error) {
    console.error("Error during Book post-delete middleware:", error.message);
  }
};

export default mongoose.model("Book", bookSchema);
