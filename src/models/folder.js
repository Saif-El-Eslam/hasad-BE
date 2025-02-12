import mongoose from "mongoose";
import { deleteFilesFromCloudinary } from "../middlewares/imageUploaderMiddleware.js";
import Book from "./book.js";
import Benefit from "./benefit.js";

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
  { timestamps: true }
);

folderSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function (doc) {
    deleteCallback(doc);
  }
);

const deleteCallback = async (folder) => {
  try {
    // Find all books associated with this folder
    const booksToDelete = await Book.find({ folder: folder._id });

    // Iterate over each book and delete associated resources
    for (const book of booksToDelete) {
      // Delete associated benefits
      await Benefit.deleteMany({ book: book._id });

      // Optionally, delete file from Cloudinary if the img_url exists
      if (book.img_url) {
        await deleteFilesFromCloudinary([book.img_url]);
      }

      // Delete the book
      await book.deleteOne();
    }

    // Optionally, delete file from Cloudinary if the img_url exists
    if (folder.img_url) {
      await deleteFilesFromCloudinary([folder.img_url]);
    }
  } catch (error) {
    console.error("Error during Folder post-delete middleware:", error.message);
  }
};

export default mongoose.model("Folder", folderSchema);
