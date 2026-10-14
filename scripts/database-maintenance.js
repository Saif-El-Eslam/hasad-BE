import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { config } from "../src/config/index.js";
import User from "../src/models/user.js";
import Folder from "../src/models/folder.js";
import Book from "../src/models/book.js";
import Benefit from "../src/models/benefit.js";
import Challenge from "../src/models/otpChallenge.js";
import Cleanup from "../src/models/assetCleanup.js";

// Checking must never build indexes or rewrite existing data.
config.environment = "production";
try {
  await connectDB();
  const duplicates = await User.aggregate([
    { $group: { _id: "$email", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: "groups" },
  ]);
  const duplicateGroups = duplicates[0]?.groups || 0;
  console.log(JSON.stringify({ duplicateEmailGroups: duplicateGroups }));
  if (process.argv.includes("--apply")) {
    if (duplicateGroups)
      throw new Error(
        "Resolve duplicate email accounts before creating the unique index. No accounts were changed.",
      );
    for (const Model of [User, Folder, Book, Benefit, Challenge, Cleanup])
      await Model.createIndexes();
    console.log("Indexes created; existing indexes were preserved.");
  }
  if (process.argv.includes("--reconcile")) {
    // Run with application writes paused and a backup; no documents are removed.
    for await (const folder of Folder.find().cursor()) {
      await Folder.updateOne(
        { _id: folder._id },
        {
          $set: {
            num_of_books: await Book.countDocuments({ folder: folder._id }),
          },
        },
      );
    }
    for await (const book of Book.find().cursor()) {
      await Book.updateOne(
        { _id: book._id },
        {
          $set: {
            num_of_benefits: await Benefit.countDocuments({ book: book._id }),
          },
        },
      );
    }
    console.log("Counters reconciled.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
