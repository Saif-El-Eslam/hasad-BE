import { body, param } from "express-validator";
import foldersService from "../services/folders_service.js";

const isFolderExists = async (value, { req }) => {
  const folder = await foldersService.getFolderById(value);
  if (!folder) throw new Error("Folder not found");

  if (folder.user != req.user_id) throw new Error("Folder not found");

  return true;
};

const index = [];

const create = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  body("author").optional().isString().withMessage("Author must be a string"),
  body("image").custom((value, { req }) => {
    if (!req.file) {
      return true;
    }

    // Check if the file is an image (e.g., JPEG, PNG)
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Invalid file type. Only JPEG, or PNG are allowed.");
    }

    // Check the file size (e.g., limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      throw new Error("File size exceeds 5MB");
    }

    return true; // File is valid
  }),
];

const update = [
  body("name").optional().isString().withMessage("Name must be a string"),
  body("author").optional().isString().withMessage("Author must be a string"),
  body("image").custom((value, { req }) => {
    if (!req.file) {
      return true;
    }

    // Check if the file is an image (e.g., JPEG, PNG)
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Invalid file type. Only JPEG, or PNG are allowed.");
    }

    // Check the file size (e.g., limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      throw new Error("File size exceeds 5MB");
    }

    return true; // File is valid
  }),
  param("id")
    .notEmpty()
    .isMongoId()
    .withMessage("Folder ID must be a valid Mongo ID")
    .custom(isFolderExists),
];

const destroy = [
  param("id")
    .notEmpty()
    .isMongoId()
    .withMessage("Folder ID must be a valid Mongo ID")
    .custom(isFolderExists),
];

export default {
  index,
  create,
  update,
  destroy,
};
