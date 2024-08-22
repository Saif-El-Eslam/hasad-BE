import { body, param } from "express-validator";
import booksService from "../services/books_service.js";
import foldersService from "../services/folders_service.js";

const isFolderExists = async (value, { req }) => {
  const folder = await foldersService.getFolderById(value);
  if (!folder) throw new Error("Folder not found");

  if (folder.user != req.user_id) throw new Error("Folder not found");

  return true;
};

const isBookExists = async (value, { req }) => {
  const book = await booksService.getBookById(value);
  if (!book) throw new Error("Book not found");

  if (book.user != req.user_id) throw new Error("Book not found");

  if (book.folder && !req.params.folderId)
    throw new Error("Folder ID not provided");

  return true;
};

const isBookMatchFolder = async (value, { req }) => {
  const folder = await foldersService.getFolderById(value);
  if (!folder) throw new Error("Folder not found");
  if (folder.user != req.user_id) throw new Error("Folder not found");

  const currBook = await booksService.getBookById(req.params.id);
  if (!currBook) throw new Error("Book not found");
  if (currBook.user != req.user_id) throw new Error("Book not found");

  if (!currBook.folder && value) throw new Error("Folder ID not expected");

  if (currBook.folder && currBook.folder != value)
    throw new Error("Book is in another folder");

  return true;
};

const index = [
  param("folderId")
    .optional()
    .isMongoId()
    .withMessage("Folder ID must be a valid Mongo ID")
    .custom(isFolderExists),
];

const create = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  body("author").optional().isString().withMessage("Author must be a string"),
  param("folderId")
    .optional()
    .isMongoId()
    .withMessage("Folder ID must be a valid Mongo ID")
    .custom(isFolderExists),
];

const update = [
  body("title").optional().isString().withMessage("Title must be a string"),
  body("author").optional().isString().withMessage("Author must be a string"),
  param("folderId")
    .optional()
    .isMongoId()
    .withMessage("Folder ID must be a valid Mongo ID")
    .custom(isBookMatchFolder),
  param("id")
    .notEmpty()
    .isMongoId()
    .withMessage("Book ID must be a valid Mongo ID")
    .custom(isBookExists),
];

const destroy = [
  param("folderId")
    .optional()
    .isMongoId()
    .withMessage("Folder ID must be a valid Mongo ID")
    .custom(isBookMatchFolder),
  param("id")
    .notEmpty()
    .isMongoId()
    .withMessage("Book ID must be a valid Mongo ID")
    .custom(isBookExists),
];

export default {
  index,
  create,
  update,
  destroy,
};
