import booksService from "../services/books_service.js";
import foldersService from "../services/folders_service.js";
import { validationResult } from "express-validator";

const index = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const query = {};
  if (req.user_id) query.user = req.user_id;
  if (req.params.folderId) query.folder = req.params.folderId;

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

  const book = {
    name: req.body.name,
    author: req.body.author,
    user: req.user_id,
    folder: req.params.folderId,
  };

  booksService
    .createBook(book)
    .then((book) => {
      if (book.folder) {
        foldersService.changeNumOfBooks(book.folder, 1);
      }

      return res.status(201).json(book);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

const update = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const book = {
    name: req.body.name,
    author: req.body.author,
    folder: req.params.folderId,
  };

  booksService
    .updateBook(req.params.id, book)
    .then((book) => {
      return res.status(200).json(book);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

// with the validate_folder_book middleware
const destroy = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  booksService
    .deleteBook(req.params.id)
    .then((book) => {
      if (book.folder) {
        foldersService.changeNumOfBooks(book.folder, -1);
      }
      return res.status(200).json(book);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

export default {
  index,
  create,
  update,
  destroy,
};
