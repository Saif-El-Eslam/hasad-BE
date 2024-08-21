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
];

const update = [
  body("name").optional().isString().withMessage("Name must be a string"),
  body("author").optional().isString().withMessage("Author must be a string"),
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
