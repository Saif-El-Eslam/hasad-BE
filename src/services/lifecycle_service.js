import mongoose from "mongoose";
import Book from "../models/book.js";
import Folder from "../models/folder.js";
import Benefit from "../models/benefit.js";
import { enqueueCleanup, processCleanup } from "./asset_cleanup_service.js";

// Atlas/replica sets use atomic database work; standalone MongoDB remains supported.
const transactionSupport = new WeakMap();
export const databaseWork = async (work) => {
  const client = mongoose.connection.getClient();
  if (!transactionSupport.has(client)) {
    transactionSupport.set(
      client,
      mongoose.connection.db
        .admin()
        .command({ hello: 1 })
        .then((hello) => Boolean(hello.setName || hello.msg === "isdbgrid")),
    );
  }
  if (!(await transactionSupport.get(client))) return work(null);
  return mongoose.connection.transaction(work);
};

const removeBenefits = async (query, session) => {
  const benefits = await Benefit.find(query).session(session);
  if (!benefits.length) return;
  await enqueueCleanup(
    benefits.map((benefit) => benefit.img_url),
    session,
  );
  const counts = new Map();
  for (const benefit of benefits) {
    const result = await Benefit.deleteOne({ _id: benefit._id }, { session });
    if (result.deletedCount)
      counts.set(
        String(benefit.book),
        (counts.get(String(benefit.book)) || 0) + 1,
      );
  }
  for (const [book, count] of counts)
    await Book.updateOne(
      { _id: book },
      { $inc: { num_of_benefits: -count } },
      { session },
    );
};

const removeBook = async (book, session) => {
  await removeBenefits({ book: book._id }, session);
  await enqueueCleanup([book.img_url], session);
  const deleted = await Book.deleteOne({ _id: book._id }, { session });
  if (deleted.deletedCount && book.folder)
    await Folder.updateOne(
      { _id: book.folder },
      { $inc: { num_of_books: -1 } },
      { session },
    );
};

export const deleteResource = async (kind, query) => {
  const document = await databaseWork(async (session) => {
    const Model = { book: Book, folder: Folder, benefit: Benefit }[kind];
    const resource = await Model.findOne(query).session(session);
    if (!resource) return null;
    if (kind === "benefit")
      await removeBenefits({ _id: resource._id }, session);
    if (kind === "book") await removeBook(resource, session);
    if (kind === "folder") {
      const books = await Book.find({ folder: resource._id }).session(session);
      for (const book of books) await removeBook(book, session);
      await enqueueCleanup([resource.img_url], session);
      await Folder.deleteOne({ _id: resource._id }, { session });
    }
    return resource;
  });
  await processCleanup();
  return document;
};

export const createResource = (kind, values) =>
  databaseWork(async (session) => {
    const Model = kind === "book" ? Book : Benefit;
    if (kind === "book" && values.folder) {
      const result = await Folder.updateOne(
        { _id: values.folder, user: values.user },
        { $inc: { num_of_books: 1 } },
        { session },
      );
      if (!result.matchedCount) throw new Error("Folder not found");
    }
    if (kind === "benefit") {
      const result = await Book.updateOne(
        { _id: values.book, user: values.user },
        { $inc: { num_of_benefits: 1 } },
        { session },
      );
      if (!result.matchedCount) throw new Error("Book not found");
    }
    try {
      const document = new Model(values);
      return await document.save({ session });
    } catch (error) {
      // Standalone servers have no transactions; compensate a failed insert.
      if (!session && kind === "book" && values.folder)
        await Folder.updateOne(
          { _id: values.folder },
          { $inc: { num_of_books: -1 } },
        );
      if (!session && kind === "benefit")
        await Book.updateOne(
          { _id: values.book },
          { $inc: { num_of_benefits: -1 } },
        );
      throw error;
    }
  });
