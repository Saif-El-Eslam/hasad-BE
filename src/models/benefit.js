import mongoose from "mongoose";
import {
  benefitColors,
  benefitBorderColors,
  benefitColorBorderMap,
} from "../config/colors.js";

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

export default mongoose.model("Benefit", benefitSchema);
