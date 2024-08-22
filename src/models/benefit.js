import mongoose from "mongoose";

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
      enum: ["#DBE9FE", "#D7F6E5", "#F7DEE4", "#EFE9F5", "#F7F7D3"],
      default: "#DBE9FE",
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
