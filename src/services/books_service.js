import Book from "../models/book.js";

// create a new book
const createBook = async (book) => {
  try {
    const newBook = new Book(book);
    const savedBook = await newBook.save();
    return savedBook;
  } catch (error) {
    throw new Error(error.message);
  }
};

// get all books
const getBooks = async (query = {}) => {
  try {
    // get books by query
    const books = await Book.find(query);
    return books;
  } catch (error) {
    throw new Error(error.message);
  }
};

// get a single book By Id
const getBookById = async (id) => {
  try {
    const book = await Book.findById(id);
    return book;
  } catch (error) {
    throw new Error(error.message);
  }
};

// update a book
const updateBook = async (id, book) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(id, book, {
      new: true,
    });
    return updatedBook;
  } catch (error) {
    throw new Error(error.message);
  }
};

// change the number of benefits in the book
const changeNumOfBenefits = async (id, numOfBenefits) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { $inc: { numOfBenefits: numOfBenefits } },
      { new: true }
    );
    return updatedBook;
  } catch (error) {
    throw new Error(error.message);
  }
};

// delete a book
const deleteBook = async (id) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(id);
    return deletedBook;
  } catch (error) {
    throw new Error(error.message);
  }
};

export default {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  changeNumOfBenefits,
  deleteBook,
};
