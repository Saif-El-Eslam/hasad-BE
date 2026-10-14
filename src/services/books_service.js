import { createResource, deleteResource } from "./lifecycle_service.js";
import Book from "../models/book.js";

// create a new book
const createBook = (values) => createResource("book", values);

// get all books
const getBooks = async (query = {}, sort = { createdAt: -1 }) => {
  // get books by query
  const books = await Book.find(query).sort(sort);
  return books;
};

// get a single book By Id
const getBookById = async (id) => {
  const book = await Book.findById(id);
  return book;
};

// update a book
const updateBook = async (id, book) => {
  const updatedBook = await Book.findByIdAndUpdate(id, book, {
    new: true,
    runValidators: true,
  });
  return updatedBook;
};

// change the number of benefits in the book
const changeNumOfBenefits = async (id, numOfBenefits) => {
  const updatedBook = await Book.findByIdAndUpdate(
    id,
    { $inc: { num_of_benefits: numOfBenefits } },
    { new: true },
  );
  return updatedBook;
};

// delete a book
const deleteBook = (id, user) =>
  deleteResource("book", { _id: id, ...(user ? { user } : {}) });

export default {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  changeNumOfBenefits,
  deleteBook,
};
