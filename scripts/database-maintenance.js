import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { config } from "../src/config/index.js";
import User from "../src/models/user.js";
import Folder from "../src/models/folder.js";
import Book from "../src/models/book.js";
import Benefit from "../src/models/benefit.js";
import Challenge from "../src/models/otpChallenge.js";
import Cleanup from "../src/models/assetCleanup.js";
import Counter from "../src/models/rateLimitCounter.js";
import Mail from "../src/models/recoveryMail.js";
import { writeFile } from "node:fs/promises";

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
  if (process.argv.includes("--duplicates")) {
    const index = process.argv.indexOf("--report");
    const filename = index >= 0 ? process.argv[index + 1] : null;
    if (!filename)
      throw new Error(
        "Pass --report with a private file path for the duplicate report",
      );
    const groups = await User.aggregate([
      { $group: { _id: "$email", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);
    const report = [];
    for (const group of groups) {
      const accounts = [];
      for (const id of group.ids) {
        const [user, folders, books, benefits] = await Promise.all([
          User.findById(id).select("verified createdAt updatedAt"),
          Folder.countDocuments({ user: id }),
          Book.countDocuments({ user: id }),
          Benefit.countDocuments({ user: id }),
        ]);
        accounts.push({
          id,
          verified: user.verified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          folders,
          books,
          benefits,
        });
      }
      report.push({ email: group._id, accounts, resolution: null });
    }
    await writeFile(
      filename,
      JSON.stringify({ generatedAt: new Date(), groups: report }, null, 2),
      { mode: 0o600, flag: "wx" },
    );
    console.log(
      "Private duplicate report written. No accounts, ownership or sessions were changed.",
    );
  }
  if (process.argv.includes("--apply")) {
    if (duplicateGroups)
      throw new Error(
        "Resolve duplicate email accounts before creating the unique index. No accounts were changed.",
      );
    for (const Model of [
      User,
      Folder,
      Book,
      Benefit,
      Challenge,
      Cleanup,
      Counter,
      Mail,
    ])
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
