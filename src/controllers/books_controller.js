import booksService from "../services/books_service.js";
import foldersService from "../services/folders_service.js";
import { validationResult } from "express-validator";
import {
  uploadSingleFileToCloudinary,
  deleteFilesFromCloudinary,
} from "../middlewares/imageUploaderMiddleware.js";

const index = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const query = {};
  if (req.user_id) query.user = req.user_id;
  if (req.params.folderId) query.folder = req.params.folderId;
  else query.folder = null;

  booksService
    .getBooks(query)
    .then((books) => {
      return res.status(200).json(books);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

const create = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  try {
    const book = {
      name: req.body.name,
      author: req.body.author,
      user: req.user_id,
      folder: req.params.folderId,
    };

    const folderName = "books";
    if (req.file) {
      const imageUrl = await uploadSingleFileToCloudinary(req.file, folderName);
      book.img_url = imageUrl;
    }

    const newBook = await booksService.createBook(book);
    if (newBook.folder) {
      foldersService.changeNumOfBooks(newBook.folder, 1);
    }

    return res.status(201).json(newBook);
  } catch (error) {
    console.log(error);
    return res.send(error.message).status(500);
  }
};

const update = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  try {
    const book = await booksService.getBookById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (req.body.name) book.name = req.body.name;
    if (req.body.author) book.author = req.body.author;
    // folder: req.params.folderId,

    if (book.img_url && req.file) {
      await deleteFilesFromCloudinary([book.img_url]);

      book.img_url = null;
      await book.save();
    }
    if (req.file) {
      const folderName = "books";
      const imageUrl = await uploadSingleFileToCloudinary(req.file, folderName);
      book.img_url = imageUrl;
    }

    await book.save();

    return res.status(200).json(book);
  } catch (error) {
    return res.send(error.message).status(500);
  }
};

const destroy = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  try {
    const book = await booksService.getBookById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.img_url) await deleteFilesFromCloudinary([book.img_url]);
    if (book.folder) {
      foldersService.changeNumOfBooks(book.folder, -1);
    }

    await book.deleteOne();

    return res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    return res.send(error.message).status(500);
  }
};

export default {
  index,
  create,
  update,
  destroy,
};
