import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import booksRoutes from "../controllers/books_controller.js";
import BenefitsRoutes from "./benefits_routes.js";
import booksValidation from "../validations/books_validation.js";
import { uploadSingleMiddleware } from "../middlewares/imageUploaderMiddleware.js";

const router = express.Router({ mergeParams: true }); // Allows access to params from the parent route

router.get("/", authenticate, booksValidation.index, booksRoutes.index);
router.post(
  "/",
  authenticate,
  uploadSingleMiddleware,
  booksValidation.create,
  booksRoutes.create
);
router.put(
  "/:id",
  authenticate,
  uploadSingleMiddleware,
  booksValidation.update,
  booksRoutes.update
);
router.delete(
  "/:id",
  authenticate,
  booksValidation.destroy,
  booksRoutes.destroy
);

router.use("/benefits", authenticate, BenefitsRoutes);

router.use("/:bookId/benefits", authenticate, BenefitsRoutes);

export default router;
