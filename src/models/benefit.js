import mongoose from "mongoose";
import {
  benefitColors,
  benefitBorderColors,
  benefitColorBorderMap,
} from "../config/colors.js";
import { deleteFilesFromCloudinary } from "../middlewares/imageUploaderMiddleware.js";
import booksService from "../services/books_service.js";

const benefitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: false,
    },
    img_url: {
      type: String,
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    color: {
      type: String,
      enum: benefitColors,
      default: "#DBE9FE",
      required: false,
    },
    border_color: {
      type: String,
      enum: benefitBorderColors,
      default: benefitColorBorderMap.get("#DBE9FE"),
      required: false,
    },
    page_number: {
      type: Number,
      required: false,
    },
    favourated: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

benefitSchema.virtual("favourited", {
  ref: "Favourite",
  localField: "_id",
  foreignField: "benefit",
  justOne: true,
  count: true,
});

benefitSchema.set("toObject", { virtuals: true });
benefitSchema.set("toJSON", { virtuals: true });

benefitSchema.pre("deleteMany", async function (next) {
  const query = this.getQuery(); // This gets the query object
  try {
    // Find the documents that will be deleted using the query
    const benefitsToDelete = await Benefit.find(query);

    for (const benefit of benefitsToDelete) {
      deleteCallback(benefit);
    }

    // Proceed with the deleteMany operation
    next();
  } catch (error) {
    console.error("Error in Benefit pre-deleteMany hook:", error.message);
    next(error); // Pass the error to next middleware
  }
});

benefitSchema.pre("deleteOne", async function (next) {
  const benefit = await Benefit.findOne(this.getQuery()); // This gets the query object
  deleteCallback(benefit);

  next();
});

const deleteCallback = async (benefit) => {
  try {
    if (benefit.img_url) await deleteFilesFromCloudinary([benefit.img_url]);
    await booksService.changeNumOfBenefits(benefit.book, -1);
  } catch (error) {
    console.error(
      "Error during Benefit post-delete middleware:",
      error.message
    );
  }
};

const Benefit = mongoose.model("Benefit", benefitSchema);
export default Benefit;
