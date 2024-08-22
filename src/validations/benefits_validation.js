import { body, param } from "express-validator";
import booksService from "../services/books_service.js";
import benefitsService from "../services/benefits_service.js";

const isBookExists = async (value, { req }) => {
  const book = await booksService.getBookById(value);
  if (!book) throw new Error("Book not found");
  if (book.user != req.user_id) throw new Error("Book not found");
  return true;
};

const isBenefitExists = async (value, { req }) => {
  const benefit = await benefitsService.getBenefitById(value);
  if (!benefit) throw new Error("Benefit not found");

  if (benefit.user != req.user_id) throw new Error("Benefit not found");
  if (benefit.book != req.params.bookId) throw new Error("Benefit not found");

  return true;
};

const validateColor = (value) => {
  const colors = ["#DBE9FE", "#D7F6E5", "#F7DEE4", "#EFE9F5", "#F7F7D3"];

  if (!colors.includes(value))
    throw new Error("Color must be one of our predefined colors");

  return true;
};

const index = [
  param("bookId")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid book id")
    .custom(isBookExists),
];

const create = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  body("content").optional().isString().withMessage("Content must be a string"),
  body("page_number")
    .notEmpty()
    .withMessage("Page number is required")
    .isInt()
    .withMessage("Page number must be an integer"),
  body("Image_url")
    .optional()
    .isURL()
    .withMessage("Image URL must be a valid URL"),
  body("color")
    .optional()
    .isHexColor()
    .withMessage("Color must be a valid hex color")
    .custom(validateColor)
    .withMessage("Color must be one of our predefined colors"),
  param("bookId")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid book id")
    .custom(isBookExists),
];

const update = [
  body("name").optional().isString().withMessage("Name must be a string"),
  body("content").optional().isString().withMessage("Content must be a string"),
  body("page_number")
    .optional()
    .isInt()
    .withMessage("Page number must be an integer"),
  body("Image_url")
    .optional()
    .isURL()
    .withMessage("Image URL must be a valid URL"),
  body("color")
    .optional()
    .isHexColor()
    .withMessage("Color must be a valid hex color")
    .custom(validateColor)
    .withMessage("Color must be one of our predefined colors"),
  param("bookId")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid book id")
    .custom(isBookExists),
  param("id")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid benefit id")
    .custom(isBenefitExists),
];

const destroy = [
  param("bookId")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid book id")
    .custom(isBookExists),
  param("id")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid benefit id")
    .custom(isBenefitExists),
];

const favourite = [
  param("bookId")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid book id")
    .custom(isBookExists),
  param("id")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid benefit id")
    .custom(isBenefitExists),
];

const unfavourite = [
  param("bookId")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid book id")
    .custom(isBookExists),
  param("id")
    .notEmpty()
    .isMongoId()
    .withMessage("Invalid benefit id")
    .custom(isBenefitExists),
];

const favourites = [];

export default {
  index,
  create,
  update,
  destroy,
  favourites,
  favourite,
  unfavourite,
};
