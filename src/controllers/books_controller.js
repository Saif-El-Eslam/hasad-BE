import { saveWithImage, createWithImage } from "../services/image_service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import booksService from "../services/books_service.js";
import { validationResult } from "express-validator";
import { getSortQuery } from "../utils/sort.js";

const index = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const query = {};
  if (req.user_id) query.user = req.user_id;
  if (req.params.folderId) query.folder = req.params.folderId;
  else query.folder = null;

  const { sortBy, sortDirection } = req.query;
  const sortQuery = getSortQuery(sortBy, sortDirection);

  return booksService
    .getBooks(query, sortQuery)
    .then((books) => {
      return res.status(200).json(books);
    })
    .catch((error) => {
      throw error;
    });
};

const create = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const book = {
    name: req.body.name,
    author: req.body.author,
    user: req.user_id,
    folder: req.params.folderId,
  };

  const newBook = await createWithImage(
    book,
    req.file,
    "books",
    booksService.createBook,
  );

  return res.status(201).json(newBook);
};

const update = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const book = await booksService.getBookById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  if (req.body.name) book.name = req.body.name;
  if (req.body.author) book.author = req.body.author;
  // folder: req.params.folderId,

  await saveWithImage(book, req.file, "books");

  return res.status(200).json(book);
};

const destroy = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const book = await booksService.deleteBook(req.params.id, req.user_id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  return res.status(200).json({ message: "Book deleted successfully" });
};

export default Object.fromEntries(
  Object.entries({
    index,
    create,
    update,
    destroy,
  }).map(([name, handler]) => [name, asyncHandler(handler)]),
);
