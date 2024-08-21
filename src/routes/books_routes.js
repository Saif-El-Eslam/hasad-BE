import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import booksRoutes from "../controllers/books_controller.js";
import booksValidation from "../validations/books_validation.js";

const router = express.Router({ mergeParams: true }); // Allows access to params from the parent route

router.get("/", authenticate, booksValidation.index, booksRoutes.index);
router.post("/", authenticate, booksValidation.create, booksRoutes.create);
router.put("/:id", authenticate, booksValidation.update, booksRoutes.update);
router.delete(
  "/:id",
  authenticate,
  booksValidation.destroy,
  booksRoutes.destroy
);

export default router;
