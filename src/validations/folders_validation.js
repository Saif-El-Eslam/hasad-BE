import { body } from "express-validator";

const create = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
];

const update = [
  body("name").optional().isString().withMessage("Name must be a string"),
  body("author").optional().isString().withMessage("Author must be a string"),
];

export default {
  create,
  update,
};
